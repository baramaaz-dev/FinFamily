import { useMemo }                          from 'react';
import { Link }                             from 'react-router-dom';
import { useQuery }                         from '@tanstack/react-query';
import { useTranslation }                   from 'react-i18next';
import { supabaseClient }                   from '@/lib/supabase';
import type { Portfolio }                   from '@/types';
import { ROUTES }                           from '@/router/routes';
import NetWorthCard                         from '@/components/dashboard/NetWorthCard';
import PortfolioBalanceCard                 from '@/components/dashboard/PortfolioBalanceCard';
import PortfolioBalanceCardSkeleton         from '@/components/dashboard/PortfolioBalanceCardSkeleton';

// ─── Query functions (outside component per React Query v5 convention) ────────

async function fetchNetWorthTransactions() {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('type, amount, currency, exchange_rate')
    .in('type', ['income', 'expense']);
  if (error) throw error;
  return data ?? [];
}

async function fetchPropertyValues() {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('estimated_value');
  if (error) throw error;
  return data ?? [];
}

async function fetchPortfoliosForDashboard() {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select('id, name, type, portfolio_members(count)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:           row.id,
    name:         row.name,
    type:         row.type as Portfolio['type'],
    membersCount: (row.portfolio_members as { count: number }[])[0]?.count ?? 0,
  }));
}

async function fetchPortfolioTransactions() {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('portfolio_id, type, amount, currency, exchange_rate')
    .in('type', ['income', 'expense']);
  if (error) throw error;
  return data ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();

  const {
    data:    txData   = [],
    isLoading: txLoading,
    isError:   txError,
    refetch:   refetchTx,
  } = useQuery({
    queryKey: ['dashboard-net-worth-transactions'],
    queryFn:  fetchNetWorthTransactions,
    staleTime: 60_000,
  });

  const {
    data:    propData   = [],
    isLoading: propLoading,
    isError:   propError,
    refetch:   refetchProps,
  } = useQuery({
    queryKey: ['dashboard-property-values'],
    queryFn:  fetchPropertyValues,
    staleTime: 60_000,
  });

  const {
    data:      portfoliosData     = [],
    isLoading: portfoliosLoading,
    isError:   portfoliosError,
    refetch:   refetchPortfolios,
  } = useQuery({
    queryKey: ['portfolios'],
    queryFn:  fetchPortfoliosForDashboard,
    staleTime: 60_000,
  });

  const {
    data:      portfolioTxData    = [],
    isLoading: portfolioTxLoading,
    isError:   portfolioTxError,
    refetch:   refetchPortfolioTx,
  } = useQuery({
    queryKey: ['dashboard-portfolio-transactions'],
    queryFn:  fetchPortfolioTransactions,
    staleTime: 60_000,
  });

  const portfolioBalanceUSD = useMemo(() => {
    return txData.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      const rate   = tx.exchange_rate ? Number(tx.exchange_rate) : null;
      const amountUSD =
        tx.currency === 'USD'
          ? amount
          : rate && rate > 0
          ? amount / rate
          : 0;
      return tx.type === 'income' ? sum + amountUSD : sum - amountUSD;
    }, 0);
  }, [txData]);

  const propertyValueUSD = useMemo(() => {
    return propData.reduce((sum, p) => {
      return sum + (p.estimated_value ? Number(p.estimated_value) : 0);
    }, 0);
  }, [propData]);

  const portfolioBalanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of portfolioTxData) {
      const amount = Number(tx.amount);
      const rate   = tx.exchange_rate ? Number(tx.exchange_rate) : null;
      const usd    =
        tx.currency === 'USD'
          ? amount
          : rate && rate > 0
          ? amount / rate
          : 0;
      const prev = map.get(tx.portfolio_id) ?? 0;
      map.set(
        tx.portfolio_id,
        tx.type === 'income' ? prev + usd : prev - usd
      );
    }
    return map;
  }, [portfolioTxData]);

  const isLoading = txLoading || propLoading;
  const isError   = txError   || propError;

  function handleRetry() {
    void refetchTx();
    void refetchProps();
  }

  return (
    <div className="space-y-3 p-6">
      <h1 className="mb-4 text-xl font-medium text-[#1E293B]">
        {t('dashboard.title')}
      </h1>

      {/* S-061 — Net Worth Summary Card */}
      <NetWorthCard
        portfolioBalanceUSD={portfolioBalanceUSD}
        propertyValueUSD={propertyValueUSD}
        isLoading={isLoading}
        isError={!!isError}
        onRetry={handleRetry}
      />

      {/* S-062 — Portfolio Balance Cards */}
      <div className="mt-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#1E293B]">
            {t('dashboard.portfolios.title')}
          </h2>
          <Link
            to={ROUTES.PORTFOLIOS}
            className="text-sm text-[#1E5DC4] hover:text-[#164399]"
          >
            {t('dashboard.portfolios.viewAll')}
          </Link>
        </div>

        {(portfoliosLoading || portfolioTxLoading) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PortfolioBalanceCardSkeleton />
            <PortfolioBalanceCardSkeleton />
            <PortfolioBalanceCardSkeleton />
          </div>
        )}

        {!portfoliosLoading && !portfolioTxLoading &&
         (portfoliosError || portfolioTxError) && (
          <p className="py-2 text-sm text-[#C0392B]">
            {t('dashboard.portfolios.error')}{' '}
            <button
              onClick={() => { void refetchPortfolios(); void refetchPortfolioTx(); }}
              className="cursor-pointer text-[#1E5DC4] underline"
            >
              {t('dashboard.portfolios.retry')}
            </button>
          </p>
        )}

        {!portfoliosLoading && !portfolioTxLoading &&
         !portfoliosError && !portfolioTxError &&
         portfoliosData.length === 0 && (
          <p className="py-2 text-sm text-[#94A3B8]">
            {t('dashboard.portfolios.empty')}
          </p>
        )}

        {!portfoliosLoading && !portfolioTxLoading &&
         !portfoliosError && !portfolioTxError &&
         portfoliosData.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfoliosData.map((portfolio) => (
              <PortfolioBalanceCard
                key={portfolio.id}
                id={portfolio.id}
                name={portfolio.name}
                type={portfolio.type}
                membersCount={portfolio.membersCount}
                netBalanceUSD={portfolioBalanceMap.get(portfolio.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
      {/* TODO S-063: Upcoming obligations */}
      {/* TODO S-064: Last 5 transactions */}
      {/* TODO S-065: Partner shares */}
      {/* TODO S-066: Asset distribution chart */}
      {/* TODO S-067: P&L indicator */}
    </div>
  );
}
