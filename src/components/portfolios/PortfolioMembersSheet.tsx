import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Trash2, Pencil, Check, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabaseClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { validateSharesTotal } from '@/lib/currency';
import type { SharesValidationResult } from '@/lib/currency';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Portfolio, PortfolioMember } from '@/types';

// ── Schema ────────────────────────────────────────────────────────────────────

const addMemberSchema = z.object({
  person_id: z.string().min(1, { message: 'portfolios.validation.personRequired' }),
  share_numerator: z.coerce
    .number()
    .int()
    .min(1, { message: 'portfolios.validation.shareNumeratorMin' }),
  share_denominator: z.coerce
    .number()
    .int()
    .min(1, { message: 'portfolios.validation.shareDenominatorMin' }),
  joined_date: z.string().min(1, { message: 'portfolios.validation.joinedDateRequired' }),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

const editShareSchema = z.object({
  share_numerator: z.coerce
    .number({ error: 'portfolios.validation.shareNumeratorInvalid' })
    .int()
    .positive({ message: 'portfolios.validation.shareNumeratorInvalid' }),
  share_denominator: z.coerce
    .number({ error: 'portfolios.validation.shareDenominatorInvalid' })
    .int()
    .min(1, { message: 'portfolios.validation.shareDenominatorInvalid' }),
});
type EditShareData = z.infer<typeof editShareSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface PortfolioMembersSheetProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  portfolio:    Portfolio | null;
}

// ── Data fetchers (outside component — self-contained) ────────────────────────

async function fetchPortfolioMembers(portfolioId: string): Promise<PortfolioMember[]> {
  const { data, error } = await supabaseClient
    .from('portfolio_members')
    .select(`
      portfolio_id,
      person_id,
      share_numerator,
      share_denominator,
      joined_date,
      people(name)
    `)
    .eq('portfolio_id', portfolioId)
    .order('joined_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    portfolio_id:      row.portfolio_id,
    person_id:         row.person_id,
    share_numerator:   row.share_numerator,
    share_denominator: row.share_denominator,
    joined_date:       row.joined_date,
    person_name:       (row.people as unknown as { name: string } | null)?.name ?? '',
  }));
}

async function fetchPeople(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MembersSkeleton() {
  return (
    <div aria-busy="true" className="overflow-hidden rounded-lg border border-[#E2E8F0]">
      <div className="bg-[#F1F5F9] px-4 py-3">
        <div className="flex gap-4">
          <div className="h-3 w-1/3 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function MembersEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] py-8">
      <p className="text-sm font-medium text-[#1E293B]">
        {t('portfolios.members.empty.title')}
      </p>
      <p className="text-xs text-[#475569]">{t('portfolios.members.empty.subtitle')}</p>
    </div>
  );
}

function MembersError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-[#E2E8F0] py-8">
      <p className="text-sm font-medium text-[#C0392B]">
        {t('portfolios.members.error.title')}
      </p>
      <Button
        variant="outline"
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
        onClick={onRetry}
      >
        {t('portfolios.members.error.retry')}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PortfolioMembersSheet({
  open,
  onOpenChange,
  portfolio,
}: PortfolioMembersSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [removingId,       setRemovingId]       = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId]   = useState<string | null>(null);
  const [editNumerator,   setEditNumerator]     = useState<number>(1);
  const [editDenominator, setEditDenominator]   = useState<number>(1);
  const [savingShareId,   setSavingShareId]     = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['portfolio-members', portfolio?.id ?? ''],
    queryFn:  () => fetchPortfolioMembers(portfolio!.id),
    enabled:  !!portfolio,
    staleTime: 60_000,
  });

  const { data: allPeople = [] } = useQuery({
    queryKey: ['people'],
    queryFn:  fetchPeople,
    staleTime: 60_000,
  });

  // ── Form ───────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema) as unknown as Resolver<AddMemberFormData>,
    defaultValues: {
      person_id:         '',
      share_numerator:   1,
      share_denominator: 1,
      joined_date:       format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Reset form and edit state when a different portfolio is opened
  useEffect(() => {
    if (portfolio) {
      reset({
        person_id:         '',
        share_numerator:   1,
        share_denominator: 1,
        joined_date:       format(new Date(), 'yyyy-MM-dd'),
      });
      setEditingMemberId(null);
    }
  }, [portfolio?.id, reset]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const memberIds = new Set(members.map((m) => m.person_id));
  const availablePeople = allPeople.filter((p) => !memberIds.has(p.id));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRemove = async (personId: string) => {
    if (!portfolio) return;
    setRemovingId(personId);
    try {
      const { error } = await supabaseClient
        .from('portfolio_members')
        .delete()
        .eq('portfolio_id', portfolio.id)
        .eq('person_id', personId);
      if (error) {
        toast.error(t('portfolios.toast.memberRemoveError'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['portfolio-members', portfolio.id] });
      await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success(t('portfolios.toast.memberRemoveSuccess'));
    } finally {
      setRemovingId(null);
    }
  };

  const onSubmit = async (data: AddMemberFormData) => {
    if (!portfolio) return;
    const { error } = await supabaseClient.from('portfolio_members').insert({
      portfolio_id:      portfolio.id,
      person_id:         data.person_id,
      share_numerator:   data.share_numerator,
      share_denominator: data.share_denominator,
      joined_date:       data.joined_date,
    });
    if (error) {
      toast.error(t('portfolios.toast.memberAddError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['portfolio-members', portfolio.id] });
    await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    toast.success(t('portfolios.toast.memberAddSuccess'));
    reset({
      person_id:         '',
      share_numerator:   1,
      share_denominator: 1,
      joined_date:       format(new Date(), 'yyyy-MM-dd'),
    });
  };

  // ── Null guard — after ALL hooks ───────────────────────────────────────────

  if (!portfolio) return null;

  // ── Shares validation (derived) ────────────────────────────────────────────

  const sharesValidation: SharesValidationResult = validateSharesTotal(members);

  // ── Sheet open/close handler ───────────────────────────────────────────────

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (members.length > 0 && !sharesValidation.isValid) {
        toast.warning(
          t('portfolios.toast.sharesWarning')
            .replace('{percent}', sharesValidation.percentage)
        );
      }
      reset();
      setEditingMemberId(null);
    }
    onOpenChange(newOpen);
  };

  // ── Share-edit handlers ────────────────────────────────────────────────────

  const handleEditShare = (member: PortfolioMember) => {
    setEditingMemberId(member.person_id);
    setEditNumerator(member.share_numerator);
    setEditDenominator(member.share_denominator);
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
  };

  const handleSaveShare = async (member: PortfolioMember) => {
    const result = editShareSchema.safeParse({
      share_numerator:   editNumerator,
      share_denominator: editDenominator,
    });
    if (!result.success) {
      const firstMsg = result.error.issues[0]?.message ?? 'portfolios.toast.shareUpdateError';
      toast.error(t(firstMsg));
      return;
    }
    setSavingShareId(member.person_id);
    try {
      const { error } = await supabaseClient
        .from('portfolio_members')
        .update({
          share_numerator:   result.data.share_numerator,
          share_denominator: result.data.share_denominator,
        })
        .eq('portfolio_id', portfolio.id)
        .eq('person_id', member.person_id);
      if (error) {
        toast.error(t('portfolios.toast.shareUpdateError'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['portfolio-members', portfolio.id] });
      toast.success(t('portfolios.toast.shareUpdateSuccess'));
      setEditingMemberId(null);
    } finally {
      setSavingShareId(null);
    }
  };

  const isAnyRowEditing = editingMemberId !== null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="flex w-[480px] flex-col p-0 sm:w-[540px]">

        {/* Sticky header */}
        <SheetHeader className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white px-6 py-4">
          <SheetTitle className="text-base font-medium text-[#1E293B]">
            {t('portfolios.members.sheetTitle')}
          </SheetTitle>
          <SheetDescription className="sr-only">{portfolio.name}</SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">

          {/* Section 1 — Current members */}
          <section>
            <h3 className="mb-3 text-sm font-medium text-[#1E293B]">
              {t('portfolios.members.currentTitle')}
            </h3>

            {membersLoading ? (
              <MembersSkeleton />
            ) : membersError ? (
              <MembersError onRetry={refetchMembers} />
            ) : members.length === 0 ? (
              <MembersEmpty />
            ) : (
              <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                      <TableHead className="text-start text-xs font-medium text-[#475569]">
                        {t('portfolios.members.columns.name')}
                      </TableHead>
                      <TableHead className="text-start text-xs font-medium text-[#475569]">
                        {t('portfolios.members.columns.share')}
                      </TableHead>
                      <TableHead className="text-start text-xs font-medium text-[#475569]">
                        {t('portfolios.members.columns.joinedDate')}
                      </TableHead>
                      <TableHead className="text-end text-xs font-medium text-[#475569]">
                        {t('portfolios.members.columns.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.person_id}
                        className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                      >
                        {/* Name cell — unchanged in both modes */}
                        <TableCell className="text-sm font-medium text-[#1E293B] text-start">
                          {member.person_name}
                        </TableCell>

                        {/* Share cell — conditional */}
                        {editingMemberId === member.person_id ? (
                          <TableCell className="text-start">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={editNumerator}
                                onChange={(e) => setEditNumerator(Number(e.target.value))}
                                aria-label={t('portfolios.members.numeratorLabel')}
                                className="w-16 rounded-md border border-[#E2E8F0] bg-white px-2 py-1 h-8
                                           text-center font-mono tabular-nums text-sm text-[#1E293B]
                                           focus:outline-none focus:ring-1 focus:ring-[#1E5DC4]"
                              />
                              <span className="font-mono text-[#94A3B8]">/</span>
                              <input
                                type="number"
                                min={1}
                                value={editDenominator}
                                onChange={(e) => setEditDenominator(Number(e.target.value))}
                                aria-label={t('portfolios.members.denominatorLabel')}
                                className="w-16 rounded-md border border-[#E2E8F0] bg-white px-2 py-1 h-8
                                           text-center font-mono tabular-nums text-sm text-[#1E293B]
                                           focus:outline-none focus:ring-1 focus:ring-[#1E5DC4]"
                              />
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell className="font-mono tabular-nums text-sm text-[#1E293B] text-start">
                            {member.share_numerator}/{member.share_denominator}
                          </TableCell>
                        )}

                        {/* Joined date cell — unchanged in both modes */}
                        <TableCell className="font-mono tabular-nums text-sm text-[#475569] text-start">
                          {format(new Date(member.joined_date), 'dd/MM/yyyy')}
                        </TableCell>

                        {/* Actions cell — conditional */}
                        {editingMemberId === member.person_id ? (
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveShare(member)}
                                disabled={savingShareId === member.person_id}
                                title={t('portfolios.members.saveShare')}
                                className="rounded p-1 text-[#1A7D4F] hover:bg-[#EBF5F0]
                                           disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {savingShareId === member.person_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={savingShareId === member.person_id}
                                title={t('portfolios.members.cancelEdit')}
                                className="rounded p-1 text-[#475569] hover:bg-[#F1F5F9]
                                           disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditShare(member)}
                                disabled={isAnyRowEditing}
                                title={t('portfolios.members.editShare')}
                                className="rounded p-1 text-[#1E5DC4] hover:bg-[#E8F0FB]
                                           disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemove(member.person_id)}
                                disabled={removingId === member.person_id || isAnyRowEditing}
                                title={t('portfolios.actions.delete')}
                                className="rounded p-1 text-[#C0392B] hover:bg-[#FEF0EF]
                                           disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {removingId === member.person_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* Shares summary bar — visible only when members are loaded and exist */}
          {!membersLoading && members.length > 0 && (
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border px-4 py-3',
                sharesValidation.isValid
                  ? 'border-[#A3D4BC] bg-[#EBF5F0]'
                  : 'border-[#F5CC8A] bg-[#FEF7EC]'
              )}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[#1E293B]">
                  {t('portfolios.members.sharesTotalLabel')}
                </span>
                {!sharesValidation.isValid && (
                  <span className="text-xs text-[#B45309]">
                    {t('portfolios.members.sharesHint')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-mono tabular-nums text-sm font-semibold',
                    sharesValidation.isValid ? 'text-[#1A7D4F]' : 'text-[#B45309]'
                  )}
                >
                  {sharesValidation.percentage}
                </span>
                {sharesValidation.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1A7D4F]" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[#B45309]" />
                )}
              </div>
            </div>
          )}

          {/* Section 2 — Add member form */}
          <section>
            <h3 className="mb-3 text-sm font-medium text-[#1E293B]">
              {t('portfolios.members.addTitle')}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

              {/* Person Select */}
              <div className="flex flex-col gap-1.5">
                <Label>{t('portfolios.members.personLabel')}</Label>
                <Controller
                  name="person_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={availablePeople.length === 0}
                      >
                        <SelectTrigger className="focus:ring-[#1E5DC4]">
                          <SelectValue
                            placeholder={
                              availablePeople.length === 0
                                ? t('portfolios.members.noAvailablePeople')
                                : t('portfolios.members.personLabel')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeople.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                          {t(fieldState.error.message ?? '')}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Share fields */}
              <div className="flex flex-col gap-1.5">
                <Label>{t('portfolios.members.shareLabel')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="focus-visible:ring-[#1E5DC4]"
                    {...register('share_numerator')}
                  />
                  <span className="font-mono text-[#475569]">/</span>
                  <Input
                    type="number"
                    min={1}
                    className="focus-visible:ring-[#1E5DC4]"
                    {...register('share_denominator')}
                  />
                </div>
                {(errors.share_numerator ?? errors.share_denominator) && (
                  <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                    {t(
                      errors.share_numerator?.message ??
                        errors.share_denominator?.message ??
                        '',
                    )}
                  </p>
                )}
              </div>

              {/* Join date */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="member-joined-date">
                  {t('portfolios.members.joinedDateLabel')}
                  <span className="ms-0.5 text-[#C0392B]">*</span>
                </Label>
                <Input
                  id="member-joined-date"
                  type="date"
                  className="focus-visible:ring-[#1E5DC4]"
                  {...register('joined_date')}
                />
                {errors.joined_date && (
                  <p className="mt-1 text-xs text-[#C0392B]" role="alert">
                    {t(errors.joined_date.message ?? '')}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1E5DC4] text-white hover:bg-[#164399]"
                disabled={isSubmitting || availablePeople.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('portfolios.members.adding')}
                  </>
                ) : (
                  t('portfolios.members.addButton')
                )}
              </Button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
