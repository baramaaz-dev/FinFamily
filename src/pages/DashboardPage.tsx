import { useMemo }                          from 'react';
import { Link }                             from 'react-router-dom';
import { useQuery }                         from '@tanstack/react-query';
import { useTranslation }                   from 'react-i18next';
import { supabaseClient }                   from '@/lib/supabase';
import type { Portfolio }                   from '@/types';
import { ROUTES }                           from '@/router/routes';
import { buildCapitalBreakdown }            from '@/utils/capital';
import NetWorthCard                         from '@/components/dashboard/NetWorthCard';
import PortfolioBalanceCard                 from '@/components/dashboard/PortfolioBalanceCard';
import PortfolioBalanceCardSkeleton         from '@/components/dashboard/PortfolioBalanceCardSkeleton';
import UpcomingObligationsSection, {
  type ActiveLease,
  type UnpaidExpense,
}                                           from '@/components/dashboard/UpcomingObligationsSection';
import RecentTransactionsTable, {
  type DashboardTransaction,
}                                           from '@/components/dashboard/RecentTransactionsTable';
import PartnerSharesSection, {
  type PartnerShareRow,
}                                           from '@/components/dashboard/PartnerSharesSection';
import PLIndicatorCard                      from '@/components/dashboard/PLIndicatorCard';

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

async function fetchActiveLeases() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseClient
    .from('leases')
    .select('id, property_id, tenant_name, rent_amount, currency, frequency, start_date, end_date')
    .lte('start_date', today);
  if (error) throw error;
  return data ?? [];
}

async function fetchUnpaidExpenses() {
  const { data, error } = await supabaseClient
    .from('property_expenses')
    .select('id, property_id, type, amount, currency, due_date')
    .is('paid_date', null)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchObligationPropertyNames() {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchCapitalAccountsForDashboard() {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select('id, partner_id, opening_balance, currency');
  if (error) throw error;
  return data ?? [];
}

async function fetchCapitalTransactionsForDashboard() {
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('capital_account_id, type, amount, currency, exchange_rate');
  if (error) throw error;
  return data ?? [];
}

async function fetchPeopleSlimForDashboard() {
  const { data, error } = await supabaseClient
    .from('people')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

async function fetchPLCurrentMonth() {
  const firstDay = getFirstDayOfMonth();
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('type, amount, currency, exchange_rate')
    .in('type', ['income', 'expense'])
    .gte('date', firstDay);
  if (error) throw error;
  return data ?? [];
}

async function fetchRecentTransactions() {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, type, amount, currency, exchange_rate, category, date, portfolios(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:             row.id,
    type:           row.type as DashboardTransaction['type'],
    amount:         Number(row.amount),
    currency:       row.currency as DashboardTransaction['currency'],
    exchange_rate:  row.exchange_rate ? Number(row.exchange_rate) : null,
    category:       row.category,
    date:           row.date,
    portfolio_name: (row.portfolios as unknown as { name: string } | null)?.name ?? '—',
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();

  const today = new Date().toISOString().split('T')[0];

  const periodLabel = new Intl.DateTimeFormat('ar-SA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

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

  const {
    data:      leasesData             = [],
    isLoading: leasesLoading,
    isError:   leasesError,
    refetch:   refetchLeases,
  } = useQuery({
    queryKey: ['dashboard-active-leases'],
    queryFn:  fetchActiveLeases,
    staleTime: 60_000,
  });

  const {
    data:      unpaidExpensesData     = [],
    isLoading: expensesLoading,
    isError:   expensesError,
    refetch:   refetchExpenses,
  } = useQuery({
    queryKey: ['dashboard-unpaid-expenses'],
    queryFn:  fetchUnpaidExpenses,
    staleTime: 60_000,
  });

  const {
    data:      obligationPropertiesData = [],
    isLoading: obligationPropsLoading,
    isError:   obligationPropsError,
    refetch:   refetchObligationProps,
  } = useQuery({
    queryKey: ['dashboard-obligation-property-names'],
    queryFn:  fetchObligationPropertyNames,
    staleTime: 300_000,
  });

  const {
    data:      recentTxData     = [],
    isLoading: recentTxLoading,
    isError:   recentTxError,
    refetch:   refetchRecentTx,
  } = useQuery({
    queryKey: ['dashboard-recent-transactions'],
    queryFn:  fetchRecentTransactions,
    staleTime: 30_000,
  });

  const {
    data:      capitalAccountsData    = [],
    isLoading: capitalAccountsLoading,
    isError:   capitalAccountsError,
    refetch:   refetchCapitalAccounts,
  } = useQuery({
    queryKey: ['capital-accounts'],
    queryFn:  fetchCapitalAccountsForDashboard,
    staleTime: 30_000,
  });

  const {
    data:      capitalTxAllData    = [],
    isLoading: capitalTxAllLoading,
    isError:   capitalTxAllError,
    refetch:   refetchCapitalTxAll,
  } = useQuery({
    queryKey: ['capital-transactions-all'],
    queryFn:  fetchCapitalTransactionsForDashboard,
    staleTime: 30_000,
  });

  const {
    data:      peopleSlimData    = [],
    isLoading: peopleSlimLoading,
    isError:   peopleSlimError,
    refetch:   refetchPeopleSlim,
  } = useQuery({
    queryKey: ['people-slim'],
    queryFn:  fetchPeopleSlimForDashboard,
    staleTime: 300_000,
  });

  const {
    data:      plData    = [],
    isLoading: plLoading,
    isError:   plError,
    refetch:   refetchPL,
  } = useQuery({
    queryKey: ['dashboard-pl-current-month'],
    queryFn:  fetchPLCurrentMonth,
    staleTime: 30_000,
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

  const activeLeases = useMemo(
    () => leasesData.filter(
      (l) => !l.end_date || l.end_date >= today
    ) as ActiveLease[],
    [leasesData, today]
  );

  const propertyNameMap = useMemo(
    () => new Map(obligationPropertiesData.map((p) => [p.id, p.name])),
    [obligationPropertiesData]
  );

  const unpaidExpenses = unpaidExpensesData as UnpaidExpense[];

  const { partnerShareRows, grandTotal } = useMemo(() => {
    const closingBalanceMap = new Map<string, number>();
    for (const account of capitalAccountsData) {
      const txsForAccount = capitalTxAllData.filter(
        (tx) => tx.capital_account_id === account.id
      );
      const breakdown = buildCapitalBreakdown(
        Number(account.opening_balance),
        account.currency as 'USD' | 'SYP',
        null,
        txsForAccount.map((tx) => ({
          type         : tx.type as 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share',
          amount       : Number(tx.amount),
          currency     : tx.currency as 'USD' | 'SYP',
          exchange_rate: tx.exchange_rate ? Number(tx.exchange_rate) : null,
        }))
      );
      closingBalanceMap.set(account.id, breakdown.closingBalance);
    }

    const partnerTotalMap = new Map<string, number>();
    for (const account of capitalAccountsData) {
      const closing = closingBalanceMap.get(account.id) ?? 0;
      partnerTotalMap.set(
        account.partner_id,
        (partnerTotalMap.get(account.partner_id) ?? 0) + closing
      );
    }

    const total = Array.from(partnerTotalMap.values()).reduce((s, v) => s + v, 0);

    const rows: PartnerShareRow[] = peopleSlimData
      .filter((p) => partnerTotalMap.has(p.id))
      .map((p) => ({
        personId       : p.id,
        name           : p.name,
        totalCapitalUSD: partnerTotalMap.get(p.id) ?? 0,
        sharePercent   : total !== 0
          ? ((partnerTotalMap.get(p.id) ?? 0) / total) * 100
          : 0,
        accentIndex    : 0,
      }))
      .sort((a, b) => b.totalCapitalUSD - a.totalCapitalUSD)
      .map((row, idx) => ({ ...row, accentIndex: idx }));

    return { partnerShareRows: rows, grandTotal: total };
  }, [capitalAccountsData, capitalTxAllData, peopleSlimData]);

  const { incomeUSD, expenseUSD, netPL } = useMemo(() => {
    let income  = 0;
    let expense = 0;
    for (const tx of plData) {
      const amount = Number(tx.amount);
      const rate   = tx.exchange_rate ? Number(tx.exchange_rate) : null;
      const usd    =
        tx.currency === 'USD'
          ? amount
          : rate && rate > 0
          ? amount / rate
          : 0;
      if (tx.type === 'income')  income  += usd;
      if (tx.type === 'expense') expense += usd;
    }
    return { incomeUSD: income, expenseUSD: expense, netPL: income - expense };
  }, [plData]);

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
      {/* S-063 — Upcoming Obligations */}
      <UpcomingObligationsSection
        activeLeases={activeLeases}
        unpaidExpenses={unpaidExpenses}
        propertyNameMap={propertyNameMap}
        today={today}
        isLoading={leasesLoading || expensesLoading || obligationPropsLoading}
        isError={!!(leasesError || expensesError || obligationPropsError)}
        onRetry={() => {
          void refetchLeases();
          void refetchExpenses();
          void refetchObligationProps();
        }}
      />
      {/* S-064 — Recent Transactions */}
      <RecentTransactionsTable
        transactions={recentTxData}
        isLoading={recentTxLoading}
        isError={!!recentTxError}
        onRetry={() => void refetchRecentTx()}
      />
      {/* S-065 — Partner Shares */}
      <PartnerSharesSection
        rows={partnerShareRows}
        grandTotal={grandTotal}
        isLoading={capitalAccountsLoading || capitalTxAllLoading || peopleSlimLoading}
        isError={!!(capitalAccountsError || capitalTxAllError || peopleSlimError)}
        onRetry={() => {
          void refetchCapitalAccounts();
          void refetchCapitalTxAll();
          void refetchPeopleSlim();
        }}
      />
      {/* TODO S-066: Asset distribution chart */}
      {/* S-067 — P&L Indicator */}
      <PLIndicatorCard
        incomeUSD={incomeUSD}
        expenseUSD={expenseUSD}
        netPL={netPL}
        periodLabel={periodLabel}
        isLoading={plLoading}
        isError={!!plError}
        onRetry={() => void refetchPL()}
      />
    </div>
  );
}
