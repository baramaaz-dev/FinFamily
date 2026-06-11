import { useEffect }                         from 'react';
import { useForm, Controller }               from 'react-hook-form';
import type { Resolver }                     from 'react-hook-form';
import { zodResolver }                       from '@hookform/resolvers/zod';
import { z }                                 from 'zod';
import { useTranslation }                    from 'react-i18next';
import { useQuery, useQueryClient }          from '@tanstack/react-query';
import { Loader2 }                           from 'lucide-react';
import { toast }                             from 'sonner';
import { supabaseClient }                    from '@/lib/supabase';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
}                                            from '@/components/ui/dialog';
import { Input }                             from '@/components/ui/input';
import { Label }                             from '@/components/ui/label';
import { Textarea }                          from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
}                                            from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EntityOption {
  id:   string;
  name: string;
}

interface AddWithdrawalDialogProps {
  open:             boolean;
  onOpenChange:     (open: boolean) => void;
  personId:         string;
  portfolioOptions: EntityOption[];
  propertyOptions:  EntityOption[];
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const addWithdrawalSchema = z.object({
  entity_type: z.enum(['portfolio', 'property'], {
    error: 'partners.withdrawalForm.validation.entityTypeRequired',
  }),
  entity_id: z.string().min(1, {
    message: 'partners.withdrawalForm.validation.entityRequired',
  }),
  amount: z.string().refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    { message: 'partners.withdrawalForm.validation.amountRequired' }
  ),
  currency: z.enum(['USD', 'SYP'], {
    error: 'partners.withdrawalForm.validation.currencyRequired',
  }),
  exchange_rate: z.string().optional(),
  date: z.string().min(1, {
    message: 'partners.withdrawalForm.validation.dateRequired',
  }),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.currency === 'SYP') {
    const rate = parseFloat(data.exchange_rate ?? '');
    if (isNaN(rate) || rate <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exchange_rate'],
        message: 'partners.withdrawalForm.validation.exchangeRateRequired',
      });
    }
  }
});

type AddWithdrawalFormData = z.infer<typeof addWithdrawalSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddWithdrawalDialog({
  open,
  onOpenChange,
  personId,
  portfolioOptions,
  propertyOptions,
}: AddWithdrawalDialogProps) {

  const { t }          = useTranslation();
  const queryClient    = useQueryClient();

  const { data: latestRate } = useQuery({
    queryKey: ['latest-exchange-rate'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('exchange_rates')
        .select('rate')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddWithdrawalFormData>({
    resolver: zodResolver(addWithdrawalSchema) as unknown as Resolver<AddWithdrawalFormData>,
    defaultValues: {
      entity_type:   'portfolio',
      entity_id:     '',
      amount:        '',
      currency:      'USD',
      exchange_rate: '',
      date:          '',
      notes:         '',
    },
  });

  const watchedEntityType = watch('entity_type');
  const watchedCurrency   = watch('currency');

  useEffect(() => {
    setValue('entity_id', '');
  }, [watchedEntityType, setValue]);

  useEffect(() => {
    if (watchedCurrency === 'SYP' && latestRate?.rate) {
      setValue('exchange_rate', String(latestRate.rate));
    }
    if (watchedCurrency === 'USD') {
      setValue('exchange_rate', '');
    }
  }, [watchedCurrency, latestRate, setValue]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = async (data: AddWithdrawalFormData) => {
    const { error } = await supabaseClient
      .from('distributions')
      .insert({
        partner_id:    personId,
        entity_type:   data.entity_type,
        entity_id:     data.entity_id,
        amount:        parseFloat(data.amount),
        currency:      data.currency,
        exchange_rate:
          data.currency === 'SYP' ? parseFloat(data.exchange_rate!) : null,
        date:  data.date,
        notes: data.notes?.trim() || null,
      });

    if (error) {
      toast.error(t('partners.withdrawalForm.toast.error'));
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ['partner-withdrawals', personId],
    });
    toast.success(t('partners.withdrawalForm.toast.success'));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[480px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-start text-base font-medium text-[#1E293B]">
            {t('partners.withdrawalForm.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('partners.withdrawalForm.dialogTitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* ENTITY TYPE TOGGLE */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('partners.withdrawalForm.form.entityType')}
            </Label>
            <Controller
              name="entity_type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['portfolio', 'property'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                        field.value === type
                          ? 'bg-[#1E5DC4] text-white'
                          : 'border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {t(
                        type === 'portfolio'
                          ? 'partners.withdrawalForm.form.entityPortfolio'
                          : 'partners.withdrawalForm.form.entityProperty'
                      )}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* ENTITY SELECT */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('partners.withdrawalForm.form.entity')}
            </Label>
            {(() => {
              const options =
                watchedEntityType === 'portfolio' ? portfolioOptions : propertyOptions;
              return (
                <Controller
                  name="entity_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                      disabled={options.length === 0}
                    >
                      <SelectTrigger className="w-full border-[#E2E8F0] text-start focus:ring-[#1E5DC4]">
                        <SelectValue
                          placeholder={
                            options.length === 0
                              ? t('partners.withdrawalForm.form.noEntities')
                              : t('partners.withdrawalForm.form.entityPlaceholder')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              );
            })()}
            {errors.entity_id && (
              <p className="text-xs text-[#C0392B]">
                {t(errors.entity_id.message ?? '')}
              </p>
            )}
          </div>

          {/* AMOUNT + CURRENCY TOGGLE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('partners.withdrawalForm.form.amount')}
              </Label>
              <Input
                {...register('amount')}
                inputMode="decimal"
                placeholder={t('partners.withdrawalForm.form.amountPlaceholder')}
                className="border-[#E2E8F0] font-mono focus-visible:ring-[#1E5DC4]"
                dir="ltr"
              />
              {errors.amount && (
                <p className="text-xs text-[#C0392B]">
                  {t(errors.amount.message ?? '')}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('partners.withdrawalForm.form.currency')}
              </Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {(['USD', 'SYP'] as const).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => field.onChange(cur)}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-mono transition-colors ${
                          field.value === cur
                            ? 'bg-[#1E5DC4] text-white'
                            : 'border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          {/* EXCHANGE RATE — visible only when SYP */}
          {watchedCurrency === 'SYP' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('partners.withdrawalForm.form.exchangeRate')}
              </Label>
              <Input
                {...register('exchange_rate')}
                inputMode="decimal"
                placeholder={t('partners.withdrawalForm.form.exchangeRatePlaceholder')}
                className="border-[#E2E8F0] font-mono focus-visible:ring-[#1E5DC4]"
                dir="ltr"
              />
              {errors.exchange_rate && (
                <p className="text-xs text-[#C0392B]">
                  {t(errors.exchange_rate.message ?? '')}
                </p>
              )}
            </div>
          )}

          {/* DATE */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('partners.withdrawalForm.form.date')}
            </Label>
            <Input
              {...register('date')}
              type="date"
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              dir="ltr"
            />
            {errors.date && (
              <p className="text-xs text-[#C0392B]">
                {t(errors.date.message ?? '')}
              </p>
            )}
          </div>

          {/* NOTES */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('partners.withdrawalForm.form.notes')}
            </Label>
            <Textarea
              {...register('notes')}
              placeholder={t('partners.withdrawalForm.form.notesPlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4] resize-none"
              rows={2}
            />
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50"
            >
              {t('partners.withdrawalForm.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? t('partners.withdrawalForm.submitting')
                : t('partners.withdrawalForm.submit')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
