import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Wallet, Users } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { AddPortfolioDialog } from '@/components/portfolios/AddPortfolioDialog';
import { EditPortfolioDialog } from '@/components/portfolios/EditPortfolioDialog';
import { PortfolioMembersSheet } from '@/components/portfolios/PortfolioMembersSheet';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/router/routes';
import type { Portfolio } from '@/types';

async function fetchPortfolios(): Promise<Portfolio[]> {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select(`
      id,
      name,
      type,
      description,
      created_at,
      portfolio_members(count)
    `)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:            row.id,
    name:          row.name,
    type:          row.type as Portfolio['type'],
    description:   row.description,
    created_at:    row.created_at,
    members_count: (row.portfolio_members as { count: number }[])[0]?.count ?? 0,
  }));
}

function typeBadgeClass(type: Portfolio['type']): string {
  const map: Record<Portfolio['type'], string> = {
    cash_usd: 'text-[#1A7D4F] bg-[#EBF5F0]',
    cash_syp: 'text-[#B45309] bg-[#FEF7EC]',
    gold:     'text-[#B45309] bg-[#FEF7EC]',
    project:  'text-[#1E5DC4] bg-[#E8F0FB]',
  };
  return map[type];
}

function PortfoliosSkeleton() {
  return (
    <div aria-busy="true">
      <div className="bg-[#F1F5F9] px-4 py-3">
        <div className="flex gap-4">
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function PortfoliosEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Wallet className="h-12 w-12 text-[#94A3B8]" />
      <h3 className="text-base font-medium text-[#1E293B]">
        {t('portfolios.empty.title')}
      </h3>
      <p className="text-sm text-[#475569]">{t('portfolios.empty.subtitle')}</p>
      <Button
        className="mt-2 bg-[#1E5DC4] text-white hover:bg-[#164399]"
        onClick={onAdd}
      >
        <Plus className="ms-2 h-4 w-4" />
        {t('portfolios.addPortfolio')}
      </Button>
    </div>
  );
}

function PortfoliosError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm font-medium text-[#C0392B]">{t('portfolios.error.title')}</p>
      <Button
        variant="outline"
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
        onClick={onRetry}
      >
        {t('portfolios.error.retry')}
      </Button>
    </div>
  );
}

export default function PortfoliosPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen,    setEditDialogOpen]    = useState<boolean>(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [membersSheetOpen,  setMembersSheetOpen]  = useState<boolean>(false);
  const [membersPortfolio,  setMembersPortfolio]  = useState<Portfolio | null>(null);
  const [deletePortfolioId,   setDeletePortfolioId]   = useState<string | null>(null);
  const [deletePortfolioName, setDeletePortfolioName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: portfolios = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['portfolios'],
    queryFn:  fetchPortfolios,
    staleTime: 60_000,
  });

  const handleDeleteConfirm = async () => {
    if (!deletePortfolioId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabaseClient
        .from('portfolios')
        .delete()
        .eq('id', deletePortfolioId);
      if (error) {
        toast.error(t('portfolios.toast.deleteError'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success(t('portfolios.toast.deleteSuccess'));
      setDeletePortfolioId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('portfolios.pageTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#475569]">
            {t('portfolios.pageSubtitle')}
          </p>
        </div>
        <Button
          className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
          onClick={() => setDialogOpen(true)}
        >
          {t('portfolios.addPortfolio')}
          <Plus className="ms-2 h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        {isLoading ? (
          <PortfoliosSkeleton />
        ) : isError ? (
          <PortfoliosError onRetry={refetch} />
        ) : portfolios.length === 0 ? (
          <PortfoliosEmpty onAdd={() => setDialogOpen(true)} />
        ) : (
          <div role="region" aria-label={t('portfolios.pageTitle')}>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.name')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.type')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.members')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.description')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.createdAt')}
                  </TableHead>
                  <TableHead className="text-end text-xs font-medium text-[#475569]">
                    {t('portfolios.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((portfolio: Portfolio) => (
                  <TableRow
                    key={portfolio.id}
                    className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                  >
                    <TableCell className="text-sm font-medium text-[#1E293B]">
                      <Link
                        to={ROUTES.PORTFOLIO(portfolio.id)}
                        className="text-sm font-medium text-[#1E5DC4] hover:underline"
                      >
                        {portfolio.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClass(portfolio.type)}`}
                      >
                        {t(`portfolios.types.${portfolio.type}`)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-[#475569]">
                      {portfolio.members_count > 0
                        ? `${portfolio.members_count.toLocaleString('ar-SA')} ${t('portfolios.memberSuffix')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-[220px] truncate text-sm text-[#475569]"
                        title={portfolio.description ?? ''}
                      >
                        {portfolio.description || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-[#475569]">
                      {portfolio.created_at ? format(new Date(portfolio.created_at), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedPortfolio(portfolio); setEditDialogOpen(true); }}
                          className="rounded p-1 text-[#1E5DC4] hover:bg-[#E8F0FB] transition-colors"
                          aria-label={t('portfolios.actions.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setMembersPortfolio(portfolio); setMembersSheetOpen(true); }}
                          className="rounded p-1 text-[#1A7D4F] hover:bg-[#EBF5F0] transition-colors"
                          aria-label={t('portfolios.members.sheetTitle')}
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletePortfolioId(portfolio.id);
                            setDeletePortfolioName(portfolio.name);
                          }}
                          title={t('portfolios.actions.delete')}
                          className="rounded p-1 text-[#C0392B] hover:bg-[#FDECEA] transition-colors"
                          aria-label={t('portfolios.actions.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <AddPortfolioDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditPortfolioDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        portfolio={selectedPortfolio}
      />
      <PortfolioMembersSheet
        open={membersSheetOpen}
        onOpenChange={setMembersSheetOpen}
        portfolio={membersPortfolio}
      />
      <AlertDialog
        open={!!deletePortfolioId}
        onOpenChange={(open) => { if (!open) setDeletePortfolioId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('portfolios.delete.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('portfolios.delete.confirmDescription', { name: deletePortfolioName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeletePortfolioId(null)}
            >
              {t('portfolios.delete.cancelButton')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-[#C0392B] hover:bg-[#922B21] text-white focus-visible:ring-[#C0392B]"
              onClick={handleDeleteConfirm}
            >
              {t('portfolios.delete.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
