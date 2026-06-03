import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Users } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabaseClient } from '@/lib/supabase';
import { toUSD, formatCurrency } from '@/lib/currency';
import { ROUTES } from '@/router/routes';
import { useDirection } from '@/hooks/useDirection';
import type { Portfolio, PortfolioMember, PortfolioStats, PortfolioDetailMember } from '@/types';

function typeBadgeClass(type: Portfolio['type']): string {
  const map: Record<Portfolio['type'], string> = {
    cash_usd: 'text-[#1A7D4F] bg-[#EBF5F0]',
    cash_syp: 'text-[#B45309] bg-[#FEF7EC]',
    gold:     'text-[#B45309] bg-[#FEF7EC]',
    project:  'text-[#1E5DC4] bg-[#E8F0FB]',
  };
  return map[type];
}

const signColor = (v: number): string =>
  v >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]';

async function fetchPortfolioById(id: string): Promise<Portfolio> {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select('id, name, type, description, created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return { ...data, type: data.type as Portfolio['type'], members_count: 0 };
}

async function fetchPortfolioMembersDetail(portfolioId: string): Promise<PortfolioMember[]> {
  const { data, error } = await supabaseClient
    .from('portfolio_members')
    .select('portfolio_id, person_id, share_numerator, share_denominator, joined_date, people(name)')
    .eq('portfolio_id', portfolioId)
    .order('joined_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    portfolio_id:      row.portfolio_id,
    person_id:         row.person_id,
    share_numerator:   row.share_numerator,
    share_denominator: row.share_denominator,
    joined_date:       row.joined_date,
    person_name:       (row.people as unknown as { name: string }).name,
  }));
}

async function fetchPortfolioStats(portfolioId: string): Promise<PortfolioStats> {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('type, amount, currency, exchange_rate')
    .eq('portfolio_id', portfolioId);
  if (error) throw error;
  const rows = data ?? [];
  const totalIncomeUsd = rows
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + toUSD(Number(r.amount), r.currency as 'USD' | 'SYP', r.exchange_rate ?? 1), 0);
  const totalExpensesUsd = rows
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + toUSD(Number(r.amount), r.currency as 'USD' | 'SYP', r.exchange_rate ?? 1), 0);
  return {
    totalIncomeUsd,
    totalExpensesUsd,
    netBalanceUsd: totalIncomeUsd - totalExpensesUsd,
  };
}

function PortfolioDetailSkeleton() {
  return (
    <div aria-busy="true">
      <div className="w-24 h-4 animate-pulse rounded bg-[#E2E8F0] mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1/3 h-7 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="w-16 h-5 animate-pulse rounded-md bg-[#E2E8F0]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="w-1/2 h-3 animate-pulse rounded bg-[#E2E8F0] mb-3" />
            <div className="w-2/3 h-8 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="bg-[#F1F5F9] px-4 py-3">
          <div className="w-32 h-4 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-t border-[#E2E8F0]">
            <div className="w-1/4 h-3 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="w-1/8 h-3 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="w-1/8 h-3 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="w-1/6 h-3 animate-pulse rounded bg-[#E2E8F0] ms-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PortfolioDetailErrorProps { onRetry: () => void; }
function PortfolioDetailError({ onRetry }: PortfolioDetailErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm font-medium text-[#C0392B]">
        {t('portfolios.detail.errorLoad')}
      </p>
      <button
        onClick={onRetry}
        className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#1E5DC4] hover:bg-[#E8F0FB] transition-colors"
      >
        {t('portfolios.detail.errorRetry')}
      </button>
    </div>
  );
}

export default function PortfolioDetailPage() {
  const { t }     = useTranslation();
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { isRTL } = useDirection();

  const {
    data: portfolio,
    isLoading: portfolioLoading,
    isError:   portfolioError,
    refetch:   refetchPortfolio,
  } = useQuery({
    queryKey: ['portfolio', id ?? ''],
    queryFn:  () => fetchPortfolioById(id!),
    enabled:  !!id,
    staleTime: 60_000,
  });

  const {
    data: members = [],
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ['portfolio-members', id ?? ''],
    queryFn:  () => fetchPortfolioMembersDetail(id!),
    enabled:  !!id,
    staleTime: 30_000,
  });

  const {
    data: stats = { totalIncomeUsd: 0, totalExpensesUsd: 0, netBalanceUsd: 0 },
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['portfolio-stats', id ?? ''],
    queryFn:  () => fetchPortfolioStats(id!),
    enabled:  !!id,
    staleTime: 30_000,
  });

  const isLoading = portfolioLoading || membersLoading || statsLoading;

  const detailMembers: PortfolioDetailMember[] = members.map((m) => {
    const ratio = m.share_numerator / m.share_denominator;
    return {
      ...m,
      sharePercent:   `${(ratio * 100).toFixed(2)}%`,
      shareAmountUsd: stats.netBalanceUsd * ratio,
    };
  });

  if (isLoading) return <PortfolioDetailSkeleton />;
  if (portfolioError || !portfolio) {
    return <PortfolioDetailError onRetry={() => void refetchPortfolio()} />;
  }

  return (
    <div>
      <button
        onClick={() => navigate(ROUTES.PORTFOLIOS)}
        className="flex items-center gap-1 text-sm text-[#475569] hover:text-[#1E293B] transition-colors mb-4"
      >
        {isRTL
          ? <ChevronRight className="h-4 w-4" />
          : <ChevronLeft  className="h-4 w-4" />
        }
        {t('portfolios.detail.backButton')}
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium text-[#1E293B]">{portfolio.name}</h1>
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass(portfolio.type)}`}
          >
            {t(`portfolios.types.${portfolio.type}`)}
          </span>
        </div>
        {portfolio.description && (
          <p className="text-sm text-[#475569] mt-1">{portfolio.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-sm text-[#475569] mb-1">{t('portfolios.detail.statsIncome')}</p>
          <p className="text-2xl font-mono tabular-nums font-medium text-[#1A7D4F]">
            {formatCurrency(stats.totalIncomeUsd, 'USD')}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-sm text-[#475569] mb-1">{t('portfolios.detail.statsExpenses')}</p>
          <p className="text-2xl font-mono tabular-nums font-medium text-[#C0392B]">
            {formatCurrency(stats.totalExpensesUsd, 'USD')}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-sm text-[#475569] mb-1">{t('portfolios.detail.statsNetBalance')}</p>
          <p className={`text-2xl font-mono tabular-nums font-medium ${signColor(stats.netBalanceUsd)}`}>
            {formatCurrency(stats.netBalanceUsd, 'USD')}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-medium text-[#1E293B] mb-3">
        {t('portfolios.detail.membersTitle')}
      </h2>
      <div
        className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white"
        role="region"
        aria-label={t('portfolios.detail.membersTitle')}
      >
        {detailMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Users className="h-10 w-10 text-[#94A3B8]" />
            <p className="text-sm text-[#475569]">{t('portfolios.detail.noMembers')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('portfolios.detail.colName')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('portfolios.detail.colShare')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('portfolios.detail.colPercent')}
                </TableHead>
                <TableHead className="text-end text-xs font-medium text-[#475569]">
                  {t('portfolios.detail.colAmount')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailMembers.map((m) => (
                <TableRow key={m.person_id} className="hover:bg-[#F1F5F9]">
                  <TableCell className="text-sm text-[#1E293B]">
                    {m.person_name}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-sm text-[#1E293B]">
                    {m.share_numerator}/{m.share_denominator}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-sm text-[#475569]">
                    {m.sharePercent}
                  </TableCell>
                  <TableCell className={`text-end font-mono tabular-nums text-sm ${signColor(m.shareAmountUsd)}`}>
                    {formatCurrency(m.shareAmountUsd, 'USD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
