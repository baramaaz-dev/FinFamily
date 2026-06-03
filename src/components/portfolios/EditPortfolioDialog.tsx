import { useEffect } from 'react';
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
import type { Portfolio } from '@/types';

const editPortfolioSchema = z.object({
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

type EditPortfolioFormData = z.infer<typeof editPortfolioSchema>;

interface EditPortfolioDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  portfolio:    Portfolio | null;
}

const PORTFOLIO_TYPES = [
  { value: 'cash_usd', icon: DollarSign, labelKey: 'portfolios.form.typeCashUsd' },
  { value: 'cash_syp', icon: Banknote,   labelKey: 'portfolios.form.typeCashSyp' },
  { value: 'gold',     icon: Gem,        labelKey: 'portfolios.form.typeGold'    },
  { value: 'project',  icon: Briefcase,  labelKey: 'portfolios.form.typeProject' },
] as const;

export function EditPortfolioDialog({ open, onOpenChange, portfolio }: EditPortfolioDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPortfolioFormData>({
    resolver: zodResolver(editPortfolioSchema),
    defaultValues: { name: '', type: undefined, description: '' },
  });

  useEffect(() => {
    if (portfolio) {
      reset({
        name:        portfolio.name,
        type:        portfolio.type,
        description: portfolio.description ?? '',
      });
    }
  }, [portfolio?.id, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && portfolio) {
      reset({
        name:        portfolio.name,
        type:        portfolio.type,
        description: portfolio.description ?? '',
      });
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: EditPortfolioFormData) => {
    if (!portfolio) return;
    const { error } = await supabaseClient
      .from('portfolios')
      .update({
        name:        data.name.trim(),
        type:        data.type,
        description: data.description?.trim() || null,
      })
      .eq('id', portfolio.id);
    if (error) {
      toast.error(t('portfolios.toast.editError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    toast.success(t('portfolios.toast.editSuccess'));
    handleOpenChange(false);
  };

  if (!portfolio) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('portfolios.form.editDialogTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('portfolios.form.editDialogDescription').replace('{name}', portfolio.name)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">

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
                          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
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

          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-portfolio-name">
              {t('portfolios.form.nameLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              id="edit-portfolio-name"
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

          {/* Description field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-portfolio-description">
              {t('portfolios.form.descriptionLabel')}
            </Label>
            <Textarea
              id="edit-portfolio-description"
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
                  {t('portfolios.form.editSubmitting')}
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                </>
              ) : (
                t('portfolios.form.editSubmitButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
