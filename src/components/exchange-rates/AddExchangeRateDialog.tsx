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

const addExchangeRateSchema = z.object({
  date: z.string()
    .min(1, { message: 'exchangeRates.validation.dateRequired' }),
  rate: z.coerce.number()
    .positive({ message: 'exchangeRates.validation.ratePositive' }),
  notes: z.string()
    .max(500, { message: 'exchangeRates.validation.notesTooLong' })
    .optional(),
});

type AddExchangeRateFormData = z.infer<typeof addExchangeRateSchema>;

interface AddExchangeRateDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddExchangeRateDialog({
  open, onOpenChange,
}: AddExchangeRateDialogProps) {
  const { t }       = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddExchangeRateFormData>({
    resolver:      zodResolver(addExchangeRateSchema) as unknown as Resolver<AddExchangeRateFormData>,
    defaultValues: { date: '', rate: '' as unknown as number, notes: '' },
  });

  function handleClose() {
    reset({ date: '', rate: '' as unknown as number, notes: '' });
    onOpenChange(false);
  }

  async function onSubmit(data: AddExchangeRateFormData) {
    const { error } = await supabaseClient
      .from('exchange_rates')
      .insert({
        date:  data.date,
        rate:  data.rate,
        notes: data.notes || null,
      });

    if (error) {
      toast.error(t('exchangeRates.toast.addError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    await queryClient.invalidateQueries({ queryKey: ['latest-exchange-rate'] });

    toast.success(t('exchangeRates.toast.addSuccess'));
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">
            {t('exchangeRates.dialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

          {/* Date field */}
          <div className="space-y-1.5">
            <Label htmlFor="er-date" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.date')}
            </Label>
            <Input
              id="er-date"
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
            <Label htmlFor="er-rate" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.rate')}
            </Label>
            <Input
              id="er-rate"
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
            <Label htmlFor="er-notes" className="text-sm text-[#1E293B]">
              {t('exchangeRates.form.notes')}
            </Label>
            <Textarea
              id="er-notes"
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
                ? t('exchangeRates.dialog.submitting')
                : t('exchangeRates.dialog.submit')}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
