import { useState, useEffect }      from 'react';
import { useForm, Controller }       from 'react-hook-form';
import type { Resolver }             from 'react-hook-form';
import { zodResolver }               from '@hookform/resolvers/zod';
import { z }                         from 'zod';
import { useQuery }                  from '@tanstack/react-query';
import { useTranslation }            from 'react-i18next';
import { toast }                     from 'sonner';
import { Loader2, Pencil, Trash2 }   from 'lucide-react';
import { useCompany, useUpdateCompany } from '@/hooks/useCompany';
import {
  useCompanyMembers,
  useAddCompanyMember,
  useUpdateCompanyMember,
  useDeleteCompanyMember,
} from '@/hooks/useCompanyMembers';
import { supabaseClient }            from '@/lib/supabase';
import { sharesSum, isSharesSumValid } from '@/utils/shares';
import type { CompanyMember }        from '@/types/companyMember';
import { Input }                     from '@/components/ui/input';
import { Label }                     from '@/components/ui/label';
import { Textarea }                  from '@/components/ui/textarea';
import { Button }                    from '@/components/ui/button';
import { Badge }                     from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(2, { error: 'اسم الشركة مطلوب (حرفان على الأقل)' }),
  founded_date: z.string().min(1).optional().or(z.literal('')),
  base_currency: z.enum(['USD', 'SYP'], { error: 'اختر عملة مرجعية' }),
  notes: z.string().optional(),
});
type CompanyFormValues = z.infer<typeof companySchema>;

const addMemberSchema = z.object({
  person_id: z.string().min(1, { error: 'اختر شريكاً' }),
  share_numerator: z.coerce
    .number({ error: 'رقم صحيح مطلوب' })
    .int()
    .min(1, { error: 'يجب أن يكون البسط 1 على الأقل' }),
  share_denominator: z.coerce
    .number({ error: 'رقم صحيح مطلوب' })
    .int()
    .min(1, { error: 'يجب أن يكون المقام 1 على الأقل' }),
  notes: z.string().optional(),
});
type AddMemberFormValues = z.infer<typeof addMemberSchema>;

const editMemberSchema = z.object({
  share_numerator: z.coerce
    .number()
    .int()
    .min(1, { error: 'يجب أن يكون البسط 1 على الأقل' }),
  share_denominator: z.coerce
    .number()
    .int()
    .min(1, { error: 'يجب أن يكون المقام 1 على الأقل' }),
  notes: z.string().optional(),
});
type EditMemberFormValues = z.infer<typeof editMemberSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPercent(num: number, den: number): string {
  if (!den || den === 0 || isNaN(num) || isNaN(den)) return '—';
  return ((num / den) * 100).toFixed(1) + '%';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-slate-200 rounded" />
          <div className="h-8 bg-slate-200 rounded" />
        </div>
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-24" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompanySettingsPage() {
  const { t } = useTranslation();

  // ── Data hooks ───────────────────────────────────────────────────────────────
  const { data: company, isLoading } = useCompany();
  const companyId = company?.id ?? '';
  const { data: members = [] } = useCompanyMembers(companyId);

  // ── Mutation hooks ───────────────────────────────────────────────────────────
  const { mutate: saveCompany,  isPending: isSavingCompany  } = useUpdateCompany();
  const { mutate: addMember,    isPending: isAdding         } = useAddCompanyMember(companyId);
  const { mutate: updateMember, isPending: isUpdating       } = useUpdateCompanyMember(companyId);
  const { mutate: deleteMember, isPending: isDeleting       } = useDeleteCompanyMember(companyId);

  // ── People slim query ────────────────────────────────────────────────────────
  const { data: allPeople = [] } = useQuery({
    queryKey: ['people-slim'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('people')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [addDialogOpen,    setAddDialogOpen]    = useState(false);
  const [editDialogOpen,   setEditDialogOpen]   = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember,   setSelectedMember]   = useState<CompanyMember | null>(null);

  // ── Forms ────────────────────────────────────────────────────────────────────
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as unknown as Resolver<CompanyFormValues>,
    defaultValues: { name: '', founded_date: '', base_currency: 'USD', notes: '' },
  });

  const addForm = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema) as unknown as Resolver<AddMemberFormValues>,
    defaultValues: { person_id: '', share_numerator: 1, share_denominator: 1, notes: '' },
  });

  const editForm = useForm<EditMemberFormValues>({
    resolver: zodResolver(editMemberSchema) as unknown as Resolver<EditMemberFormValues>,
    defaultValues: { share_numerator: 1, share_denominator: 1, notes: '' },
  });

  // ── Watch for live fraction preview ─────────────────────────────────────────
  const addNumerator   = addForm.watch('share_numerator');
  const addDenominator = addForm.watch('share_denominator');
  const editNumerator  = editForm.watch('share_numerator');
  const editDenominator = editForm.watch('share_denominator');

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (company) {
      companyForm.reset({
        name:          company.name,
        founded_date:  company.founded_date ?? '',
        base_currency: company.base_currency,
        notes:         company.notes ?? '',
      });
    }
  }, [company, companyForm]);

  useEffect(() => {
    if (selectedMember && editDialogOpen) {
      editForm.reset({
        share_numerator:   selectedMember.share_numerator,
        share_denominator: selectedMember.share_denominator,
        notes:             selectedMember.notes ?? '',
      });
    }
  }, [selectedMember, editDialogOpen, editForm]);

  // ── Early return after all hooks ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <PageSkeleton />
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const availablePeople = allPeople.filter(
    (p) => !members.some((m) => m.person_id === p.id)
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function onCompanySubmit(values: CompanyFormValues) {
    if (!company) return;
    saveCompany(
      {
        id: company.id,
        payload: {
          name:          values.name,
          founded_date:  values.founded_date || null,
          base_currency: values.base_currency,
          notes:         values.notes || null,
        },
      },
      {
        onSuccess: () => toast.success(t('settings.company.saveSuccess')),
        onError:   () => toast.error(t('settings.company.saveError')),
      }
    );
  }

  function onAddMember(values: AddMemberFormValues) {
    if (!company) return;
    addMember(
      {
        company_id:        company.id,
        person_id:         values.person_id,
        share_numerator:   values.share_numerator,
        share_denominator: values.share_denominator,
        notes:             values.notes || null,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          addForm.reset();
          const newTotal =
            sharesSum(members) +
            values.share_numerator / values.share_denominator;
          if (Math.abs(newTotal - 1) < 0.0001) {
            toast.success('تمت إضافة الشريك بنجاح — إجمالي الحصص 100%');
          } else {
            toast.warning(
              'تمت إضافة الشريك — إجمالي الحصص ' +
                (newTotal * 100).toFixed(1) +
                '% (يجب أن يبلغ 100%)'
            );
          }
        },
        onError: () => toast.error('حدث خطأ أثناء الإضافة، يرجى المحاولة مجدداً'),
      }
    );
  }

  function onEditMember(values: EditMemberFormValues) {
    if (!selectedMember) return;
    updateMember(
      {
        id: selectedMember.id,
        payload: {
          share_numerator:   values.share_numerator,
          share_denominator: values.share_denominator,
          notes:             values.notes || null,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          const otherMembersSum = sharesSum(
            members.filter((m) => m.id !== selectedMember!.id)
          );
          const newTotal =
            otherMembersSum +
            values.share_numerator / values.share_denominator;
          if (Math.abs(newTotal - 1) < 0.0001) {
            toast.success('تم تحديث الحصة بنجاح — إجمالي الحصص 100%');
          } else {
            toast.warning(
              'تم تحديث الحصة — إجمالي الحصص ' +
                (newTotal * 100).toFixed(1) +
                '% (يجب أن يبلغ 100%)'
            );
          }
        },
        onError: () => toast.error('حدث خطأ أثناء التحديث، يرجى المحاولة مجدداً'),
      }
    );
  }

  function handleEditClick(member: CompanyMember) {
    setSelectedMember(member);
    setEditDialogOpen(true);
  }

  function handleEditOpenChange(open: boolean) {
    if (!open && selectedMember) {
      editForm.reset({
        share_numerator:   selectedMember.share_numerator,
        share_denominator: selectedMember.share_denominator,
        notes:             selectedMember.notes ?? '',
      });
    }
    setEditDialogOpen(open);
  }

  function handleDeleteClick(member: CompanyMember) {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  }

  function onDeleteConfirm() {
    if (!selectedMember) return;
    const remaining = members.filter((m) => m.id !== selectedMember.id);
    if (remaining.length > 0 && !isSharesSumValid(remaining)) {
      toast.error(t('settings.company.members.deleteBlockedError'));
      setDeleteDialogOpen(false);
      return;
    }
    deleteMember(selectedMember.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedMember(null);
        toast.success(t('settings.company.members.deleteSuccess'));
      },
      onError: () => toast.error(t('settings.company.members.deleteError')),
    });
  }

  const sumValid = isSharesSumValid(members);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium text-slate-950 mb-6">
        {t('settings.company.title')}
      </h1>

      {/* ── Company info card ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} noValidate className="space-y-6">

          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">{t('settings.company.name')}</Label>
            <Input
              placeholder={t('settings.company.namePlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...companyForm.register('name')}
            />
            {companyForm.formState.errors.name && (
              <p className="text-xs text-[#C0392B]" role="alert">
                {companyForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">{t('settings.company.foundedDate')}</Label>
              <Input
                type="date"
                className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
                {...companyForm.register('founded_date')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">{t('settings.company.baseCurrency')}</Label>
              <Controller
                name="base_currency"
                control={companyForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-[#E2E8F0] focus:ring-[#1E5DC4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">{t('settings.company.baseCurrencyUSD')}</SelectItem>
                      <SelectItem value="SYP">{t('settings.company.baseCurrencySYP')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">{t('settings.company.notes')}</Label>
            <Textarea
              placeholder={t('settings.company.notesPlaceholder')}
              rows={3}
              className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...companyForm.register('notes')}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSavingCompany}
              className="flex items-center gap-2 bg-[#1E5DC4] hover:bg-[#164399] text-white rounded-md px-4 py-2"
            >
              {isSavingCompany ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t('settings.company.saving')}</>
              ) : (
                t('settings.company.save')
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Members card ── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm mt-6">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-slate-950">
              {t('settings.company.members.title')}
            </h2>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          <Button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
          >
            + {t('settings.company.members.addMember')}
          </Button>
        </div>

        <div className="px-6 pb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3 text-right font-medium">{t('settings.company.members.partner')}</th>
                <th className="py-2 px-3 text-right font-medium">{t('settings.company.members.share')}</th>
                <th className="py-2 px-3 text-right font-medium">{t('settings.company.members.percentage')}</th>
                <th className="py-2 px-3 text-right font-medium">{t('settings.company.members.notes')}</th>
                <th className="py-2 px-3 text-center font-medium">{t('settings.company.members.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-800">{member.person_name}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {member.share_numerator}/{member.share_denominator}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#1A7D4F]">
                    {toPercent(member.share_numerator, member.share_denominator)}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{member.notes ?? '—'}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(member)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={t('settings.company.members.editMember')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(member)}
                        className="text-slate-400 hover:text-[#C0392B] transition-colors"
                        title={t('settings.company.members.deleteMember')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    {t('settings.company.members.noMembers')}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={2} className="py-2 px-3 text-slate-600 font-medium">
                  {t('settings.company.members.totalShares')}
                </td>
                <td className={`py-2 px-3 font-mono font-medium ${sumValid ? 'text-[#1A7D4F]' : 'text-[#C0392B]'}`}>
                  {members.length > 0 ? (sharesSum(members) * 100).toFixed(1) + '%' : '—'}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Add member dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-md border-[#E2E8F0] bg-white"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-[#1E293B]">
              {t('settings.company.members.addMember')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('settings.company.members.addMember')}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={addForm.handleSubmit(onAddMember)}
            noValidate
            className="flex flex-col gap-4"
          >
            {/* Person select */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('settings.company.members.partner')}
              </Label>
              <Controller
                name="person_id"
                control={addForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={availablePeople.length === 0}
                  >
                    <SelectTrigger className="border-[#E2E8F0] focus:ring-[#1E5DC4]">
                      <SelectValue
                        placeholder={
                          availablePeople.length === 0
                            ? t('settings.company.members.noAvailablePartners')
                            : t('settings.company.members.selectPartner')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePeople.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {addForm.formState.errors.person_id && (
                <p className="text-xs text-[#C0392B]" role="alert">
                  {addForm.formState.errors.person_id.message}
                </p>
              )}
            </div>

            {/* Fraction inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('settings.company.members.numerator')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4] font-mono"
                  {...addForm.register('share_numerator')}
                />
                {addForm.formState.errors.share_numerator && (
                  <p className="text-xs text-[#C0392B]" role="alert">
                    {addForm.formState.errors.share_numerator.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('settings.company.members.denominator')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4] font-mono"
                  {...addForm.register('share_denominator')}
                />
                {addForm.formState.errors.share_denominator && (
                  <p className="text-xs text-[#C0392B]" role="alert">
                    {addForm.formState.errors.share_denominator.message}
                  </p>
                )}
              </div>
            </div>

            {/* Live preview */}
            <p className="text-sm text-slate-500 font-mono">
              {t('settings.company.members.livePreview')}:{' '}
              {toPercent(Number(addNumerator), Number(addDenominator))}
            </p>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('settings.company.members.notes')}
              </Label>
              <Textarea
                rows={2}
                className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
                {...addForm.register('notes')}
              />
            </div>

            <DialogFooter className="mt-2 gap-2 sm:gap-0">
              <button
                type="button"
                className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9]"
                onClick={() => { setAddDialogOpen(false); addForm.reset(); }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isAdding || availablePeople.length === 0}
                className="flex items-center gap-2 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399] disabled:opacity-50"
              >
                {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('settings.company.members.addMember')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit member dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent
          className="w-full max-w-[95vw] sm:max-w-md border-[#E2E8F0] bg-white"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-medium text-[#1E293B]">
              {t('settings.company.members.editMember')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('settings.company.members.editMember')}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editForm.handleSubmit(onEditMember)}
            noValidate
            className="flex flex-col gap-4"
          >
            {/* Read-only partner name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('settings.company.members.partner')}
              </Label>
              <p className="text-sm text-slate-700 py-2 px-3 bg-slate-50 rounded-md border border-[#E2E8F0]">
                {selectedMember?.person_name ?? '—'}
              </p>
            </div>

            {/* Fraction inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('settings.company.members.numerator')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4] font-mono"
                  {...editForm.register('share_numerator')}
                />
                {editForm.formState.errors.share_numerator && (
                  <p className="text-xs text-[#C0392B]" role="alert">
                    {editForm.formState.errors.share_numerator.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-[#1E293B]">
                  {t('settings.company.members.denominator')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4] font-mono"
                  {...editForm.register('share_denominator')}
                />
                {editForm.formState.errors.share_denominator && (
                  <p className="text-xs text-[#C0392B]" role="alert">
                    {editForm.formState.errors.share_denominator.message}
                  </p>
                )}
              </div>
            </div>

            {/* Live preview */}
            <p className="text-sm text-slate-500 font-mono">
              {t('settings.company.members.livePreview')}:{' '}
              {toPercent(Number(editNumerator), Number(editDenominator))}
            </p>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-[#1E293B]">
                {t('settings.company.members.notes')}
              </Label>
              <Textarea
                rows={2}
                className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
                {...editForm.register('notes')}
              />
            </div>

            <DialogFooter className="mt-2 gap-2 sm:gap-0">
              <button
                type="button"
                className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9]"
                onClick={() => handleEditOpenChange(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-2 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399] disabled:opacity-50"
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-[#E2E8F0] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E293B]">
              {t('settings.company.members.deleteMember')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#475569]">
              {t('settings.company.members.confirmDelete')}
              {selectedMember && (
                <span className="font-medium text-[#1E293B]"> «{selectedMember.person_name}»</span>
              )}
              . {t('settings.company.members.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={isDeleting}
              className="bg-[#C0392B] hover:bg-[#962d22] text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
