import { useEffect }      from 'react';
import { useForm }        from 'react-hook-form';
import type { Resolver }  from 'react-hook-form';
import { zodResolver }    from '@hookform/resolvers/zod';
import { z }              from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast }          from 'sonner';
import { supabaseClient } from '@/lib/supabase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ExchangeRate } from '@/types';

const editExchangeRateSchema = z.object({
  date: z.string()
    .min(1, { message: 'exchangeRates.validation.dateRequired' }),
  rate: z.coerce.number()
    .positive({ message: 'exchangeRates.validation.ratePositive' }),
  notes: z.string()
    .max(500, { message: 'exchangeRates.validation.notesTooLong' })
    .optional(),
});

type EditExchangeRateFormData = z.infer<typeof editExchangeRateSchema>;

interface EditExchangeRateDialogProps {
  exchangeRate:  ExchangeRate | null;
  onOpenChange:  (open: boolean) => void;
}

export default function EditExchangeRateDialog({
  exchangeRate, onOpenChange,
}: EditExchangeRateDialogProps) {
  const { t }       = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditExchangeRateFormData>({
    resolver:      zodResolver(editExchangeRateSchema) as unknown as Resolver<EditExchangeRateFormData>,
    defaultValues: { date: '', rate: '' as unknown as number, notes: '' },
  });

  useEffect(() => {
    if (exchangeRate) {
      reset({
        date:  exchangeRate.date,
        rate:  exchangeRate.rate,
        notes: exchangeRate.notes ?? '',
      });
    }
  }, [exchangeRate, reset]);

  function handleClose() {
    if (exchangeRate) {
      reset({
        date:  exchangeRate.date,
        rate:  exchangeRate.rate,
        notes: exchangeRate.notes ?? '',
      });
    }
    onOpenChange(false);
  }

  async function onSubmit(data: EditExchangeRateFormData) {
    if (!exchangeRate) return;

    const { error } = await supabaseClient
      .from('exchange_rates')
      .update({
        date:  data.date,
        rate:  data.rate,
        notes: data.notes || null,
      })
      .eq('id', exchangeRate.id);

    if (error) {
      toast.error(t('exchangeRates.toast.updateError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    await queryClient.invalidateQueries({ queryKey: ['latest-exchange-rate'] });

    toast.success(t('exchangeRates.toast.updateSuccess'));
    handleClose();
  }

  return (
    <Dialog open={exchangeRate !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">
            {t('exchangeRates.dialog.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

          {/* Date field */}
          <div className="space-y-1.5">
            <Label htmlFor="er-edit-date" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.date')}
            </Label>
            <Input
              id="er-edit-date"
              type="date"
              {...register('date')}
              className="border-[#E2E8F0]"
            />
            {errors.date && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.date.message ?? '')}
              </p>
            )}
          </div>

          {/* Rate field */}
          <div className="space-y-1.5">
            <Label htmlFor="er-edit-rate" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.rate')}
            </Label>
            <Input
              id="er-edit-rate"
              type="number"
              step="0.0001"
              min="0"
              placeholder={t('exchangeRates.form.ratePlaceholder')}
              {...register('rate')}
              className="border-[#E2E8F0] font-mono"
            />
            <p className="text-xs text-[#94A3B8]">
              {t('exchangeRates.form.rateHint')}
            </p>
            {errors.rate && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.rate.message ?? '')}
              </p>
            )}
          </div>

          {/* Notes field */}
          <div className="space-y-1.5">
            <Label htmlFor="er-edit-notes" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.notes')}
            </Label>
            <Textarea
              id="er-edit-notes"
              rows={3}
              placeholder={t('exchangeRates.form.notesPlaceholder')}
              {...register('notes')}
              className="border-[#E2E8F0] resize-none"
            />
            {errors.notes && (
              <p className="text-xs text-[#C0392B] mt-1">
                {t(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-[#E2E8F0] text-[#475569]"
            >
              {t('exchangeRates.dialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
            >
              {isSubmitting
                ? t('exchangeRates.dialog.updating')
                : t('exchangeRates.dialog.updateSubmit')}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
