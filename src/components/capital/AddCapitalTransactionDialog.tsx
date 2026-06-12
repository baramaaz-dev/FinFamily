import { useEffect }                from 'react';
import { useForm, Controller }      from 'react-hook-form';
import { zodResolver }              from '@hookform/resolvers/zod';
import type { Resolver }            from 'react-hook-form';
import { z }                        from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePostJournalEntry }      from '@/hooks/usePostJournalEntry';
import { useTranslation }           from 'react-i18next';
import { toast }                    from 'sonner';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Textarea }  from '@/components/ui/textarea';
import { supabaseClient } from '@/lib/supabase';

// ─── Schema ───────────────────────────────────────────────────────────────────

const CAPITAL_TX_TYPES = [
  'capital_injection',
  'capital_reduction',
  'drawing',
  'profit_share',
  'loss_share',
] as const;

const addCapitalTransactionSchema = z.object({
  type: z.enum(CAPITAL_TX_TYPES, {
    error: 'capital.transactions.validation.typeRequired',
  }),
  amount: z.string()
    .min(1, { message: 'capital.transactions.validation.amountRequired' })
    .refine(v => !isNaN(parseFloat(v)), { message: 'capital.transactions.validation.amountInvalid' })
    .refine(v => parseFloat(v) > 0,    { message: 'capital.transactions.validation.amountPositive' }),
  currency: z.enum(['USD', 'SYP'], {
    error: 'capital.transactions.validation.currencyRequired',
  }),
  exchange_rate: z.string()
    .refine(v => v === '' || !isNaN(parseFloat(v)), { message: 'capital.transactions.validation.exchangeRateInvalid' })
    .refine(v => v === '' || parseFloat(v) > 0,     { message: 'capital.transactions.validation.exchangeRatePositive' })
    .optional(),
  date:         z.string().min(1, { message: 'capital.transactions.validation.dateRequired' }),
  reference_no: z.string().max(100).optional(),
  notes:        z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.currency === 'SYP' && (!data.exchange_rate || data.exchange_rate === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['exchange_rate'],
      message: 'capital.transactions.validation.exchangeRateRequired',
    });
  }
});

type AddCapitalTransactionFormData = z.infer<typeof addCapitalTransactionSchema>;

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchLatestExchangeRate(): Promise<number | null> {
  const { data, error } = await supabaseClient
    .from('exchange_rates')
    .select('rate')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.rate ?? null;
}

// ─── Color helper ─────────────────────────────────────────────────────────────

function typeActiveClass(type: AddCapitalTransactionFormData['type']): string {
  return type === 'capital_injection' || type === 'profit_share'
    ? 'bg-[#1A7D4F] text-white'
    : 'bg-[#C0392B] text-white';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SelectedCapitalAccount {
  id:           string;
  partner_name: string;
  entity_name:  string;
}

interface AddCapitalTransactionDialogProps {
  account:      SelectedCapitalAccount | null;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess:    () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddCapitalTransactionDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
}: AddCapitalTransactionDialogProps) {
  const { t }       = useTranslation();
  const queryClient = useQueryClient();
  const { post: postJournalEntry } = usePostJournalEntry('capital_transaction');

  const { data: latestRate } = useQuery({
    queryKey: ['latest-exchange-rate'],
    queryFn:  fetchLatestExchangeRate,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddCapitalTransactionFormData>({
    resolver: zodResolver(addCapitalTransactionSchema) as unknown as Resolver<AddCapitalTransactionFormData>,
    defaultValues: {
      type:         'capital_injection',
      amount:       '',
      currency:     'USD',
      exchange_rate: '',
      date:          new Date().toISOString().split('T')[0],
      reference_no:  '',
      notes:         '',
    },
  });

  const watchedCurrency = watch('currency');

  useEffect(() => {
    if (watchedCurrency === 'SYP' && latestRate != null) {
      setValue('exchange_rate', String(latestRate));
    } else if (watchedCurrency === 'USD') {
      setValue('exchange_rate', '');
    }
  }, [watchedCurrency, latestRate, setValue]);

  // All hooks declared above — null guard comes after
  if (!account) return null;

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function onSubmit(data: AddCapitalTransactionFormData) {
    const { data: inserted, error } = await supabaseClient
      .from('capital_transactions')
      .insert({
        capital_account_id: account!.id,
        type:               data.type,
        amount:             parseFloat(data.amount),
        currency:           data.currency,
        exchange_rate:      data.currency === 'SYP' && data.exchange_rate
          ? parseFloat(data.exchange_rate)
          : null,
        date:               data.date,
        reference_no:       data.reference_no?.trim() || null,
        notes:              data.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error(t('capital.transactions.toast.createError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['capital-accounts'] });
    toast.success(t('capital.transactions.toast.createSuccess'));
    reset();
    onSuccess();
    if (inserted?.id) {
      await postJournalEntry(inserted.id);
    }
  }

  const contextSubtitle = t('capital.transactions.context')
    .replace('{partner}', account.partner_name)
    .replace('{entity}',  account.entity_name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('capital.transactions.addTitle')}</DialogTitle>
          <DialogDescription>{contextSubtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Transaction Type (2 rows: 3 + 2) */}
          <div className="space-y-1.5">
            <Label>{t('capital.transactions.form.type')}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {(['capital_injection', 'capital_reduction', 'drawing'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={[
                          'flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                          field.value === type
                            ? typeActiveClass(type)
                            : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0]',
                        ].join(' ')}
                      >
                        {t(`capital.transactions.types.${type}`)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {(['profit_share', 'loss_share'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={[
                          'flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                          field.value === type
                            ? typeActiveClass(type)
                            : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0]',
                        ].join(' ')}
                      >
                        {t(`capital.transactions.types.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            />
            {errors.type && (
              <p className="text-xs text-[#C0392B]">{t(errors.type.message ?? '')}</p>
            )}
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1.5">
              <Label>{t('capital.transactions.form.amount')}</Label>
              <Input
                {...register('amount')}
                placeholder={t('capital.transactions.form.amountPlaceholder')}
                inputMode="decimal"
                className="font-mono"
              />
              {errors.amount && (
                <p className="text-xs text-[#C0392B]">{t(errors.amount.message ?? '')}</p>
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t('capital.transactions.form.currency')}</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-1.5 h-10">
                    {(['USD', 'SYP'] as const).map(curr => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => field.onChange(curr)}
                        className={[
                          'flex-1 rounded-md text-sm font-medium transition-colors',
                          field.value === curr
                            ? curr === 'USD'
                              ? 'bg-[#1E5DC4] text-white'
                              : 'bg-[#B45309] text-white'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
                        ].join(' ')}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Exchange Rate (SYP only) */}
          {watchedCurrency === 'SYP' && (
            <div className="space-y-1.5">
              <Label>{t('capital.transactions.form.exchangeRate')}</Label>
              <Input
                {...register('exchange_rate')}
                placeholder={t('capital.transactions.form.exchangeRatePlaceholder')}
                inputMode="decimal"
              />
              <p className="text-xs text-[#475569] mt-1">
                {t('capital.transactions.form.exchangeRateHint')}
              </p>
              {errors.exchange_rate && (
                <p className="text-xs text-[#C0392B]">{t(errors.exchange_rate.message ?? '')}</p>
              )}
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label>{t('capital.transactions.form.date')}</Label>
            <Input
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-[#C0392B]">{t(errors.date.message ?? '')}</p>
            )}
          </div>

          {/* Reference No (optional) */}
          <div className="space-y-1.5">
            <Label>{t('capital.transactions.form.referenceNo')}</Label>
            <Input
              {...register('reference_no')}
              placeholder={t('capital.transactions.form.referenceNoPlaceholder')}
            />
            {errors.reference_no && (
              <p className="text-xs text-[#C0392B]">{t(errors.reference_no.message ?? '')}</p>
            )}
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <Label>{t('capital.transactions.form.notes')}</Label>
            <Textarea
              rows={2}
              {...register('notes')}
              placeholder={t('capital.transactions.form.notesPlaceholder')}
              className="resize-none"
            />
            {errors.notes && (
              <p className="text-xs text-[#C0392B]">{t(errors.notes.message ?? '')}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('capital.transactions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5DC4] hover:bg-[#1a52b0] text-white"
            >
              {isSubmitting
                ? t('capital.transactions.submitting')
                : t('capital.transactions.submit')}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
