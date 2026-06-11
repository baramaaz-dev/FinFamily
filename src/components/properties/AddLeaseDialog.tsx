import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, CalendarDays, CalendarRange } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const addLeaseSchema = z.object({
  tenant_name: z.string()
    .min(1, { message: 'properties.leases.validation.tenantRequired' })
    .max(200, { message: 'properties.leases.validation.tenantTooLong' }),

  currency: z.enum(['USD', 'SYP'], {
    error: 'properties.leases.validation.currencyRequired',
  }),

  rent_amount: z.coerce.number({
    error: 'properties.leases.validation.amountRequired',
  })
    .positive({ message: 'properties.leases.validation.amountPositive' }),

  frequency: z.enum(['monthly', 'annual'], {
    error: 'properties.leases.validation.frequencyRequired',
  }),

  start_date: z.string()
    .min(1, { message: 'properties.leases.validation.startDateRequired' }),

  end_date: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),
});

type AddLeaseFormData = z.infer<typeof addLeaseSchema>;

const CURRENCIES = [
  { value: 'USD' as const, symbol: '$', labelKey: 'properties.leases.form.currencyUSD' },
  { value: 'SYP' as const, symbol: '£', labelKey: 'properties.leases.form.currencySYP' },
];

const FREQUENCIES = [
  { value: 'monthly' as const, icon: CalendarDays,  labelKey: 'properties.leases.form.frequencyMonthly' },
  { value: 'annual'  as const, icon: CalendarRange, labelKey: 'properties.leases.form.frequencyAnnual'  },
];

interface AddLeaseDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  propertyId:   string;
  propertyName: string;
}

export function AddLeaseDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
}: AddLeaseDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, reset,
          formState: { errors, isSubmitting } } =
    useForm<AddLeaseFormData>({
      resolver: zodResolver(addLeaseSchema) as unknown as Resolver<AddLeaseFormData>,
      defaultValues: {
        tenant_name: '',
        currency:    undefined,
        rent_amount: '' as unknown as number,
        frequency:   undefined,
        start_date:  '',
        end_date:    '',
      },
    });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: AddLeaseFormData) => {
    const { error } = await supabaseClient.from('leases').insert({
      property_id: propertyId,
      tenant_name: data.tenant_name.trim(),
      rent_amount: data.rent_amount,
      currency:    data.currency,
      frequency:   data.frequency,
      start_date:  data.start_date,
      end_date:    data.end_date || null,
    });
    if (error) {
      toast.error(t('properties.leases.toast.addError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['leases', propertyId] });
    toast.success(t('properties.leases.toast.addSuccess'));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[520px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#1E293B]">
            {t('properties.leases.form.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#475569]">
            {propertyName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Tenant Name */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.form.tenantLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('tenant_name')}
              placeholder={t('properties.leases.form.tenantPlaceholder')}
              className="focus-visible:ring-[#1E5DC4]"
            />
            {errors.tenant_name && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.tenant_name.message ?? '')}
              </p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.form.currencyLabel')}
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
                          onClick={() => field.onChange(c.value)}
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

          {/* Rent Amount */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.form.amountLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('rent_amount')}
              type="number"
              min="0"
              step="0.01"
              placeholder={t('properties.leases.form.amountPlaceholder')}
              className="font-mono focus-visible:ring-[#1E5DC4]"
            />
            {errors.rent_amount && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.rent_amount.message ?? '')}
              </p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label>
              {t('properties.leases.form.frequencyLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCIES.map((freq) => {
                      const isSelected = field.value === freq.value;
                      const Icon = freq.icon;
                      return (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => field.onChange(freq.value)}
                          className={[
                            'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <Icon className="h-5 w-5" />
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                {t('properties.leases.form.startDateLabel')}
                <span className="text-[#C0392B] ms-0.5">*</span>
              </Label>
              <Input
                {...register('start_date')}
                type="date"
                className="focus-visible:ring-[#1E5DC4]"
              />
              {errors.start_date && (
                <p className="text-[#C0392B] text-xs mt-1">
                  {t(errors.start_date.message ?? '')}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('properties.leases.form.endDateLabel')}</Label>
              <Input
                {...register('end_date')}
                type="date"
                className="focus-visible:ring-[#1E5DC4]"
              />
            </div>
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
              {t('properties.leases.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 me-2" />
                  {t('properties.leases.form.submitting')}
                </>
              ) : (
                t('properties.leases.form.submitButton')
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
