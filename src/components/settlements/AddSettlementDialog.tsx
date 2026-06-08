import { useEffect }                from 'react';
import { useForm, Controller }      from 'react-hook-form';
import { zodResolver }              from '@hookform/resolvers/zod';
import type { Resolver }            from 'react-hook-form';
import { z }                        from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation }           from 'react-i18next';
import { toast }                    from 'sonner';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabaseClient } from '@/lib/supabase';

// ─── Schema ───────────────────────────────────────────────────────────────────

const addSettlementSchema = z.object({
  entity_type: z.enum(['portfolio', 'property'], {
    error: 'settlements.validation.entityTypeRequired',
  }),
  entity_id: z.string().min(1, { message: 'settlements.validation.entityRequired' }),
  period_start: z.string().min(1, { message: 'settlements.validation.periodStartRequired' }),
  period_end:   z.string().min(1, { message: 'settlements.validation.periodEndRequired' }),
  total_profit: z.string()
    .min(1, { message: 'settlements.validation.totalProfitRequired' })
    .refine(v => !isNaN(parseFloat(v)), { message: 'settlements.validation.totalProfitInvalid' })
    .refine(v => parseFloat(v) >= 0,   { message: 'settlements.validation.totalProfitNegative' }),
  currency: z.enum(['USD', 'SYP'], {
    error: 'settlements.validation.currencyRequired',
  }),
  settlement_date: z.string().min(1, { message: 'settlements.validation.settlementDateRequired' }),
  notes: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.period_start && data.period_end && data.period_end < data.period_start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['period_end'],
      message: 'settlements.validation.periodEndBeforeStart',
    });
  }
});

// STR-005 §4.1 — mandatory cast: schema uses .superRefine()
type AddSettlementFormData = z.infer<typeof addSettlementSchema>;

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchPortfolioOptions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchPropertyOptions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddSettlementDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess:    () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddSettlementDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddSettlementDialogProps) {
  const { t }       = useTranslation();
  const queryClient = useQueryClient();

  // Reuse warm cache keys from AddCapitalAccountDialog
  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolio-options'],
    queryFn:  fetchPortfolioOptions,
    staleTime: 10 * 60 * 1000,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['property-options'],
    queryFn:  fetchPropertyOptions,
    staleTime: 10 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddSettlementFormData>({
    resolver: zodResolver(addSettlementSchema) as unknown as Resolver<AddSettlementFormData>,
    defaultValues: {
      entity_type:     'portfolio',
      entity_id:       '',
      period_start:    '',
      period_end:      '',
      total_profit:    '',
      currency:        'USD',
      settlement_date: new Date().toISOString().split('T')[0],
      notes:           '',
    },
  });

  const watchedEntityType = watch('entity_type');

  useEffect(() => {
    setValue('entity_id', '');
  }, [watchedEntityType, setValue]);

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function onSubmit(data: AddSettlementFormData) {
    const { error } = await supabaseClient
      .from('profit_settlements')
      .insert({
        entity_type:     data.entity_type,
        entity_id:       data.entity_id,
        period_start:    data.period_start,
        period_end:      data.period_end,
        total_profit:    parseFloat(data.total_profit),
        currency:        data.currency,
        settlement_date: data.settlement_date,
        status:          'draft',
        notes:           data.notes?.trim() || null,
      });

    if (error) {
      toast.error(t('settlements.toast.createError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['settlements'] });
    toast.success(t('settlements.toast.createSuccess'));
    reset();
    onSuccess();
  }

  const entityOptions = watchedEntityType === 'portfolio' ? portfolios : properties;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('settlements.dialog.addTitle')}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Entity Type toggle */}
          <div className="space-y-1.5">
            <Label>{t('settlements.form.entityType')}</Label>
            <Controller
              name="entity_type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['portfolio', 'property'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={[
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        field.value === type
                          ? type === 'portfolio'
                            ? 'bg-[#1E5DC4] text-white'
                            : 'bg-[#1A7D4F] text-white'
                          : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] hover:bg-[#E2E8F0]',
                      ].join(' ')}
                    >
                      {t(`settlements.entityTypes.${type}`)}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.entity_type && (
              <p className="text-xs text-[#C0392B]">{t(errors.entity_type.message ?? '')}</p>
            )}
          </div>

          {/* Entity Select */}
          <div className="space-y-1.5">
            <Label>{t('settlements.form.entity')}</Label>
            <Controller
              name="entity_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('settlements.form.entityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {entityOptions.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.entity_id && (
              <p className="text-xs text-[#C0392B]">{t(errors.entity_id.message ?? '')}</p>
            )}
          </div>

          {/* Period Start + Period End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('settlements.form.periodStart')}</Label>
              <Input type="date" {...register('period_start')} />
              {errors.period_start && (
                <p className="text-xs text-[#C0392B]">{t(errors.period_start.message ?? '')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t('settlements.form.periodEnd')}</Label>
              <Input type="date" {...register('period_end')} />
              {errors.period_end && (
                <p className="text-xs text-[#C0392B]">{t(errors.period_end.message ?? '')}</p>
              )}
            </div>
          </div>

          {/* Total Profit + Currency */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1.5">
              <Label>{t('settlements.form.totalProfit')}</Label>
              <Input
                {...register('total_profit')}
                placeholder={t('settlements.form.totalProfitPlaceholder')}
                inputMode="decimal"
                className="font-mono"
              />
              {errors.total_profit && (
                <p className="text-xs text-[#C0392B]">{t(errors.total_profit.message ?? '')}</p>
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t('settlements.form.currency')}</Label>
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

          {/* Settlement Date */}
          <div className="space-y-1.5">
            <Label>{t('settlements.form.settlementDate')}</Label>
            <Input type="date" {...register('settlement_date')} />
            {errors.settlement_date && (
              <p className="text-xs text-[#C0392B]">{t(errors.settlement_date.message ?? '')}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t('settlements.form.notes')}</Label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder={t('settlements.form.notesPlaceholder')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('settlements.dialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
            >
              {isSubmitting
                ? t('settlements.dialog.submitting')
                : t('settlements.dialog.submit')}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
