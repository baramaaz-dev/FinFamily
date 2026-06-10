import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Loader2, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/supabase';
import { ROUTES } from '@/router/routes';
import { Button } from '@/components/ui/button';
import { AddPersonDialog } from '@/components/people/AddPersonDialog';
import { EditPersonDialog } from '@/components/people/EditPersonDialog';
import { DeletePersonDialog, type DependencyMap } from '@/components/people/DeletePersonDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Person } from '@/types';

async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function checkDependencies(personId: string): Promise<DependencyMap> {
  const [pm, po, pca, dist, ss] = await Promise.all([
    supabaseClient
      .from('portfolio_members')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', personId),
    supabaseClient
      .from('property_owners')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', personId),
    supabaseClient
      .from('partner_capital_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', personId),
    supabaseClient
      .from('distributions')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', personId),
    supabaseClient
      .from('settlement_shares')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', personId),
  ]);
  const errors = [pm, po, pca, dist, ss].filter(r => r.error);
  if (errors.length > 0) throw errors[0]!.error;
  return {
    portfolios:      pm.count   ?? 0,
    properties:      po.count   ?? 0,
    capitalAccounts: pca.count  ?? 0,
    distributions:   dist.count ?? 0,
    settlements:     ss.count   ?? 0,
  };
}

function PeopleSkeleton() {
  return (
    <div aria-busy="true">
      <div className="bg-[#F1F5F9] px-4 py-3">
        <div className="flex gap-4">
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function PeopleEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Users className="h-12 w-12 text-[#94A3B8]" />
      <h3 className="text-base font-medium text-[#1E293B]">
        {t('people.empty.title')}
      </h3>
      <p className="text-sm text-[#475569]">{t('people.empty.subtitle')}</p>
      <Button
        className="mt-2 bg-[#1E5DC4] text-white hover:bg-[#164399]"
        onClick={onAdd}
      >
        <Plus className="ms-2 h-4 w-4" />
        {t('people.addPerson')}
      </Button>
    </div>
  );
}

function PeopleError({ onRetry, t }: { onRetry: () => void; t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm font-medium text-[#C0392B]">{t('people.error.title')}</p>
      <Button
        variant="outline"
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
        onClick={onRetry}
      >
        {t('people.error.retry')}
      </Button>
    </div>
  );
}

export default function PeoplePage() {
  const { t }       = useTranslation();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget,     setDeleteTarget]     = useState<Person | null>(null);
  const [deleteMode,       setDeleteMode]       = useState<'confirm' | 'blocked'>('confirm');
  const [deleteDeps,       setDeleteDeps]       = useState<DependencyMap | undefined>(undefined);
  const [checkingId,       setCheckingId]       = useState<string | null>(null);
  const [isDeleting,       setIsDeleting]       = useState(false);

  const handleDeleteClick = async (person: Person) => {
    setCheckingId(person.id);
    try {
      const deps = await checkDependencies(person.id);
      const hasLinks = Object.values(deps).some(v => v > 0);
      setDeleteTarget(person);
      setDeleteDeps(deps);
      setDeleteMode(hasLinks ? 'blocked' : 'confirm');
      setDeleteDialogOpen(true);
    } catch {
      toast.error(t('people.toast.deleteCheckError'));
    } finally {
      setCheckingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { error } = await supabaseClient
      .from('people')
      .delete()
      .eq('id', deleteTarget.id);
    setIsDeleting(false);
    if (error) {
      toast.error(t('people.toast.deleteError'));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['people'] });
    toast.success(t('people.toast.deleteSuccess'));
    setDeleteDialogOpen(false);
  };

  const {
    data: people = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('people.pageTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#475569]">
            {t('people.pageSubtitle')}
          </p>
        </div>
        <Button
          className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
          onClick={() => setDialogOpen(true)}
        >
          {t('people.addPerson')}
          <Plus className="ms-2 h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        {isLoading ? (
          <PeopleSkeleton />
        ) : isError ? (
          <PeopleError onRetry={refetch} t={t} />
        ) : people.length === 0 ? (
          <PeopleEmpty onAdd={() => setDialogOpen(true)} />
        ) : (
          <div role="region" aria-label={t('people.pageTitle')}>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.name')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.relation')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.notes')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.addedAt')}
                  </TableHead>
                  <TableHead className="text-end text-xs font-medium text-[#475569]">
                    {t('people.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person: Person) => (
                  <TableRow
                    key={person.id}
                    className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                  >
                    <TableCell className="font-medium">
                      {person.name}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      {person.relation ?? '—'}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      <span
                        className="block max-w-[200px] truncate"
                        title={person.notes ?? undefined}
                      >
                        {person.notes ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-[#475569]">
                      {person.created_at ? format(new Date(person.created_at), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(ROUTES.PARTNER_DETAIL(person.id))}
                          aria-label={t('people.actions.view')}
                          title={t('people.actions.view')}
                          className="rounded p-1 text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditTarget(person); setEditDialogOpen(true); }}
                          className="rounded p-1 text-[#1E5DC4] hover:bg-[#E8F0FB] transition-colors"
                          aria-label={t('people.actions.edit')}
                          title={t('people.actions.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(person)}
                          disabled={checkingId === person.id}
                          aria-label={t('people.actions.delete')}
                          title={t('people.actions.delete')}
                          className="rounded p-1 text-[#C0392B] hover:bg-[#FEF0EF] transition-colors disabled:opacity-50"
                        >
                          {checkingId === person.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddPersonDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditPersonDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        person={editTarget}
      />
      <DeletePersonDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        person={deleteTarget}
        mode={deleteMode}
        dependencies={deleteDeps}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
