import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePostJournalEntry }      from '@/hooks/usePostJournalEntry';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Loader2, Landmark, Wrench, Zap, Receipt,
  CalendarDays, CalendarRange, Calendar,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const addPropertyExpenseSchema = z.object({
  type: z.enum(['tax', 'maintenance', 'utilities', 'fees'], {
    error: 'properties.expenses.validation.typeRequired',
  }),

  currency: z.enum(['USD', 'SYP'], {
    error: 'properties.expenses.validation.currencyRequired',
  }),

  amount: z.coerce.number({
    error: 'properties.expenses.validation.amountRequired',
  }).positive({ message: 'properties.expenses.validation.amountPositive' }),

  exchange_rate: z.string()
    .refine(
      (v) => v === '' || v === undefined || !isNaN(parseFloat(v)),
      { message: 'properties.expenses.validation.rateInvalid' }
    )
    .refine(
      (v) => v === '' || v === undefined || parseFloat(v) > 0,
      { message: 'properties.expenses.validation.ratePositive' }
    )
    .optional(),

  due_date: z.string()
    .min(1, { message: 'properties.expenses.validation.dueDateRequired' }),

  paid_date: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),

  frequency: z.enum(['monthly', 'annual', 'once'], {
    error: 'properties.expenses.validation.frequencyRequired',
  }),

  portfolio_id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),

  notes: z.string()
    .max(500, { message: 'properties.expenses.validation.notesTooLong' })
    .optional(),
});

type AddPropertyExpenseFormData = z.infer<typeof addPropertyExpenseSchema>;

const EXPENSE_TYPES = [
  { value: 'tax'         as const, icon: Landmark, labelKey: 'properties.expenses.form.typeTax'         },
  { value: 'maintenance' as const, icon: Wrench,   labelKey: 'properties.expenses.form.typeMaintenance' },
  { value: 'utilities'   as const, icon: Zap,      labelKey: 'properties.expenses.form.typeUtilities'   },
  { value: 'fees'        as const, icon: Receipt,  labelKey: 'properties.expenses.form.typeFees'        },
];

const CURRENCIES = [
  { value: 'USD' as const, symbol: '$', labelKey: 'properties.leases.form.currencyUSD' },
  { value: 'SYP' as const, symbol: '£', labelKey: 'properties.leases.form.currencySYP' },
];

const FREQUENCIES = [
  { value: 'monthly' as const, icon: CalendarDays,  labelKey: 'properties.expenses.form.frequencyMonthly' },
  { value: 'annual'  as const, icon: CalendarRange, labelKey: 'properties.expenses.form.frequencyAnnual'  },
  { value: 'once'    as const, icon: Calendar,      labelKey: 'properties.expenses.form.frequencyOnce'    },
];

interface PortfolioOption {
  id: string;
  name: string;
  type: string;
}

interface AddPropertyExpenseDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  propertyId:   string;
  propertyName: string;
}

export function AddPropertyExpenseDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
}: AddPropertyExpenseDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { post: postJournalEntry } = usePostJournalEntry('property_expense');

  const { register, handleSubmit, control, reset, watch, setValue,
          formState: { errors, isSubmitting } } =
    useForm<AddPropertyExpenseFormData>({
      resolver: zodResolver(addPropertyExpenseSchema) as unknown as Resolver<AddPropertyExpenseFormData>,
      defaultValues: {
        type:          undefined,
        currency:      undefined,
        amount:        '' as unknown as number,
        exchange_rate: '',
        due_date:      '',
        paid_date:     '',
        frequency:     undefined,
        portfolio_id:  '',
        notes:         '',
      },
    });

  const watchedCurrency = watch('currency');

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: async (): Promise<PortfolioOption[]> => {
      const { data, error } = await supabaseClient
        .from('portfolios')
        .select('id, name, type')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const { data: latestRate } = useQuery({
    queryKey: ['latest-exchange-rate'],
    queryFn:  fetchLatestExchangeRate,
  });

  useEffect(() => {
    if (watchedCurrency === 'SYP' && latestRate != null) {
      setValue('exchange_rate', String(latestRate));
    } else if (watchedCurrency === 'USD') {
      setValue('exchange_rate', '');
    }
  }, [watchedCurrency, latestRate, setValue]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: AddPropertyExpenseFormData) => {
    const { data: inserted, error } = await supabaseClient.from('property_expenses').insert({
      property_id:   propertyId,
      type:          data.type,
      amount:        data.amount,
      currency:      data.currency,
      exchange_rate: data.exchange_rate ? parseFloat(data.exchange_rate) : null,
      due_date:      data.due_date,
      paid_date:     data.paid_date || null,
      is_recurring:  data.frequency !== 'once',
      frequency:     data.frequency,
      portfolio_id:  data.portfolio_id || null,
      notes:         data.notes?.trim() || null,
    }).select().single();
    if (error) {
      toast.error(t('properties.expenses.toast.addError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['property_expenses', propertyId] });
    toast.success(t('properties.expenses.toast.addSuccess'));
    handleOpenChange(false);
    if (inserted?.id) {
      await postJournalEntry(inserted.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[540px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {t('properties.expenses.form.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#475569]">
            {propertyName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Type */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.expenses.form.typeLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-4 gap-2">
                    {EXPENSE_TYPES.map((et) => {
                      const isSelected = field.value === et.value;
                      const Icon = et.icon;
                      return (
                        <button
                          key={et.value}
                          type="button"
                          onClick={() => field.onChange(et.value)}
                          className={[
                            'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] font-medium">{t(et.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fieldState.error && (
                    <p className="text-[#C0392B] text-xs mt-1">
                      {t(fieldState.error.message ?? '')}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.expenses.form.currencyLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="currency"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {CURRENCIES.map((c) => {
                      const isSelected = field.value === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            field.onChange(c.value);
                            setValue('exchange_rate', '');
                          }}
                          className={[
                            'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <span className="text-lg font-mono">{c.symbol}</span>
                          <span className="text-xs font-medium">{t(c.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fieldState.error && (
                    <p className="text-[#C0392B] text-xs mt-1">
                      {t(fieldState.error.message ?? '')}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.expenses.form.amountLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('amount')}
              type="number"
              min="0"
              step="0.01"
              placeholder={t('properties.expenses.form.amountPlaceholder')}
              className="font-mono focus-visible:ring-[#1E5DC4]"
            />
            {errors.amount && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.amount.message ?? '')}
              </p>
            )}
          </div>

          {/* Exchange Rate — SYP only */}
          {watchedCurrency === 'SYP' && (
            <div className="space-y-1.5">
              <Label>
                {t('properties.expenses.form.exchangeRateLabel')}
                <span className="text-[#C0392B] ms-0.5">*</span>
              </Label>
              <Input
                {...register('exchange_rate')}
                type="number"
                min="0"
                step="1"
                placeholder={t('properties.expenses.form.exchangeRatePlaceholder')}
                className="font-mono focus-visible:ring-[#1E5DC4]"
              />
              <p className="text-xs text-[#94A3B8]">
                {latestRate != null
                  ? t('properties.expenses.form.exchangeRateHint')
                      .replace('{rate}', Number(latestRate).toLocaleString('ar-SA'))
                  : t('exchangeRates.form.rateHint')}
              </p>
              {errors.exchange_rate && (
                <p className="text-[#C0392B] text-xs mt-1">
                  {t(errors.exchange_rate.message ?? '')}
                </p>
              )}
            </div>
          )}

          {/* Due Date + Paid Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                {t('properties.expenses.form.dueDateLabel')}
                <span className="text-[#C0392B] ms-0.5">*</span>
              </Label>
              <Input
                {...register('due_date')}
                type="date"
                className="focus-visible:ring-[#1E5DC4]"
              />
              {errors.due_date && (
                <p className="text-[#C0392B] text-xs mt-1">
                  {t(errors.due_date.message ?? '')}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('properties.expenses.form.paidDateLabel')}</Label>
              <Input
                {...register('paid_date')}
                type="date"
                className="focus-visible:ring-[#1E5DC4]"
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.expenses.form.frequencyLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENCIES.map((freq) => {
                      const isSelected = field.value === freq.value;
                      const Icon = freq.icon;
                      return (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => field.onChange(freq.value)}
                          className={[
                            'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{t(freq.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {fieldState.error && (
                    <p className="text-[#C0392B] text-xs mt-1">
                      {t(fieldState.error.message ?? '')}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Portfolio */}
          <div className="space-y-1.5">
            <Label>{t('properties.expenses.form.portfolioLabel')}</Label>
            <Controller
              name="portfolio_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="focus:ring-[#1E5DC4] border-[#E2E8F0]">
                    <SelectValue
                      placeholder={t('properties.expenses.form.portfolioPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-[#94A3B8]">
                        {t('properties.expenses.form.portfolioPlaceholder')}
                      </div>
                    ) : (
                      portfolios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t('properties.expenses.form.notesLabel')}</Label>
            <Textarea
              {...register('notes')}
              rows={2}
              placeholder={t('properties.expenses.form.notesPlaceholder')}
              className="resize-none focus-visible:ring-[#1E5DC4]"
            />
            {errors.notes && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              {t('properties.expenses.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 me-2" />
                  {t('properties.expenses.form.submitting')}
                </>
              ) : (
                t('properties.expenses.form.submitButton')
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
