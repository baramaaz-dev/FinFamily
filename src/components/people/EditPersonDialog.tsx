import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/supabase';
import type { Person } from '@/types';
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

const editPersonSchema = z.object({
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

type EditPersonFormData = z.infer<typeof editPersonSchema>;

interface EditPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
}

export function EditPersonDialog({ open, onOpenChange, person }: EditPersonDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<EditPersonFormData>({
    resolver: zodResolver(editPersonSchema),
    defaultValues: { name: '', relation: '', notes: '' },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (person) {
      form.reset({
        name:     person.name,
        relation: person.relation ?? '',
        notes:    person.notes ?? '',
      });
    }
  }, [person?.id]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && person) {
      form.reset({
        name:     person.name,
        relation: person.relation ?? '',
        notes:    person.notes ?? '',
      });
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (data: EditPersonFormData) => {
    if (!person) return;

    const { error } = await supabaseClient
      .from('people')
      .update({
        name:     data.name.trim(),
        relation: data.relation?.trim() || null,
        notes:    data.notes?.trim() || null,
      })
      .eq('id', person.id);

    if (error) {
      toast.error(t('people.toast.editError'));
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['people'] });
    toast.success(t('people.toast.editSuccess'));
    handleOpenChange(false);
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full max-w-md border-[#E2E8F0] bg-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-[#1E293B]">
            {t('people.form.editDialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#475569]">
            {t('people.form.editDialogDescription').replace('{name}', person.name)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="edit-person-name"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.nameLabel')}
            </Label>
            <Input
              id="edit-person-name"
              placeholder={t('people.form.namePlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                {t(form.formState.errors.name.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="edit-person-relation"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.relationLabel')}
            </Label>
            <Input
              id="edit-person-relation"
              placeholder={t('people.form.relationPlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...form.register('relation')}
            />
            {form.formState.errors.relation && (
              <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                {t(form.formState.errors.relation.message ?? '')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="edit-person-notes"
              className="text-sm font-medium text-[#1E293B]"
            >
              {t('people.form.notesLabel')}
            </Label>
            <Textarea
              id="edit-person-notes"
              placeholder={t('people.form.notesPlaceholder')}
              rows={3}
              className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                {t(form.formState.errors.notes.message ?? '')}
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
              disabled={form.formState.isSubmitting}
              className="flex items-center gap-2 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399] disabled:opacity-50"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('people.form.submitting')}
                </>
              ) : (
                t('people.form.editSubmitButton')
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
