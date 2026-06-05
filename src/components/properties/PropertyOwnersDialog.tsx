import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Trash2, BookOpen, CreditCard, Gift, FileText, Users2 } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const addPropertyOwnerSchema = z.object({
  person_id: z.string()
    .min(1, { message: 'properties.owners.validation.personRequired' }),

  share_numerator: z.coerce
    .number({ error: 'properties.owners.validation.numeratorInteger' })
    .int({ message: 'properties.owners.validation.numeratorInteger' })
    .positive({ message: 'properties.owners.validation.numeratorPositive' }),

  share_denominator: z.coerce
    .number({ error: 'properties.owners.validation.denominatorInteger' })
    .int({ message: 'properties.owners.validation.denominatorInteger' })
    .min(1, { message: 'properties.owners.validation.denominatorMin' }),

  ownership_basis: z.enum(['إرث', 'شراء', 'هبة', 'وصية', 'شراكة'], {
    error: 'properties.owners.validation.basisRequired',
  }),
});

type AddPropertyOwnerFormData = z.infer<typeof addPropertyOwnerSchema>;

const OWNERSHIP_BASIS = [
  { value: 'إرث'   as const, icon: BookOpen,   labelKey: 'properties.owners.basisInheritance' },
  { value: 'شراء'  as const, icon: CreditCard, labelKey: 'properties.owners.basisPurchase'    },
  { value: 'هبة'   as const, icon: Gift,        labelKey: 'properties.owners.basisGift'       },
  { value: 'وصية'  as const, icon: FileText,    labelKey: 'properties.owners.basisWill'       },
  { value: 'شراكة' as const, icon: Users2,      labelKey: 'properties.owners.basisPartnership'},
];

interface PropertyOwnerRow {
  person_id:         string;
  share_numerator:   number;
  share_denominator: number;
  ownership_basis:   string;
  people: { id: string; name: string } | null;
}

interface PersonOption {
  id:       string;
  name:     string;
  relation: string | null;
}

interface PropertyOwnersDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  propertyId:   string;
  propertyName: string;
}

export function PropertyOwnersDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
}: PropertyOwnersDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [removingPersonId, setRemovingPersonId] = useState<string | null>(null);

  const { data: owners = [], isLoading: ownersLoading } = useQuery({
    queryKey: ['property_owners', propertyId],
    queryFn:  async (): Promise<PropertyOwnerRow[]> => {
      const { data, error } = await supabaseClient
        .from('property_owners')
        .select('person_id, share_numerator, share_denominator, ownership_basis, people(id, name)')
        .eq('property_id', propertyId);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        person_id:         row.person_id,
        share_numerator:   row.share_numerator,
        share_denominator: row.share_denominator,
        ownership_basis:   row.ownership_basis,
        people:            (row.people as unknown as { id: string; name: string } | null),
      }));
    },
    enabled: open && !!propertyId,
  });

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn:  async (): Promise<PersonOption[]> => {
      const { data, error } = await supabaseClient
        .from('people')
        .select('id, name, relation')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const availablePeople = people.filter(
    (p) => !owners.some((o) => o.person_id === p.id)
  );

  const totalShare   = owners.reduce(
    (sum, o) => sum + o.share_numerator / o.share_denominator,
    0
  );
  const totalPercent = (totalShare * 100).toFixed(2);
  const isComplete   = Math.abs(totalShare - 1) < 0.000001;
  const isExceeding  = totalShare > 1 + 0.000001;

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<AddPropertyOwnerFormData>({
    resolver: zodResolver(addPropertyOwnerSchema) as unknown as Resolver<AddPropertyOwnerFormData>,
    defaultValues: {
      person_id:         '',
      share_numerator:   1,
      share_denominator: 1,
      ownership_basis:   undefined,
    },
  });

  const handleRemoveOwner = async (personId: string) => {
    setRemovingPersonId(personId);
    const { error } = await supabaseClient
      .from('property_owners')
      .delete()
      .eq('property_id', propertyId)
      .eq('person_id', personId);
    setRemovingPersonId(null);
    if (error) {
      toast.error(t('properties.owners.toast.removeError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['property_owners', propertyId] });
    await queryClient.invalidateQueries({ queryKey: ['properties'] });
    toast.success(t('properties.owners.toast.removeSuccess'));
  };

  const onSubmit = async (data: AddPropertyOwnerFormData) => {
    if (owners.some((o) => o.person_id === data.person_id)) {
      toast.error(t('properties.owners.validation.personAlreadyAdded'));
      return;
    }
    const newShare = data.share_numerator / data.share_denominator;
    if (totalShare + newShare > 1 + 0.000001) {
      toast.error(t('properties.owners.validation.sharesExceed'));
      return;
    }
    const { error } = await supabaseClient.from('property_owners').insert({
      property_id:       propertyId,
      person_id:         data.person_id,
      share_numerator:   data.share_numerator,
      share_denominator: data.share_denominator,
      ownership_basis:   data.ownership_basis,
    });
    if (error) {
      toast.error(t('properties.owners.toast.addError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['property_owners', propertyId] });
    await queryClient.invalidateQueries({ queryKey: ['properties'] });
    toast.success(t('properties.owners.toast.addSuccess'));
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('properties.owners.dialogTitle')}</DialogTitle>
          <DialogDescription className="text-sm text-[#475569]">
            {propertyName}
          </DialogDescription>
        </DialogHeader>

        {/* Section 1 — Current Owners */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#1E293B]">
            {t('properties.owners.sectionExisting')}
          </p>

          {ownersLoading ? (
            <div className="space-y-2">
              <div className="animate-pulse bg-[#E2E8F0] rounded h-10 w-full" />
              <div className="animate-pulse bg-[#E2E8F0] rounded h-10 w-full" />
            </div>
          ) : owners.length === 0 ? (
            <p className="text-sm text-[#475569] py-3 text-center">
              {t('properties.owners.noOwners')}
            </p>
          ) : (
            <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-[#F1F5F9] px-3 py-2 text-xs font-medium text-[#475569]">
                <span>{t('properties.owners.columnOwner')}</span>
                <span>{t('properties.owners.columnShare')}</span>
                <span>{t('properties.owners.columnBasis')}</span>
                <span />
              </div>
              {owners.map((owner) => (
                <div
                  key={owner.person_id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-3 py-2 border-t border-[#E2E8F0] text-sm text-[#1E293B]"
                >
                  <span className="font-medium">{owner.people?.name}</span>
                  <span className="font-mono tabular-nums text-[#475569]">
                    {owner.share_numerator}/{owner.share_denominator}
                  </span>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-[#1E5DC4] bg-[#E8F0FB]">
                    {owner.ownership_basis}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOwner(owner.person_id)}
                    disabled={removingPersonId !== null}
                    title={t('properties.owners.removeTooltip')}
                    className="text-[#C0392B] hover:text-[#922B21] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {removingPersonId === owner.person_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {owners.length > 0 && (
          <div
            className={[
              'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
              isComplete
                ? 'bg-[#EBF5F0] text-[#1A7D4F]'
                : isExceeding
                  ? 'bg-[#FEF0EF] text-[#C0392B]'
                  : 'bg-[#F1F5F9] text-[#475569]',
            ].join(' ')}
          >
            <span>{t('properties.owners.totalLabel')}</span>
            <span className="font-mono tabular-nums">
              {isComplete
                ? t('properties.owners.totalComplete')
                : isExceeding
                  ? t('properties.owners.totalExceeds')
                  : `${totalPercent}%`}
            </span>
          </div>
        )}

        <hr className="border-[#E2E8F0]" />

        {/* Section 2 — Add Owner Form */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#1E293B]">
            {t('properties.owners.sectionAdd')}
          </p>

          {people.length === 0 ? (
            <p className="text-sm text-[#B45309] bg-[#FEF7EC] rounded-lg px-3 py-2">
              {t('properties.owners.noPeople')}
            </p>
          ) : availablePeople.length === 0 ? (
            <p className="text-sm text-[#475569] bg-[#F1F5F9] rounded-lg px-3 py-2 text-center">
              {t('properties.owners.allAdded')}
            </p>
          ) : isComplete ? (
            <p className="text-sm font-medium text-[#1A7D4F] bg-[#EBF5F0] rounded-lg px-3 py-2 text-center">
              {t('properties.owners.sharesComplete')}
            </p>
          ) : isExceeding ? (
            <p className="text-sm font-medium text-[#C0392B] bg-[#FEF0EF] rounded-lg px-3 py-2 text-center">
              {t('properties.owners.totalExceeds')}
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Field 1 — Person Select */}
              <div>
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('properties.owners.personLabel')}
                  <span className="text-[#C0392B] ms-0.5">*</span>
                </Label>
                <div className="mt-1.5">
                  <Controller
                    name="person_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="focus:ring-[#1E5DC4] border-[#E2E8F0]">
                          <SelectValue placeholder={t('properties.owners.personPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeople.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}{p.relation ? ` (${p.relation})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {errors.person_id && (
                  <p className="text-[#C0392B] text-xs mt-1">
                    {t(errors.person_id.message ?? '')}
                  </p>
                )}
              </div>

              {/* Field 2 — Share Fraction */}
              <div>
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('properties.owners.shareLabel')}
                  <span className="text-[#C0392B] ms-0.5">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <div>
                    <Label className="text-xs text-[#475569]">
                      {t('properties.owners.numeratorLabel')}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      className="font-mono focus-visible:ring-[#1E5DC4] mt-1"
                      {...register('share_numerator')}
                    />
                    {errors.share_numerator && (
                      <p className="text-[#C0392B] text-xs mt-1">
                        {t(errors.share_numerator.message ?? '')}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-[#475569]">
                      {t('properties.owners.denominatorLabel')}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="2"
                      className="font-mono focus-visible:ring-[#1E5DC4] mt-1"
                      {...register('share_denominator')}
                    />
                    {errors.share_denominator && (
                      <p className="text-[#C0392B] text-xs mt-1">
                        {t(errors.share_denominator.message ?? '')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Field 3 — Ownership Basis */}
              <div>
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('properties.owners.basisLabel')}
                  <span className="text-[#C0392B] ms-0.5">*</span>
                </Label>
                <div className="mt-1.5">
                  <Controller
                    name="ownership_basis"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-5 gap-1.5">
                        {OWNERSHIP_BASIS.map(({ value, icon: Icon, labelKey }) => {
                          const selected = field.value === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={[
                                'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2',
                                selected
                                  ? 'bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]'
                                  : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:border-[#B8CFF5]',
                              ].join(' ')}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-[10px] font-medium leading-tight text-center">
                                {t(labelKey)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
                {errors.ownership_basis && (
                  <p className="text-[#C0392B] text-xs mt-1">
                    {t(errors.ownership_basis.message ?? '')}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t('properties.owners.submitting')}
                    </>
                  ) : (
                    t('properties.owners.submitButton')
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]"
            onClick={() => onOpenChange(false)}
          >
            {t('properties.owners.closeButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
