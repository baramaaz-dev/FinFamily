import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, DollarSign, Banknote, Gem, Briefcase } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const addPortfolioSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'portfolios.validation.nameRequired' })
    .min(2, { message: 'portfolios.validation.nameTooShort' })
    .max(100, { message: 'portfolios.validation.nameTooLong' }),
  type: z.enum(['cash_usd', 'cash_syp', 'gold', 'project'], {
    error: 'portfolios.validation.typeRequired',
  }),
  description: z
    .string()
    .max(500, { message: 'portfolios.validation.descriptionTooLong' })
    .optional(),
});

type AddPortfolioFormData = z.infer<typeof addPortfolioSchema>;

interface AddPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PORTFOLIO_TYPES = [
  { value: 'cash_usd' as const, icon: DollarSign, labelKey: 'portfolios.form.typeCashUsd' },
  { value: 'cash_syp' as const, icon: Banknote,   labelKey: 'portfolios.form.typeCashSyp' },
  { value: 'gold'     as const, icon: Gem,        labelKey: 'portfolios.form.typeGold'    },
  { value: 'project'  as const, icon: Briefcase,  labelKey: 'portfolios.form.typeProject' },
];

export function AddPortfolioDialog({ open, onOpenChange }: AddPortfolioDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddPortfolioFormData>({
    resolver: zodResolver(addPortfolioSchema),
    defaultValues: { name: '', type: undefined, description: '' },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) reset();
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: AddPortfolioFormData) => {
    const { error } = await supabaseClient.from('portfolios').insert({
      name:        data.name.trim(),
      type:        data.type,
      description: data.description?.trim() || null,
    });
    if (error) {
      toast.error(t('portfolios.toast.addError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    toast.success(t('portfolios.toast.addSuccess'));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('portfolios.form.dialogTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('portfolios.form.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 mt-2">

          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-name">
              {t('portfolios.form.nameLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              id="portfolio-name"
              placeholder={t('portfolios.form.namePlaceholder')}
              className="focus-visible:ring-[#1E5DC4]"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                {t(errors.name.message ?? '')}
              </p>
            )}
          </div>

          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('portfolios.form.typeLabel')}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {PORTFOLIO_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => field.onChange(pt.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                          field.value === pt.value
                            ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                            : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                        )}
                      >
                        <pt.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{t(pt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                  {fieldState.error && (
                    <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                      {t(fieldState.error.message ?? '')}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Description field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-description">
              {t('portfolios.form.descriptionLabel')}
            </Label>
            <Textarea
              id="portfolio-description"
              placeholder={t('portfolios.form.descriptionPlaceholder')}
              className="resize-none focus-visible:ring-[#1E5DC4]"
              rows={3}
              {...register('description')}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('portfolios.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t('portfolios.form.submitting')}
                </>
              ) : (
                t('portfolios.form.submitButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
