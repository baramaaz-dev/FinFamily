import { useMemo }                     from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { Resolver }               from 'react-hook-form';
import { zodResolver }                 from '@hookform/resolvers/zod';
import { z }                           from 'zod';
import { useQuery }                    from '@tanstack/react-query';
import { useTranslation }              from 'react-i18next';
import { toast }                       from 'sonner';
import { Loader2, Trash2 }             from 'lucide-react';
import { supabaseClient }              from '@/lib/supabase';
import { findOpenPeriod }              from '@/lib/supabase/journalEntries';
import {
  useManualJournalEntries,
  useCreateJournalEntry,
  useDeleteJournalEntry,
} from '@/hooks/useJournalEntries';
import type { CreateJournalEntryPayload } from '@/types/journalEntry';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Button }   from '@/components/ui/button';
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const lineSchema = z.object({
  account_id:    z.string().min(1, 'الحساب مطلوب'),
  debit_amount:  z.string(),
  credit_amount: z.string(),
  currency:      z.enum(['USD', 'SYP']),
  exchange_rate: z.string().optional(),
  description:   z.string().optional(),
});

const journalSchema = z.object({
  entry_date:   z.string().min(1, 'التاريخ مطلوب'),
  description:  z.string().min(1, 'الوصف مطلوب'),
  reference_no: z.string().optional(),
  lines: z.array(lineSchema)
    .min(2, 'يجب أن يكون هناك سطران على الأقل')
    .superRefine((lines, ctx) => {
      lines.forEach((line, idx) => {
        const d = parseFloat(line.debit_amount) || 0;
        const c = parseFloat(line.credit_amount) || 0;
        if (d > 0 && c > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'لا يمكن إدخال مدين ودائن في نفس السطر',
            path: [idx, 'debit_amount'],
          });
        }
      });
      const totalD = lines.reduce((s, l) => s + (parseFloat(l.debit_amount)  || 0), 0);
      const totalC = lines.reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0);
      if (Math.abs(totalD - totalC) > 0.005) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'مجموع المدين يجب أن يساوي مجموع الدائن',
          path: [],
        });
      }
    }),
});

type JournalFormValues = z.infer<typeof journalSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyLine(): JournalFormValues['lines'][0] {
  return { account_id: '', debit_amount: '', credit_amount: '', currency: 'USD', exchange_rate: '', description: '' };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type AccountSlim = { id: string; code: string; name: string; account_class: string };

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const styles: Record<string, string> = {
    draft:    'bg-amber-50 text-amber-700',
    posted:   'bg-green-50 text-[#1A7D4F]',
    reversed: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.draft}`}>
      {t(`journal.status.${status}`)}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { t } = useTranslation();

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: entries, isLoading: entriesLoading } = useManualJournalEntries();
  const { mutate: createEntry, isPending: isCreating }  = useCreateJournalEntry();
  const { mutate: deleteEntry }                         = useDeleteJournalEntry();

  const { data: accounts } = useQuery({
    queryKey: ['accounts-postable'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('accounts')
        .select('id, code, name, account_class')
        .eq('is_postable', true)
        .eq('is_active', true)
        .order('code', { ascending: true });
      if (error) throw error;
      return data as AccountSlim[];
    },
  });

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema) as unknown as Resolver<JournalFormValues>,
    defaultValues: {
      entry_date:   '',
      description:  '',
      reference_no: '',
      lines: [emptyLine(), emptyLine()],
    },
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });

  // ── Derived ───────────────────────────────────────────────────────────────
  const watchedLines = form.watch('lines');
  const totalDebit   = watchedLines.reduce((s, l) => s + (parseFloat(l.debit_amount)  || 0), 0);
  const totalCredit  = watchedLines.reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0);
  const isBalanced   = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountSlim[]> = {};
    (accounts ?? []).forEach(a => {
      if (!groups[a.account_class]) groups[a.account_class] = [];
      groups[a.account_class]!.push(a);
    });
    return groups;
  }, [accounts, t]);

  const lineErr = (i: number, f: string): string | undefined =>
    (form.formState.errors.lines as Record<number, Record<string, { message?: string }>>)?.[i]?.[f]?.message;

  // ── Submit ────────────────────────────────────────────────────────────────
  async function onSubmit(values: JournalFormValues) {
    let period = null;
    try {
      period = await findOpenPeriod(values.entry_date);
    } catch {
      toast.error(t('journal.saveError'));
      return;
    }
    if (!period) {
      toast.error(t('journal.noPeriodError'));
      return;
    }

    const payload: CreateJournalEntryPayload = {
      period_id:    period.id,
      entry_date:   values.entry_date,
      reference_no: values.reference_no || null,
      description:  values.description,
      lines: values.lines.map(l => ({
        account_id:    l.account_id,
        debit_amount:  parseFloat(l.debit_amount)  || 0,
        credit_amount: parseFloat(l.credit_amount) || 0,
        currency:      l.currency,
        exchange_rate: l.exchange_rate ? parseFloat(l.exchange_rate) : null,
        description:   l.description || null,
      })),
    };

    createEntry(payload, {
      onSuccess: () => {
        toast.success(t('journal.saveSuccess'));
        form.reset({ entry_date: '', description: '', reference_no: '', lines: [emptyLine(), emptyLine()] });
      },
      onError: () => toast.error(t('journal.saveError')),
    });
  }

  const isBusy = isCreating || form.formState.isSubmitting;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-medium text-[#1E293B]">{t('journal.title')}</h1>
        <p className="text-sm text-[#475569] mt-1">{t('journal.subtitle')}</p>
      </div>

      {/* ── New entry form ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-medium text-[#1E293B] mb-4">{t('journal.newEntry')}</h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="entry_date" className="text-sm">{t('journal.entryDate')}</Label>
              <Input
                id="entry_date"
                type="date"
                {...form.register('entry_date')}
                className={form.formState.errors.entry_date ? 'border-[#C0392B]' : ''}
              />
              {form.formState.errors.entry_date?.message && (
                <p className="text-xs text-[#C0392B]">{form.formState.errors.entry_date.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="reference_no" className="text-sm">{t('journal.referenceNo')}</Label>
              <Input
                id="reference_no"
                {...form.register('reference_no')}
                placeholder={t('journal.referenceNoPlaceholder')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="jdesc" className="text-sm">{t('journal.description')}</Label>
              <Input
                id="jdesc"
                {...form.register('description')}
                placeholder={t('journal.descriptionPlaceholder')}
                className={form.formState.errors.description ? 'border-[#C0392B]' : ''}
              />
              {form.formState.errors.description?.message && (
                <p className="text-xs text-[#C0392B]">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Lines table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#475569] text-xs border-b border-slate-200">
                  <th className="text-start px-2 py-2 w-7 font-medium">#</th>
                  <th className="text-start px-2 py-2 font-medium">{t('journal.lineColumns.account')}</th>
                  <th className="text-start px-2 py-2 w-28 font-medium">{t('journal.lineColumns.debit')}</th>
                  <th className="text-start px-2 py-2 w-28 font-medium">{t('journal.lineColumns.credit')}</th>
                  <th className="text-start px-2 py-2 w-20 font-medium">{t('journal.lineColumns.currency')}</th>
                  <th className="text-start px-2 py-2 font-medium">{t('journal.lineColumns.lineDescription')}</th>
                  <th className="w-8" />
                </tr>
              </thead>

              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b border-slate-100 last:border-b-0">

                    {/* # */}
                    <td className="px-2 py-1.5 text-[#94A3B8] text-xs">{index + 1}</td>

                    {/* Account */}
                    <td className="px-1 py-1">
                      <Controller
                        control={form.control}
                        name={`lines.${index}.account_id`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger
                              className={`h-8 text-xs ${lineErr(index, 'account_id') ? 'border-[#C0392B]' : ''}`}
                            >
                              <SelectValue placeholder={t('journal.selectAccount')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {Object.entries(groupedAccounts).map(([cls, accs]) => (
                                <SelectGroup key={cls}>
                                  <SelectLabel className="text-xs text-[#475569] px-2 py-1">
                                    {t(`journal.accountGroups.${cls}`)}
                                  </SelectLabel>
                                  {accs.map(a => (
                                    <SelectItem key={a.id} value={a.id} className="text-xs">
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {lineErr(index, 'account_id') && (
                        <p className="text-xs text-[#C0392B] mt-0.5 px-1">{lineErr(index, 'account_id')}</p>
                      )}
                    </td>

                    {/* Debit */}
                    <td className="px-1 py-1 w-28">
                      <Input
                        {...form.register(`lines.${index}.debit_amount`)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        dir="ltr"
                        className={`h-8 text-xs font-mono text-right ${lineErr(index, 'debit_amount') ? 'border-[#C0392B]' : ''}`}
                      />
                      {lineErr(index, 'debit_amount') && (
                        <p className="text-xs text-[#C0392B] mt-0.5 px-1">{lineErr(index, 'debit_amount')}</p>
                      )}
                    </td>

                    {/* Credit */}
                    <td className="px-1 py-1 w-28">
                      <Input
                        {...form.register(`lines.${index}.credit_amount`)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        dir="ltr"
                        className="h-8 text-xs font-mono text-right"
                      />
                    </td>

                    {/* Currency */}
                    <td className="px-1 py-1 w-20">
                      <Controller
                        control={form.control}
                        name={`lines.${index}.currency`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD" className="text-xs">USD</SelectItem>
                              <SelectItem value="SYP" className="text-xs">SYP</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>

                    {/* Line description */}
                    <td className="px-1 py-1">
                      <Input
                        {...form.register(`lines.${index}.description`)}
                        placeholder={t('journal.lineDescriptionPlaceholder')}
                        className="h-8 text-xs"
                      />
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-1 w-8 text-center">
                      <button
                        type="button"
                        onClick={() => { if (fields.length > 2) remove(index); }}
                        disabled={fields.length <= 2}
                        title={t('journal.removeLine')}
                        className="text-[#C0392B] hover:text-red-700 disabled:text-slate-200 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Balance totals */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={2} className="px-3 py-2 text-xs text-[#475569] font-medium text-end">
                    {t('journal.total')}
                  </td>
                  <td className="px-2 py-2 text-xs font-mono font-semibold text-[#1E293B]" dir="ltr">
                    {fmt(totalDebit)}
                  </td>
                  <td className="px-2 py-2 text-xs font-mono font-semibold text-[#1E293B]" dir="ltr">
                    {fmt(totalCredit)}
                  </td>
                  <td colSpan={3} className="px-2 py-2">
                    {totalDebit > 0 && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isBalanced
                          ? 'bg-green-50 text-[#1A7D4F]'
                          : 'bg-red-50 text-[#C0392B]'
                      }`}>
                        {isBalanced ? t('journal.balanced') : t('journal.notBalanced')}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyLine())}
              className="text-xs"
            >
              + {t('journal.addLine')}
            </Button>

            <Button
              type="submit"
              disabled={!isBalanced || isBusy}
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white text-sm gap-2"
            >
              {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isBusy ? t('journal.saving') : t('journal.saveDraft')}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Entries log ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-medium text-[#1E293B]">{t('journal.entriesLog')}</h2>
        </div>

        {entriesLoading ? (
          <div className="p-6 space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#94A3B8]">
            {t('journal.noEntries')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[#475569] text-xs border-b border-slate-200">
                  <th className="text-start px-4 py-3 font-medium">{t('journal.columns.date')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('journal.columns.reference')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('journal.columns.description')}</th>
                  <th className="text-start px-4 py-3 font-medium">{t('journal.columns.status')}</th>
                  <th className="text-end px-4 py-3 font-medium font-mono">{t('journal.columns.debit')}</th>
                  <th className="text-end px-4 py-3 font-medium font-mono">{t('journal.columns.credit')}</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const ed = entry.lines.reduce((s, l) => s + l.debit_amount,  0);
                  const ec = entry.lines.reduce((s, l) => s + l.credit_amount, 0);
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-mono text-[#1E293B]">{entry.entry_date}</td>
                      <td className="px-4 py-3 text-xs text-[#475569]">{entry.reference_no ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#1E293B]">{entry.description}</td>
                      <td className="px-4 py-3"><StatusBadge status={entry.status} t={t} /></td>
                      <td className="px-4 py-3 text-xs font-mono text-end text-[#1E293B]" dir="ltr">{fmt(ed)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-end text-[#1E293B]" dir="ltr">{fmt(ec)}</td>
                      <td className="px-4 py-3 text-center">
                        {entry.status === 'draft' && (
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            title={t('journal.delete')}
                            className="text-[#C0392B] hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
