import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/currency';

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

interface LeaseRow {
  id: string;
  tenant_name: string;
  rent_amount: number;
  currency: 'USD' | 'SYP';
  frequency: 'monthly' | 'annual';
  start_date: string;
  end_date: string | null;
  property_id: string;
}

interface PortfolioOption {
  id: string;
  name: string;
  type: string;
}

const recordLeasePaymentSchema = z.object({
  amount: z.coerce.number({
    error: 'properties.leases.payment.validation.amountRequired',
  }).positive({ message: 'properties.leases.payment.validation.amountPositive' }),

  currency: z.enum(['USD', 'SYP'], {
    error: 'properties.leases.payment.validation.currencyRequired',
  }),

  exchange_rate: z.string()
    .refine(
      (v) => v === '' || v === undefined || !isNaN(parseFloat(v)),
      { message: 'properties.leases.payment.validation.rateInvalid' }
    )
    .refine(
      (v) => v === '' || v === undefined || parseFloat(v) > 0,
      { message: 'properties.leases.payment.validation.ratePositive' }
    )
    .optional(),

  paid_date: z.string()
    .min(1, { message: 'properties.leases.payment.validation.paidDateRequired' }),

  portfolio_id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),

  notes: z.string()
    .max(500, { message: 'properties.leases.payment.validation.notesTooLong' })
    .optional(),
});

type RecordLeasePaymentFormData = z.infer<typeof recordLeasePaymentSchema>;

const CURRENCIES = [
  { value: 'USD' as const, symbol: '$', labelKey: 'properties.leases.form.currencyUSD' },
  { value: 'SYP' as const, symbol: '£', labelKey: 'properties.leases.form.currencySYP' },
];

interface RecordLeasePaymentDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  lease:        LeaseRow;
  propertyId:   string;
}

export function RecordLeasePaymentDialog({
  open,
  onOpenChange,
  lease,
  propertyId,
}: RecordLeasePaymentDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, reset, watch, setValue,
          formState: { errors, isSubmitting } } =
    useForm<RecordLeasePaymentFormData>({
      resolver: zodResolver(recordLeasePaymentSchema) as unknown as Resolver<RecordLeasePaymentFormData>,
      defaultValues: {
        amount:        '' as unknown as number,
        currency:      undefined,
        exchange_rate: '',
        paid_date:     '',
        portfolio_id:  '',
        notes:         '',
      },
    });

  useEffect(() => {
    if (open) {
      reset({
        amount:        lease.rent_amount,
        currency:      lease.currency,
        exchange_rate: '',
        paid_date:     new Date().toISOString().split('T')[0],
        portfolio_id:  '',
        notes:         '',
      } as unknown as RecordLeasePaymentFormData);
    }
  }, [open, lease.id]);

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

  const onSubmit = async (data: RecordLeasePaymentFormData) => {
    const { error } = await supabaseClient.from('lease_payments').insert({
      lease_id:      lease.id,
      amount:        data.amount,
      currency:      data.currency,
      exchange_rate: data.exchange_rate ? parseFloat(data.exchange_rate) : null,
      paid_date:     data.paid_date,
      portfolio_id:  data.portfolio_id || null,
      notes:         data.notes?.trim() || null,
    });
    if (error) {
      toast.error(t('properties.leases.payment.toast.addError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['lease_payments', propertyId] });
    await queryClient.invalidateQueries({ queryKey: ['properties'] });
    toast.success(t('properties.leases.payment.toast.addSuccess'));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {t('properties.leases.payment.form.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {lease.tenant_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Lease context card */}
          <div className="rounded-lg bg-[#F1F5F9] px-3 py-2.5 space-y-0.5">
            <p className="text-sm font-medium text-[#1E293B]">{lease.tenant_name}</p>
            <p className="text-xs text-[#475569]">
              {formatCurrency(lease.rent_amount, lease.currency)}
              {' · '}
              {t(`properties.leases.form.frequency${
                lease.frequency === 'monthly' ? 'Monthly' : 'Annual'
              }`)}
            </p>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.payment.form.currencyLabel')}
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
              {t('properties.leases.payment.form.amountLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('amount')}
              type="number"
              min="0"
              step="0.01"
              placeholder={t('properties.leases.payment.form.amountPlaceholder')}
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
                {t('properties.leases.payment.form.exchangeRateLabel')}
                <span className="text-[#C0392B] ms-0.5">*</span>
              </Label>
              <Input
                {...register('exchange_rate')}
                type="number"
                min="0"
                step="1"
                placeholder={t('properties.leases.payment.form.exchangeRatePlaceholder')}
                className="font-mono focus-visible:ring-[#1E5DC4]"
              />
              <p className="text-xs text-[#94A3B8]">
                {latestRate != null
                  ? t('properties.leases.payment.form.exchangeRateHint')
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

          {/* Paid Date */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.payment.form.paidDateLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('paid_date')}
              type="date"
              className="focus-visible:ring-[#1E5DC4]"
            />
            {errors.paid_date && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.paid_date.message ?? '')}
              </p>
            )}
          </div>

          {/* Portfolio */}
          <div className="space-y-1.5">
            <Label>{t('properties.leases.payment.form.portfolioLabel')}</Label>
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
                      placeholder={t('properties.leases.payment.form.portfolioPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-[#94A3B8]">
                        {t('properties.leases.payment.form.noPortfolios')}
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
            <Label>{t('properties.leases.payment.form.notesLabel')}</Label>
            <Textarea
              {...register('notes')}
              rows={2}
              placeholder={t('properties.leases.payment.form.notesPlaceholder')}
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
              {t('properties.leases.payment.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 me-2" />
                  {t('properties.leases.payment.form.submitting')}
                </>
              ) : (
                t('properties.leases.payment.form.submitButton')
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
