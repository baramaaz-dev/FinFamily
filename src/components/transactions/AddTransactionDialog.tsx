import { useTranslation }           from 'react-i18next';
import { useForm, Controller }      from 'react-hook-form';
import type { Resolver }            from 'react-hook-form';
import { zodResolver }              from '@hookform/resolvers/zod';
import { z }                        from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format }                   from 'date-fns';
import { toast }                    from 'sonner';
import { supabaseClient }           from '@/lib/supabase';
import { cn }                       from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
}                                   from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}                                   from '@/components/ui/select';
import { Input }                    from '@/components/ui/input';
import { Textarea }                 from '@/components/ui/textarea';
import { Button }                   from '@/components/ui/button';
import { Label }                    from '@/components/ui/label';

// ─── Types and schema ─────────────────────────────────────────────────────────

interface AddTransactionDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

interface PortfolioOption {
  id:   string;
  name: string;
}

const addTransactionSchema = z.object({
  portfolio_id: z.string().min(1, { message: 'transactions.validation.portfolioRequired' }),
  type: z.enum(['income', 'expense', 'transfer'], {
    error: 'transactions.validation.typeRequired',
  }),
  amount: z.coerce.number()
    .positive({ message: 'transactions.validation.amountPositive' }),
  currency: z.enum(['USD', 'SYP'], {
    error: 'transactions.validation.currencyRequired',
  }),
  date: z.string().min(1, { message: 'transactions.validation.dateRequired' }),
  category: z.string().max(100, { message: 'transactions.validation.categoryTooLong' }).optional(),
  notes: z.string().max(500, { message: 'transactions.validation.notesTooLong' }).optional(),
});

type AddTransactionFormData = z.infer<typeof addTransactionSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeBadgeClass(type: 'income' | 'expense' | 'transfer'): string {
  const map = {
    income:   'bg-[#EBF5F0] text-[#1A7D4F]',
    expense:  'bg-[#FEF0EF] text-[#C0392B]',
    transfer: 'bg-[#E8F0FB] text-[#1E5DC4]',
  };
  return map[type];
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchPortfolioOptions(): Promise<PortfolioOption[]> {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select('id, name')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddTransactionDialog({
  open,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { t }       = useTranslation();
  const queryClient = useQueryClient();

  const { data: portfolioOptions = [], isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios-simple'],
    queryFn:  fetchPortfolioOptions,
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddTransactionFormData>({
    resolver: zodResolver(addTransactionSchema) as unknown as Resolver<AddTransactionFormData>,
    defaultValues: {
      portfolio_id: '',
      type:         'income',
      amount:       '' as unknown as number,
      currency:     'USD',
      date:         format(new Date(), 'yyyy-MM-dd'),
      category:     '',
      notes:        '',
    },
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { error } = await supabaseClient
        .from('transactions')
        .insert({
          portfolio_id:  data.portfolio_id,
          type:          data.type,
          amount:        data.amount,
          currency:      data.currency,
          exchange_rate: null,
          category:      data.category || null,
          date:          data.date,
          notes:         data.notes || null,
        });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(t('transactions.toast.addSuccess'));
      handleClose();
    } catch {
      toast.error(t('transactions.toast.addError'));
    }
  });

  const watchedType     = watch('type');
  const watchedCurrency = watch('currency');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#1E293B]">
            {t('transactions.dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">

          {/* FIELD 1 — Transaction Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('transactions.form.type')}
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['income', 'expense', 'transfer'] as const).map((txType) => (
                    <button
                      key={txType}
                      type="button"
                      onClick={() => field.onChange(txType)}
                      className={cn(
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        field.value === txType
                          ? typeBadgeClass(txType)
                          : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
                      )}
                    >
                      {t(`transactions.types.${txType}`)}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.type && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.type.message ?? '')}
              </p>
            )}
          </div>

          {/* FIELD 2 — Portfolio */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('transactions.form.portfolio')}
            </Label>
            <Controller
              name="portfolio_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={portfoliosLoading}
                >
                  <SelectTrigger className="border-[#E2E8F0] focus:ring-[#1E5DC4]">
                    <SelectValue placeholder={t('transactions.form.portfolioPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolioOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.portfolio_id && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.portfolio_id.message ?? '')}
              </p>
            )}
          </div>

          {/* FIELD 3 — Amount + Currency side by side */}
          <div className="flex gap-3">

            {/* Amount — 3/5 */}
            <div className="flex-[3] space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('transactions.form.amount')}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={t('transactions.form.amountPlaceholder')}
                className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-xs text-[#C0392B] mt-1">
                  {t(errors.amount.message ?? '')}
                </p>
              )}
            </div>

            {/* Currency — 2/5 */}
            <div className="flex-[2] space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('transactions.form.currency')}
              </Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-1.5">
                    {(['USD', 'SYP'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => field.onChange(curr)}
                        className={cn(
                          'flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                          field.value === curr
                            ? 'bg-[#1E5DC4] text-white'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
                        )}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

          </div>

          {/* FIELD 4 — Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('transactions.form.date')}
            </Label>
            <Input
              type="date"
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.date.message ?? '')}
              </p>
            )}
          </div>

          {/* FIELD 5 — Category (optional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('transactions.form.category')}
            </Label>
            <Input
              type="text"
              placeholder={t('transactions.form.categoryPlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('category')}
            />
            {errors.category && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.category.message ?? '')}
              </p>
            )}
          </div>

          {/* FIELD 6 — Notes (optional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('transactions.form.notes')}
            </Label>
            <Textarea
              rows={3}
              placeholder={t('transactions.form.notesPlaceholder')}
              className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
            >
              {t('transactions.dialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
            >
              {isSubmitting
                ? t('transactions.dialog.submitting')
                : t('transactions.dialog.submit')}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
