import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Home, Building2, MapPin, Key, Lock } from 'lucide-react';
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
import type { Property } from '@/types';

const editPropertySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'properties.validation.nameRequired' })
    .min(2, { message: 'properties.validation.nameTooShort' })
    .max(200, { message: 'properties.validation.nameTooLong' }),

  type: z.enum(['residential', 'commercial', 'land'], {
    error: 'properties.validation.typeRequired',
  }),

  status: z.enum(['rented', 'vacant'], {
    error: 'properties.validation.statusRequired',
  }),

  location: z
    .string()
    .max(500, { message: 'properties.validation.locationTooLong' })
    .optional(),

  purchase_date: z.string().optional(),

  estimated_value: z
    .string()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      { message: 'properties.validation.estimatedValuePositive' },
    )
    .optional(),
});

type EditPropertyFormData = z.infer<typeof editPropertySchema>;

const PROPERTY_TYPES = [
  { value: 'residential' as const, icon: Home,      labelKey: 'properties.form.typeResidential' },
  { value: 'commercial'  as const, icon: Building2, labelKey: 'properties.form.typeCommercial'  },
  { value: 'land'        as const, icon: MapPin,    labelKey: 'properties.form.typeLand'        },
];

const PROPERTY_STATUSES = [
  { value: 'rented' as const, icon: Key,  labelKey: 'properties.form.statusRented' },
  { value: 'vacant' as const, icon: Lock, labelKey: 'properties.form.statusVacant' },
];

interface EditPropertyDialogProps {
  property: Property | null;
  onClose:  () => void;
}

export function EditPropertyDialog({ property, onClose }: EditPropertyDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPropertyFormData>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: {
      name:            '',
      type:            undefined,
      status:          'vacant',
      location:        '',
      purchase_date:   '',
      estimated_value: '',
    },
  });

  useEffect(() => {
    if (property) {
      reset({
        name:            property.name,
        type:            property.type,
        status:          property.status,
        location:        property.location ?? '',
        purchase_date:   property.purchase_date ?? '',
        estimated_value: property.estimated_value != null
          ? String(property.estimated_value)
          : '',
      });
    }
  }, [property, reset]);

  const handleClose = () => {
    if (property) {
      reset({
        name:            property.name,
        type:            property.type,
        status:          property.status,
        location:        property.location ?? '',
        purchase_date:   property.purchase_date ?? '',
        estimated_value: property.estimated_value != null
          ? String(property.estimated_value)
          : '',
      });
    }
    onClose();
  };

  const onSubmit = async (data: EditPropertyFormData) => {
    if (!property) return;
    const { error } = await supabaseClient.from('properties').update({
      name:            data.name.trim(),
      type:            data.type,
      status:          data.status,
      location:        data.location?.trim() || null,
      purchase_date:   data.purchase_date   || null,
      estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
    }).eq('id', property.id);
    if (error) {
      toast.error(t('properties.toast.editError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['properties'] });
    toast.success(t('properties.toast.editSuccess'));
    onClose();
  };

  return (
    <Dialog open={property !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className="sm:max-w-[520px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#1E293B]">
            {t('properties.form.editDialogTitle')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('properties.form.editDialogDescription', { name: property?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* TYPE SELECTOR */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('properties.form.typeLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTY_TYPES.map((pt) => {
                      const Icon = pt.icon;
                      const isSelected = field.value === pt.value;
                      return (
                        <button
                          key={pt.value}
                          type="button"
                          onClick={() => field.onChange(pt.value)}
                          className={[
                            'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{t(pt.labelKey)}</span>
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

          {/* STATUS SELECTOR */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('properties.form.statusLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_STATUSES.map((ps) => {
                      const Icon = ps.icon;
                      const isSelected = field.value === ps.value;
                      return (
                        <button
                          key={ps.value}
                          type="button"
                          onClick={() => field.onChange(ps.value)}
                          className={[
                            'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
                            isSelected
                              ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                              : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                          ].join(' ')}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{t(ps.labelKey)}</span>
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

          {/* NAME — required */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('properties.form.nameLabel')}
              <span className="text-[#C0392B] ms-0.5">*</span>
            </Label>
            <Input
              {...register('name')}
              placeholder={t('properties.form.namePlaceholder')}
              className="focus-visible:ring-[#1E5DC4]"
            />
            {errors.name && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.name.message ?? '')}
              </p>
            )}
          </div>

          {/* LOCATION — optional */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1E293B]">
              {t('properties.form.locationLabel')}
            </Label>
            <Input
              {...register('location')}
              placeholder={t('properties.form.locationPlaceholder')}
              className="focus-visible:ring-[#1E5DC4]"
            />
            {errors.location && (
              <p className="text-[#C0392B] text-xs mt-1">
                {t(errors.location.message ?? '')}
              </p>
            )}
          </div>

          {/* PURCHASE DATE + ESTIMATED VALUE — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('properties.form.purchaseDateLabel')}
              </Label>
              <Input
                {...register('purchase_date')}
                type="date"
                className="focus-visible:ring-[#1E5DC4]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('properties.form.estimatedValueLabel')}
              </Label>
              <Input
                {...register('estimated_value')}
                type="number"
                min="0"
                step="0.01"
                placeholder={t('properties.form.estimatedValuePlaceholder')}
                className="focus-visible:ring-[#1E5DC4] font-mono"
              />
              {errors.estimated_value && (
                <p className="text-[#C0392B] text-xs mt-1">
                  {t(errors.estimated_value.message ?? '')}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              {t('properties.form.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 me-2" />
                  {t('properties.form.editSubmitting')}
                </>
              ) : (
                t('properties.form.editSubmitButton')
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
