import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const addPersonSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'people.validation.nameRequired' })
    .min(2, { message: 'people.validation.nameTooShort' })
    .max(100, { message: 'people.validation.nameTooLong' }),
  relation: z
    .string()
    .max(80, { message: 'people.validation.relationTooLong' })
    .optional(),
  notes: z
    .string()
    .max(500, { message: 'people.validation.notesTooLong' })
    .optional(),
});

type AddPersonFormData = z.infer<typeof addPersonSchema>;

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPersonDialog({ open, onOpenChange }: AddPersonDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddPersonFormData>({
    resolver: zodResolver(addPersonSchema),
    defaultValues: { name: '', relation: '', notes: '' },
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const onSubmit = async (data: AddPersonFormData) => {
    const { error } = await supabaseClient
      .from('people')
      .insert({
        name: data.name.trim(),
        relation: data.relation?.trim() || null,
        notes: data.notes?.trim() || null,
      });

    if (error) {
      toast.error(t('people.toast.addError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['people'] });
    toast.success(t('people.toast.addSuccess'));
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-md border-[#E2E8F0] bg-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-[#1E293B]">
            {t('people.form.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('people.form.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="person-name"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.nameLabel')}
            </Label>
            <Input
              id="person-name"
              placeholder={t('people.form.namePlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-[#C0392B]" role="alert">
                {t(errors.name.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="person-relation"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.relationLabel')}
            </Label>
            <Input
              id="person-relation"
              placeholder={t('people.form.relationPlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('relation')}
            />
            {errors.relation && (
              <p className="text-xs text-[#C0392B]" role="alert">
                {t(errors.relation.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="person-notes"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.notesLabel')}
            </Label>
            <Textarea
              id="person-notes"
              placeholder={t('people.form.notesPlaceholder')}
              rows={3}
              className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-[#C0392B]" role="alert">
                {t(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <button
              type="button"
              className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9]"
              onClick={() => handleOpenChange(false)}
            >
              {t('people.form.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('people.form.submitting')}
                </>
              ) : (
                t('people.form.submitButton')
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
