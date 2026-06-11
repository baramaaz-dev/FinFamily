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
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabaseClient } from '@/lib/supabase';

// ─── Schema ───────────────────────────────────────────────────────────────────

const addCapitalAccountSchema = z.object({
  partner_id:      z.string().min(1, { message: 'capital.validation.partnerRequired' }),
  entity_type:     z.enum(['portfolio', 'property'], { error: 'capital.validation.entityTypeRequired' }),
  entity_id:       z.string().min(1, { message: 'capital.validation.entityRequired' }),
  opening_balance: z.string()
    .refine(v => v === '' || !isNaN(parseFloat(v)), { message: 'capital.validation.openingBalanceInvalid' })
    .refine(v => v === '' || parseFloat(v) >= 0,    { message: 'capital.validation.openingBalanceNegative' })
    .optional(),
  currency:        z.enum(['USD', 'SYP'], { error: 'capital.validation.currencyRequired' }),
  opening_date:    z.string().min(1, { message: 'capital.validation.openingDateRequired' }),
});

type AddCapitalAccountFormData = z.infer<typeof addCapitalAccountSchema>;

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchPeopleOptions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

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

// ─── Component ────────────────────────────────────────────────────────────────

interface AddCapitalAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddCapitalAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCapitalAccountDialogProps) {
  const { t }          = useTranslation();
  const queryClient    = useQueryClient();

  const { data: people = [] } = useQuery({
    queryKey: ['people-options'],
    queryFn:  fetchPeopleOptions,
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolio-options'],
    queryFn:  fetchPortfolioOptions,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['property-options'],
    queryFn:  fetchPropertyOptions,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddCapitalAccountFormData>({
    resolver: zodResolver(addCapitalAccountSchema) as unknown as Resolver<AddCapitalAccountFormData>,
    defaultValues: {
      partner_id:      '',
      entity_type:     'portfolio',
      entity_id:       '',
      opening_balance: '0',
      currency:        'USD',
      opening_date:    '',
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

  async function onSubmit(data: AddCapitalAccountFormData) {
    const { data: existing } = await supabaseClient
      .from('partner_capital_accounts')
      .select('id')
      .eq('partner_id', data.partner_id)
      .eq('entity_type', data.entity_type)
      .eq('entity_id', data.entity_id)
      .maybeSingle();

    if (existing) {
      setError('entity_id', { message: t('capital.validation.alreadyExists') });
      return;
    }

    const { error } = await supabaseClient
      .from('partner_capital_accounts')
      .insert({
        partner_id:      data.partner_id,
        entity_type:     data.entity_type,
        entity_id:       data.entity_id,
        opening_balance: parseFloat(data.opening_balance || '0'),
        currency:        data.currency,
        opening_date:    data.opening_date,
      });

    if (error) {
      toast.error(t('capital.toast.createError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['capital-accounts'] });
    toast.success(t('capital.toast.createSuccess'));
    handleClose();
    onSuccess();
  }

  const entityOptions = watchedEntityType === 'portfolio' ? portfolios : properties;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('capital.form.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('capital.form.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* Partner */}
          <div className="space-y-1.5">
            <Label>{t('capital.form.partnerLabel')}</Label>
            <Controller
              name="partner_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('capital.form.partnerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.partner_id && (
              <p className="text-xs text-[#C0392B]">{t(errors.partner_id.message ?? '')}</p>
            )}
          </div>

          {/* Entity Type toggle */}
          <div className="space-y-1.5">
            <Label>{t('capital.form.entityTypeLabel')}</Label>
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
                      {t(`capital.entityTypes.${type}`)}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Entity */}
          <div className="space-y-1.5">
            <Label>{t('capital.form.entityLabel')}</Label>
            <Controller
              name="entity_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('capital.form.entityPlaceholder')} />
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

          {/* Opening Balance + Currency */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1.5">
              <Label>{t('capital.form.openingBalanceLabel')}</Label>
              <Input
                {...register('opening_balance')}
                placeholder={t('capital.form.openingBalancePlaceholder')}
                inputMode="decimal"
              />
              {errors.opening_balance && (
                <p className="text-xs text-[#C0392B]">{t(errors.opening_balance.message ?? '')}</p>
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t('capital.form.currencyLabel')}</Label>
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

          {/* Opening Date */}
          <div className="space-y-1.5">
            <Label>{t('capital.form.openingDateLabel')}</Label>
            <Input
              type="date"
              {...register('opening_date')}
            />
            {errors.opening_date && (
              <p className="text-xs text-[#C0392B]">{t(errors.opening_date.message ?? '')}</p>
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
              {t('capital.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5DC4] hover:bg-[#1a52b0] text-white"
            >
              {isSubmitting ? t('capital.form.submitting') : t('capital.form.submitButton')}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
