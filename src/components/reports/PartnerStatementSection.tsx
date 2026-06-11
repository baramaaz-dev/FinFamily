import { useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { buildCapitalBreakdown } from '../../utils/capital';
import { supabaseClient } from '@/lib/supabase';
import { exportToPDF } from '../../utils/exportToPDF';

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

// Signed amount: injection + profit_share = positive, all others = negative
// Established in S-050 / CapitalStatementPage — consistent with getSignedAmount()
function getSignedAmountUSD(
  type: string,
  amount: number,
  currency: 'USD' | 'SYP',
  exchangeRate: number | null,
): number {
  const usd = toUSD(amount, currency, exchangeRate);
  const positiveTypes = ['capital_injection', 'profit_share'];
  return positiveTypes.includes(type) ? usd : -usd;
}

function getTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    capital_injection: t('reports.partnerStatement.typeInjection'),
    capital_reduction: t('reports.partnerStatement.typeReduction'),
    drawing:           t('reports.partnerStatement.typeDrawing'),
    profit_share:      t('reports.partnerStatement.typeProfitShare'),
    loss_share:        t('reports.partnerStatement.typeLossShare'),
  };
  return map[type] ?? type;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface RawCapitalAccount {
  id: string;
  partner_id: string;
  entity_type: string;
  entity_id: string;
  opening_balance: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
  opening_date: string;
}

interface RawCapitalTransaction {
  id: string;
  capital_account_id: string;
  type: 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share';
  amount: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
  date: string;
  reference_no: string | null;
  notes: string | null;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchAllAccounts(): Promise<RawCapitalAccount[]> {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select('id, partner_id, entity_type, entity_id, opening_balance, currency, exchange_rate, opening_date');
  if (error) throw error;
  return (data ?? []) as RawCapitalAccount[];
}

async function fetchStatementPeople(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

async function fetchStatementPortfolios(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('portfolios').select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchStatementProperties(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('properties').select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchPartnerTransactions(
  accountIds: string[],
): Promise<RawCapitalTransaction[]> {
  if (accountIds.length === 0) return [];
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('id, capital_account_id, type, amount, currency, exchange_rate, date, reference_no, notes')
    .in('capital_account_id', accountIds)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RawCapitalTransaction[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PartnerStatementSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-lg bg-[#F1F5F9]" />
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-[#E2E8F0] overflow-hidden">
          <div className="h-10 bg-[#F1F5F9] border-b border-[#E2E8F0]" />
          <div className="h-8 bg-[#F8FAFC] border-b border-[#E2E8F0]" />
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex justify-between px-4 py-3 border-b border-[#F1F5F9]">
              <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
              <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 bg-[#F8FAFC]">
            <div className="h-4 w-28 bg-[#E2E8F0] rounded" />
            <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PartnerStatementSection() {
  const { t } = useTranslation();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const accountsQuery = useQuery({
    queryKey: ['statement-report-all-accounts'],
    queryFn: fetchAllAccounts,
    staleTime: 30_000,
  });

  const peopleQuery = useQuery({
    queryKey: ['statement-report-people'],
    queryFn: fetchStatementPeople,
    staleTime: 300_000,
  });

  const portfoliosQuery = useQuery({
    queryKey: ['statement-report-portfolios'],
    queryFn: fetchStatementPortfolios,
    staleTime: 300_000,
  });

  const propertiesQuery = useQuery({
    queryKey: ['statement-report-properties'],
    queryFn: fetchStatementProperties,
    staleTime: 300_000,
  });

  // Derive partner's account IDs before enabling transactions query
  const partnerAccountIds = useMemo(() => {
    if (!selectedPartnerId || !accountsQuery.data) return [] as string[];
    return accountsQuery.data
      .filter((a) => a.partner_id === selectedPartnerId)
      .map((a) => a.id);
  }, [selectedPartnerId, accountsQuery.data]);

  // Transactions query — conditional: only fires when partner selected
  const transactionsQuery = useQuery({
    queryKey: ['statement-report-transactions', selectedPartnerId],
    queryFn: () => fetchPartnerTransactions(partnerAccountIds),
    enabled: !!selectedPartnerId && partnerAccountIds.length > 0,
    staleTime: 30_000,
  });

  // ── Loading / error states ────────────────────────────────────────────────
  const isBaseLoading =
    accountsQuery.isLoading || peopleQuery.isLoading ||
    portfoliosQuery.isLoading || propertiesQuery.isLoading;

  const isTransactionsLoading = !!selectedPartnerId && transactionsQuery.isLoading;

  const isBaseError =
    accountsQuery.isError || peopleQuery.isError ||
    portfoliosQuery.isError || propertiesQuery.isError;

  const isTransactionsError = !!selectedPartnerId && transactionsQuery.isError;

  const handleRetry = () => {
    accountsQuery.refetch();
    peopleQuery.refetch();
    portfoliosQuery.refetch();
    propertiesQuery.refetch();
    if (selectedPartnerId) transactionsQuery.refetch();
  };

  // ── Partner dropdown options ──────────────────────────────────────────────
  const partnerOptions = useMemo(() => {
    if (!accountsQuery.data || !peopleQuery.data) return [];
    const partnerIds = new Set(accountsQuery.data.map((a) => a.partner_id));
    return peopleQuery.data
      .filter((p) => partnerIds.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [accountsQuery.data, peopleQuery.data]);

  // ── Statement data ────────────────────────────────────────────────────────
  const { partnerName, accountSections, grandTotal } = useMemo(() => {
    if (
      !selectedPartnerId || !accountsQuery.data || !transactionsQuery.data ||
      !portfoliosQuery.data || !propertiesQuery.data || !peopleQuery.data
    ) {
      return { partnerName: '', accountSections: [], grandTotal: 0 };
    }

    const portfolioMap = new Map(portfoliosQuery.data.map((p) => [p.id, p.name]));
    const propertyMap  = new Map(propertiesQuery.data.map((p) => [p.id, p.name]));
    const personName   = peopleQuery.data.find((p) => p.id === selectedPartnerId)?.name ?? '—';

    const resolveEntityName = (type: string, id: string): string => {
      if (type === 'portfolio') return portfolioMap.get(id) ?? '—';
      if (type === 'property')  return propertyMap.get(id)  ?? '—';
      return '—';
    };

    const txByAccount = new Map<string, RawCapitalTransaction[]>();
    for (const tx of transactionsQuery.data) {
      const list = txByAccount.get(tx.capital_account_id) ?? [];
      list.push(tx);
      txByAccount.set(tx.capital_account_id, list);
    }

    const partnerAccounts = accountsQuery.data
      .filter((a) => a.partner_id === selectedPartnerId)
      .sort((a, b) => a.opening_date.localeCompare(b.opening_date));

    const accountSections = partnerAccounts.map((account) => {
      const txs = txByAccount.get(account.id) ?? [];
      // canonical rule 2 — single source of truth for breakdown
      const breakdown = buildCapitalBreakdown(
        account.opening_balance,
        account.currency,
        account.exchange_rate,
        txs,
      );
      return {
        account,
        entityName: resolveEntityName(account.entity_type, account.entity_id),
        transactions: txs,
        breakdown,
        closingBalanceUSD: breakdown.closingBalance,
        openingBalanceUSD: toUSD(account.opening_balance, account.currency, account.exchange_rate),
      };
    });

    const grandTotal = accountSections.reduce((s, sec) => s + sec.closingBalanceUSD, 0);

    return { partnerName: personName, accountSections, grandTotal };
  }, [
    selectedPartnerId, accountsQuery.data, transactionsQuery.data,
    portfoliosQuery.data, propertiesQuery.data, peopleQuery.data,
  ]);

  const printRef                      = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!printRef.current) return;
    const safeName = partnerName.replace(/\s+/g, '-');
    const today    = new Date().toISOString().split('T')[0];
    await exportToPDF(
      printRef.current,
      `statement-${safeName}-${today}.pdf`,
      () => setIsExporting(true),
      () => setIsExporting(false),
    );
  };

  const noAccountsForPartner =
    !!selectedPartnerId && !isTransactionsLoading &&
    !isTransactionsError && accountSections.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Base loading skeleton */}
      {isBaseLoading && <PartnerStatementSkeleton />}

      {/* Base error */}
      {!isBaseLoading && isBaseError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reports.partnerStatement.error')}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reports.partnerStatement.retry')}
          </button>
        </div>
      )}

      {/* Empty — no capital accounts at all */}
      {!isBaseLoading && !isBaseError && partnerOptions.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reports.partnerStatement.empty')}</p>
        </div>
      )}

      {/* Partner selector */}
      {!isBaseLoading && !isBaseError && partnerOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-[#1E293B]">
            {t('reports.partnerStatement.selectPartner')}
          </label>
          <select
            value={selectedPartnerId ?? ''}
            onChange={(e) => setSelectedPartnerId(e.target.value || null)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#1E293B]
                       bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] min-w-48"
          >
            <option value="">{t('reports.partnerStatement.selectPartnerPlaceholder')}</option>
            {partnerOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex justify-end ms-auto">
            <button
              onClick={handleExport}
              disabled={isExporting || isTransactionsLoading || accountSections.length === 0}
              className={[
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isExporting || isTransactionsLoading || accountSections.length === 0
                  ? 'text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed opacity-60'
                  : 'text-white bg-[#1E5DC4] hover:bg-[#164399] cursor-pointer',
              ].join(' ')}
            >
              {isExporting ? t('reports.pl.exporting') : t('reports.pl.exportPdf')}
            </button>
          </div>
        </div>
      )}

      {/* No partner selected prompt */}
      {!isBaseLoading && !isBaseError && !selectedPartnerId && partnerOptions.length > 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">
            {t('reports.partnerStatement.noPartnerPrompt')}
          </p>
        </div>
      )}

      {/* Transactions loading */}
      {selectedPartnerId && isTransactionsLoading && <PartnerStatementSkeleton />}

      {/* Transactions error */}
      {selectedPartnerId && !isTransactionsLoading && isTransactionsError && (
        <div className="flex flex-col items-center gap-3 py-8 text-[#C0392B]">
          <p className="text-sm">{t('reports.partnerStatement.error')}</p>
          <button
            onClick={() => transactionsQuery.refetch()}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reports.partnerStatement.retry')}
          </button>
        </div>
      )}

      {/* No accounts for selected partner */}
      {noAccountsForPartner && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[#94A3B8]">
            {t('reports.partnerStatement.noAccounts')}
          </p>
        </div>
      )}

      {/* Statement content */}
      {selectedPartnerId && !isTransactionsLoading && !isTransactionsError &&
       accountSections.length > 0 && (
        <div ref={printRef} className="space-y-4">
          {/* Print header — hidden in browser, revealed by exportToPDF during capture */}
          <div className="pdf-show hidden border-b-2 border-[#E2E8F0] pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-medium text-[#0F172A]">FinFamily</p>
                <p className="text-sm text-[#475569]">إدارة الأصول العائلية</p>
              </div>
              <div className="text-end">
                <p className="text-base font-medium text-[#1E293B]">
                  {t('reports.partnerStatement.title')}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {partnerName}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  تاريخ التصدير: {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Partner header */}
          <div className="flex items-center justify-between p-4 rounded-lg
                          border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center w-10 h-10
                           rounded-full text-sm font-medium"
                style={{ backgroundColor: '#E8F0FB', color: '#1E5DC4' }}
              >
                {getInitials(partnerName)}
              </span>
              <span className="text-xl font-medium text-[#0F172A]">{partnerName}</span>
            </div>
            <div className="text-end">
              <p className="text-xs text-[#475569]">{t('reports.partnerStatement.grandTotal')}</p>
              <p
                className="font-mono tabular-nums text-xl font-medium"
                style={{ color: signColor(grandTotal) }}
              >
                {formatUSD(grandTotal)}
              </p>
            </div>
          </div>

          {/* Account sections */}
          {accountSections.map((section) => (
            <div
              key={section.account.id}
              className="rounded-lg border border-[#E2E8F0] overflow-hidden"
            >
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {/* Account section header */}
                  <tr className="bg-[#F1F5F9]">
                    <th colSpan={5} className="ps-4 pe-4 py-3 text-start">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1E293B]">
                            {section.entityName}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={
                              section.account.entity_type === 'portfolio'
                                ? { color: '#1E5DC4', backgroundColor: '#E8F0FB' }
                                : { color: '#B45309', backgroundColor: '#FEF7EC' }
                            }
                          >
                            {section.account.entity_type === 'portfolio'
                              ? t('reports.equity.typeBadgePortfolio')
                              : t('reports.equity.typeBadgeProperty')}
                          </span>
                        </div>
                        <span className="text-xs text-[#94A3B8] font-normal">
                          {section.account.opening_date}
                        </span>
                      </div>
                    </th>
                  </tr>
                  {/* Column headers */}
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="ps-4 pe-2 py-2 text-start text-xs font-medium text-[#475569]">
                      {t('reports.partnerStatement.colDate')}
                    </th>
                    <th className="ps-2 pe-2 py-2 text-start text-xs font-medium text-[#475569]">
                      {t('reports.partnerStatement.colType')}
                    </th>
                    <th className="ps-2 pe-2 py-2 text-start text-xs font-medium text-[#475569]">
                      {t('reports.partnerStatement.colReference')}
                    </th>
                    <th className="ps-2 pe-2 py-2 text-start text-xs font-medium text-[#475569]">
                      {t('reports.partnerStatement.colNotes')}
                    </th>
                    <th className="ps-2 pe-4 py-2 text-end text-xs font-medium text-[#475569]">
                      {t('reports.partnerStatement.colAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                    <td className="ps-4 pe-2 py-2 text-[#94A3B8] text-xs">
                      {section.account.opening_date}
                    </td>
                    <td colSpan={3} className="ps-2 pe-2 py-2 font-medium text-[#475569]">
                      {t('reports.partnerStatement.openingBalance')}
                    </td>
                    <td
                      className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                      style={{ color: '#1A7D4F' }}
                    >
                      {formatUSD(section.openingBalanceUSD)}
                    </td>
                  </tr>

                  {/* Transaction rows */}
                  {section.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ps-4 pe-4 py-4 text-center text-[#94A3B8]">
                        {t('reports.partnerStatement.noTransactions')}
                      </td>
                    </tr>
                  ) : (
                    section.transactions.map((tx) => {
                      const signed = getSignedAmountUSD(
                        tx.type, tx.amount, tx.currency, tx.exchange_rate,
                      );
                      const prefix = signed > 0 ? '+' : signed < 0 ? '−' : '';
                      const displayAmt = prefix + formatUSD(Math.abs(signed));
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]"
                        >
                          <td className="ps-4 pe-2 py-2 text-[#475569]">{tx.date}</td>
                          <td className="ps-2 pe-2 py-2 text-[#1E293B]">
                            {getTypeLabel(tx.type, t)}
                          </td>
                          <td className="ps-2 pe-2 py-2 text-[#475569]">
                            {tx.reference_no ?? '—'}
                          </td>
                          <td className="ps-2 pe-2 py-2 text-[#475569]">
                            {tx.notes ?? '—'}
                          </td>
                          <td
                            className="ps-2 pe-4 py-2 text-end font-mono tabular-nums"
                            style={{ color: signColor(signed) }}
                          >
                            {displayAmt}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Closing balance row */}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                    <td colSpan={4} className="ps-4 pe-2 py-3 font-medium text-[#1E293B]">
                      {t('reports.partnerStatement.closingBalance')}
                    </td>
                    <td
                      className="ps-2 pe-4 py-3 text-end font-mono tabular-nums font-medium"
                      style={{ color: signColor(section.closingBalanceUSD) }}
                    >
                      {formatUSD(section.closingBalanceUSD)}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          ))}

          {/* Grand total footer */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg
                          border-2 border-[#E2E8F0] bg-[#F1F5F9]">
            <span className="text-base font-medium text-[#0F172A]">
              {t('reports.partnerStatement.grandTotal')}
            </span>
            <span
              className="font-mono tabular-nums text-lg font-medium"
              style={{ color: signColor(grandTotal) }}
            >
              {formatUSD(grandTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
