import { useMemo }            from 'react';
import { useQuery }           from '@tanstack/react-query';
import { useTranslation }     from 'react-i18next';
import { supabaseClient }     from '@/lib/supabase';
import NetWorthCard           from '@/components/dashboard/NetWorthCard';

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

      {/* TODO S-062: Portfolio balance cards */}
      {/* TODO S-063: Upcoming obligations */}
      {/* TODO S-064: Last 5 transactions */}
      {/* TODO S-065: Partner shares */}
      {/* TODO S-066: Asset distribution chart */}
      {/* TODO S-067: P&L indicator */}
    </div>
  );
}
