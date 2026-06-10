import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { buildCapitalBreakdown } from '../../utils/capital';
import { supabaseClient } from '@/lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toUSD(amount: number, currency: 'USD' | 'SYP', exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (exchangeRate) return amount / exchangeRate;
  return 0;
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function signColor(value: number): string {
  if (value > 0) return '#1A7D4F';
  if (value < 0) return '#C0392B';
  return '#94A3B8';
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
}

function getAccentColors(index: number): { icon: string; bg: string } {
  if (index === 0) return { icon: '#1E5DC4', bg: '#E8F0FB' };
  if (index === 1) return { icon: '#1A7D4F', bg: '#EBF5F0' };
  return { icon: '#B45309', bg: '#FEF7EC' };
}

function portfolioTypeBadgeStyle(type: string): { color: string; backgroundColor: string } {
  const map: Record<string, { color: string; backgroundColor: string }> = {
    cash_usd: { color: '#1A7D4F', backgroundColor: '#EBF5F0' },
    cash_syp: { color: '#B45309', backgroundColor: '#FEF7EC' },
    gold:     { color: '#854009', backgroundColor: '#FEF7EC' },
    project:  { color: '#1E5DC4', backgroundColor: '#E8F0FB' },
  };
  return map[type] ?? { color: '#475569', backgroundColor: '#F1F5F9' };
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RawTransaction {
  portfolio_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

interface RawPortfolio {
  id: string;
  name: string;
  type: string;
}

interface RawProperty {
  id: string;
  name: string;
  estimated_value: number | null;
}

interface RawUnpaidExpense {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

interface RawCapitalAccount {
  id: string;
  partner_id: string;
  opening_balance: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

interface RawCapitalTransaction {
  id: string;
  capital_account_id: string;
  type: 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share';
  amount: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchBalanceTransactions(asOfDate: string): Promise<RawTransaction[]> {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('portfolio_id, type, amount, currency, exchange_rate')
    .lte('date', asOfDate);
  if (error) throw error;
  return (data ?? []) as RawTransaction[];
}

async function fetchBalancePortfolios(): Promise<RawPortfolio[]> {
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select('id, name, type');
  if (error) throw error;
  return data ?? [];
}

async function fetchBalanceProperties(): Promise<RawProperty[]> {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('id, name, estimated_value');
  if (error) throw error;
  return data ?? [];
}

async function fetchUnpaidExpenses(asOfDate: string): Promise<RawUnpaidExpense[]> {
  const { data, error } = await supabaseClient
    .from('property_expenses')
    .select('id, property_id, type, amount, currency, exchange_rate')
    .is('paid_date', null)
    .lte('due_date', asOfDate);
  if (error) throw error;
  return (data ?? []) as RawUnpaidExpense[];
}

async function fetchBalanceCapitalAccounts(): Promise<RawCapitalAccount[]> {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select('id, partner_id, opening_balance, currency, exchange_rate');
  if (error) throw error;
  return (data ?? []) as RawCapitalAccount[];
}

async function fetchBalanceCapitalTransactions(asOfDate: string): Promise<RawCapitalTransaction[]> {
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('id, capital_account_id, type, amount, currency, exchange_rate')
    .lte('date', asOfDate);
  if (error) throw error;
  return (data ?? []) as RawCapitalTransaction[];
}

async function fetchBalancePeople(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('people').select('id, name');
  if (error) throw error;
  return data ?? [];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BalanceSheetSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-[#F1F5F9]" />)}
      </div>
      <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <div className="h-4 w-40 bg-[#E2E8F0] rounded" />
            <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BalanceSheetSection() {
  const { t } = useTranslation();

  const [asOfDate, setAsOfDate]       = useState(getToday());
  const [appliedAsOf, setAppliedAsOf] = useState(getToday());

  const handleApplyAsOf = () => setAppliedAsOf(asOfDate);

  const txQuery     = useQuery({ queryKey: ['balance-report-transactions',         appliedAsOf], queryFn: () => fetchBalanceTransactions(appliedAsOf),        staleTime: 30_000 });
  const portfoliosQ = useQuery({ queryKey: ['balance-report-portfolios'],                        queryFn: fetchBalancePortfolios,                             staleTime: 300_000 });
  const propertiesQ = useQuery({ queryKey: ['balance-report-properties'],                        queryFn: fetchBalanceProperties,                             staleTime: 300_000 });
  const unpaidQ     = useQuery({ queryKey: ['balance-report-unpaid-expenses',      appliedAsOf], queryFn: () => fetchUnpaidExpenses(appliedAsOf),             staleTime: 30_000 });
  const accountsQ   = useQuery({ queryKey: ['balance-report-capital-accounts'],                  queryFn: fetchBalanceCapitalAccounts,                        staleTime: 30_000 });
  const capitalTxQ  = useQuery({ queryKey: ['balance-report-capital-transactions', appliedAsOf], queryFn: () => fetchBalanceCapitalTransactions(appliedAsOf), staleTime: 30_000 });
  const peopleQ     = useQuery({ queryKey: ['balance-report-people'],                            queryFn: fetchBalancePeople,                                 staleTime: 300_000 });

  const isLoading =
    txQuery.isLoading || portfoliosQ.isLoading || propertiesQ.isLoading ||
    unpaidQ.isLoading || accountsQ.isLoading || capitalTxQ.isLoading || peopleQ.isLoading;

  const isError =
    txQuery.isError || portfoliosQ.isError || propertiesQ.isError ||
    unpaidQ.isError || accountsQ.isError || capitalTxQ.isError || peopleQ.isError;

  const handleRetry = () => {
    [txQuery, portfoliosQ, propertiesQ, unpaidQ, accountsQ, capitalTxQ, peopleQ]
      .forEach((q) => q.refetch());
  };

  // ── Derived balance sheet data ────────────────────────────────────────────
  const {
    portfolioRows,
    propertyRows,
    totalPortfoliosUSD,
    totalPropertiesUSD,
    totalAssetsUSD,
    liabilityRows,
    totalLiabilitiesUSD,
    partnerEquityRows,
    totalEquityUSD,
  } = useMemo(() => {
    const empty = {
      portfolioRows: [] as { id: string; name: string; type: string; balanceUSD: number }[],
      propertyRows: [] as { id: string; name: string; valueUSD: number }[],
      totalPortfoliosUSD: 0, totalPropertiesUSD: 0, totalAssetsUSD: 0,
      liabilityRows: [] as { id: string; propertyName: string; type: string; amountUSD: number }[],
      totalLiabilitiesUSD: 0,
      partnerEquityRows: [] as { partnerId: string; name: string; totalUSD: number; accentIndex: number }[],
      totalEquityUSD: 0,
    };

    if (
      !txQuery.data || !portfoliosQ.data || !propertiesQ.data ||
      !unpaidQ.data || !accountsQ.data || !capitalTxQ.data || !peopleQ.data
    ) {
      return empty;
    }

    // ── ASSETS: Portfolio balances (income + / expense - / transfer skipped) ─
    const portfolioBalanceMap = new Map<string, number>();
    for (const tx of txQuery.data) {
      if (tx.type === 'transfer') continue;
      const usd = toUSD(tx.amount, tx.currency, tx.exchange_rate);
      const prev = portfolioBalanceMap.get(tx.portfolio_id) ?? 0;
      portfolioBalanceMap.set(
        tx.portfolio_id,
        tx.type === 'income' ? prev + usd : prev - usd,
      );
    }

    const portfolioRows = portfoliosQ.data.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      balanceUSD: portfolioBalanceMap.get(p.id) ?? 0,
    }));
    const totalPortfoliosUSD = portfolioRows.reduce((s, r) => s + r.balanceUSD, 0);

    // ── ASSETS: Property estimated values ────────────────────────────────────
    const propertyMap = new Map(propertiesQ.data.map((p) => [p.id, p.name]));

    const propertyRows = propertiesQ.data.map((p) => ({
      id: p.id,
      name: p.name,
      valueUSD: p.estimated_value ?? 0,
    }));
    const totalPropertiesUSD = propertyRows.reduce((s, r) => s + r.valueUSD, 0);
    const totalAssetsUSD = totalPortfoliosUSD + totalPropertiesUSD;

    // ── LIABILITIES: Unpaid property expenses ────────────────────────────────
    const liabilityRows = unpaidQ.data.map((exp) => ({
      id: exp.id,
      propertyName: propertyMap.get(exp.property_id) ?? '—',
      type: exp.type,
      amountUSD: toUSD(exp.amount, exp.currency, exp.exchange_rate),
    }));
    const totalLiabilitiesUSD = liabilityRows.reduce((s, r) => s + r.amountUSD, 0);

    // ── EQUITY: Partners' capital closing balances ────────────────────────────
    const txByAccount = new Map<string, RawCapitalTransaction[]>();
    for (const tx of capitalTxQ.data) {
      const list = txByAccount.get(tx.capital_account_id) ?? [];
      list.push(tx);
      txByAccount.set(tx.capital_account_id, list);
    }

    const partnerTotalMap = new Map<string, number>();
    for (const account of accountsQ.data) {
      const txs = txByAccount.get(account.id) ?? [];
      // canonical rule 2 — buildCapitalBreakdown is the single source of truth
      const breakdown = buildCapitalBreakdown(
        account.opening_balance,
        account.currency,
        account.exchange_rate,
        txs,
      );
      const prev = partnerTotalMap.get(account.partner_id) ?? 0;
      partnerTotalMap.set(account.partner_id, prev + breakdown.closingBalance);
    }

    const peopleMap = new Map(peopleQ.data.map((p) => [p.id, p.name]));

    const unsorted = Array.from(partnerTotalMap.entries()).map(
      ([partnerId, totalUSD]) => ({
        partnerId,
        name: peopleMap.get(partnerId) ?? '—',
        totalUSD,
      }),
    );
    unsorted.sort((a, b) => b.totalUSD - a.totalUSD);

    const partnerEquityRows = unsorted.map((p, idx) => ({
      ...p,
      accentIndex: idx, // assigned AFTER sort per STR-004 §2.4
    }));
    const totalEquityUSD = partnerEquityRows.reduce((s, r) => s + r.totalUSD, 0);

    return {
      portfolioRows, propertyRows,
      totalPortfoliosUSD, totalPropertiesUSD, totalAssetsUSD,
      liabilityRows, totalLiabilitiesUSD,
      partnerEquityRows, totalEquityUSD,
    };
  }, [
    txQuery.data, portfoliosQ.data, propertiesQ.data, unpaidQ.data,
    accountsQ.data, capitalTxQ.data, peopleQ.data,
  ]);

  // Explicit map for portfolio type labels — avoids TypeScript strict mode issues
  const portfolioTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      cash_usd: t('reports.balance.typeCashUsd'),
      cash_syp: t('reports.balance.typeCashSyp'),
      gold:     t('reports.balance.typeGold'),
      project:  t('reports.balance.typeProject'),
    };
    return map[type] ?? type;
  };

  const hasData = portfolioRows.length > 0 || propertyRows.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* As-of-date filter — always visible */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">
            {t('reports.filters.asOfDate')}
          </label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm
                       text-[#1E293B] focus:outline-none focus:ring-2
                       focus:ring-[#1E5DC4] bg-white"
          />
        </div>
        <button
          onClick={handleApplyAsOf}
          className="px-4 py-2 rounded-md text-sm font-medium text-white
                     bg-[#1E5DC4] hover:bg-[#164399] transition-colors"
        >
          {t('reports.pl.apply')}
        </button>
      </div>

      {isLoading && <BalanceSheetSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reports.balance.error')}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reports.balance.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reports.balance.empty')}</p>
        </div>
      )}

      {!isLoading && !isError && hasData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#A3D4BC] bg-[#EBF5F0] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.balance.totalAssets')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#1A7D4F]">
                {formatUSD(totalAssetsUSD)}
              </p>
            </div>
            <div className="rounded-lg border border-[#F5B9B5] bg-[#FEF0EF] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.balance.totalLiabilities')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#C0392B]">
                {formatUSD(totalLiabilitiesUSD)}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.balance.totalEquity')}</p>
              <p
                className="font-mono tabular-nums text-2xl font-medium"
                style={{ color: signColor(totalEquityUSD) }}
              >
                {formatUSD(totalEquityUSD)}
              </p>
            </div>
          </div>

          {/* Balance sheet table */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <tbody>

                {/* ══ ASSETS ══ */}
                <tr className="bg-[#F1F5F9]">
                  <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                    {t('reports.balance.sectionAssets')}
                  </td>
                </tr>

                {/* Portfolios sub-section */}
                <tr className="bg-[#F8FAFC]">
                  <td colSpan={2} className="ps-6 pe-4 py-1 text-xs font-medium text-[#94A3B8]">
                    {t('reports.balance.subPortfolios')}
                  </td>
                </tr>
                {portfolioRows.map((p) => (
                  <tr key={p.id} className="border-t border-[#F1F5F9]">
                    <td className="ps-8 pe-4 py-2 text-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={portfolioTypeBadgeStyle(p.type)}
                        >
                          {portfolioTypeLabel(p.type)}
                        </span>
                      </div>
                    </td>
                    <td
                      className="ps-4 pe-4 py-2 text-end font-mono tabular-nums"
                      style={{ color: signColor(p.balanceUSD) }}
                    >
                      {formatUSD(p.balanceUSD)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="ps-6 pe-4 py-2 text-[#475569]">
                    {t('reports.balance.subPortfolios')}
                  </td>
                  <td
                    className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                    style={{ color: signColor(totalPortfoliosUSD) }}
                  >
                    {formatUSD(totalPortfoliosUSD)}
                  </td>
                </tr>

                {/* Properties sub-section */}
                <tr className="bg-[#F8FAFC]">
                  <td colSpan={2} className="ps-6 pe-4 py-1 text-xs font-medium text-[#94A3B8]">
                    {t('reports.balance.subProperties')}
                  </td>
                </tr>
                {propertyRows.map((p) => (
                  <tr key={p.id} className="border-t border-[#F1F5F9]">
                    <td className="ps-8 pe-4 py-2 text-[#1E293B]">{p.name}</td>
                    <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#1A7D4F]">
                      {formatUSD(p.valueUSD)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="ps-6 pe-4 py-2 text-[#475569]">
                    {t('reports.balance.subProperties')}
                  </td>
                  <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#1A7D4F]">
                    {formatUSD(totalPropertiesUSD)}
                  </td>
                </tr>

                {/* Total Assets */}
                <tr className="border-t-2 border-[#E2E8F0] bg-[#EBF5F0]">
                  <td className="ps-4 pe-4 py-3 text-base font-medium text-[#126038]">
                    {t('reports.balance.totalAssets')}
                  </td>
                  <td className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium text-[#1A7D4F]">
                    {formatUSD(totalAssetsUSD)}
                  </td>
                </tr>

                {/* ══ LIABILITIES ══ */}
                <tr className="bg-[#F1F5F9]">
                  <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                    {t('reports.balance.sectionLiabilities')}
                  </td>
                </tr>
                {liabilityRows.length === 0 ? (
                  <tr className="border-t border-[#F1F5F9]">
                    <td colSpan={2} className="ps-8 pe-4 py-3 text-[#94A3B8]">
                      {t('reports.balance.noLiabilities')}
                    </td>
                  </tr>
                ) : (
                  liabilityRows.map((exp) => (
                    <tr key={exp.id} className="border-t border-[#F1F5F9]">
                      <td className="ps-8 pe-4 py-2 text-[#1E293B]">
                        {exp.propertyName}
                        <span className="text-xs text-[#94A3B8] ms-2">{exp.type}</span>
                      </td>
                      <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#C0392B]">
                        {formatUSD(exp.amountUSD)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="border-t-2 border-[#E2E8F0] bg-[#FEF0EF]">
                  <td className="ps-4 pe-4 py-3 text-base font-medium text-[#922B21]">
                    {t('reports.balance.totalLiabilities')}
                  </td>
                  <td className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium text-[#C0392B]">
                    {formatUSD(totalLiabilitiesUSD)}
                  </td>
                </tr>

                {/* ══ EQUITY ══ */}
                <tr className="bg-[#F1F5F9]">
                  <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                    {t('reports.balance.sectionEquity')}
                  </td>
                </tr>
                {partnerEquityRows.map((p) => {
                  const accent = getAccentColors(p.accentIndex);
                  return (
                    <tr key={p.partnerId} className="border-t border-[#F1F5F9]">
                      <td className="ps-8 pe-4 py-2 text-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center justify-center
                                       w-6 h-6 rounded-full text-xs font-medium"
                            style={{ backgroundColor: accent.bg, color: accent.icon }}
                          >
                            {getInitials(p.name)}
                          </span>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td
                        className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                        style={{ color: signColor(p.totalUSD) }}
                      >
                        {formatUSD(p.totalUSD)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                    {t('reports.balance.totalEquity')}
                  </td>
                  <td
                    className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                    style={{ color: signColor(totalEquityUSD) }}
                  >
                    {formatUSD(totalEquityUSD)}
                  </td>
                </tr>

                {/* ══ LIABILITIES + EQUITY COMBINED ══ */}
                <tr className="border-t-2 border-[#E2E8F0] bg-[#F1F5F9]">
                  <td className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                    {t('reports.balance.totalLiabilitiesEquity')}
                  </td>
                  <td
                    className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                    style={{ color: signColor(totalLiabilitiesUSD + totalEquityUSD) }}
                  >
                    {formatUSD(totalLiabilitiesUSD + totalEquityUSD)}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* MVP Note */}
          <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
            <Info size={12} className="mt-0.5 shrink-0" />
            <p>{t('reports.balance.mvpNote')}</p>
          </div>
        </>
      )}
    </div>
  );
}
