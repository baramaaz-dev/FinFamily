import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { buildCapitalBreakdown } from '../../utils/capital';
import { supabaseClient } from '@/lib/supabase';
import { ROUTES } from '../../router/routes';
import { exportToPDF } from '../../utils/exportToPDF';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Partner avatar accent colors by sorted index — STR-004 §2.4
function getAccentColors(index: number): { icon: string; bg: string } {
  if (index === 0) return { icon: '#1E5DC4', bg: '#E8F0FB' };
  if (index === 1) return { icon: '#1A7D4F', bg: '#EBF5F0' };
  return { icon: '#B45309', bg: '#FEF7EC' };
}

// First two words, first char each
function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
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
}

interface RawCapitalTransaction {
  id: string;
  capital_account_id: string;
  type: 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share';
  amount: number;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

interface EquityPartnerRow {
  partnerId: string;
  partnerName: string;
  accentIndex: number;
  accounts: EquityAccountRow[];
  partnerTotalUSD: number;
}

interface EquityAccountRow {
  accountId: string;
  entityType: string;
  entityName: string;
  openingBalanceUSD: number;
  netMovementsUSD: number;
  closingBalanceUSD: number;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchEquityCapitalAccounts(): Promise<RawCapitalAccount[]> {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select('id, partner_id, entity_type, entity_id, opening_balance, currency, exchange_rate');
  if (error) throw error;
  return (data ?? []) as RawCapitalAccount[];
}

async function fetchEquityCapitalTransactions(): Promise<RawCapitalTransaction[]> {
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('id, capital_account_id, type, amount, currency, exchange_rate');
  if (error) throw error;
  return (data ?? []) as RawCapitalTransaction[];
}

async function fetchEquityPeople(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('people').select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchEquityPortfolios(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('portfolios').select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchEquityProperties(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('properties').select('id, name');
  if (error) throw error;
  return data ?? [];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function EquityReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-lg bg-[#F1F5F9]" />
      <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
        <div className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0]" />
        {[0, 1].map((p) => (
          <div key={p}>
            <div className="flex items-center justify-between px-4 py-3 bg-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0]" />
                <div className="h-4 w-28 bg-[#E2E8F0] rounded" />
              </div>
              <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
            </div>
            {[0, 1].map((r) => (
              <div key={r} className="flex justify-between px-4 py-3 border-b border-[#F1F5F9]">
                <div className="h-4 w-36 bg-[#E2E8F0] rounded" />
                <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 bg-[#F8FAFC]">
              <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
              <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EquityReportSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const accountsQuery = useQuery({
    queryKey: ['equity-report-capital-accounts'],
    queryFn: fetchEquityCapitalAccounts,
    staleTime: 30_000,
  });

  const transactionsQuery = useQuery({
    queryKey: ['equity-report-capital-transactions'],
    queryFn: fetchEquityCapitalTransactions,
    staleTime: 30_000,
  });

  const peopleQuery = useQuery({
    queryKey: ['equity-report-people'],
    queryFn: fetchEquityPeople,
    staleTime: 300_000,
  });

  const portfoliosQuery = useQuery({
    queryKey: ['equity-report-portfolios'],
    queryFn: fetchEquityPortfolios,
    staleTime: 300_000,
  });

  const propertiesQuery = useQuery({
    queryKey: ['equity-report-properties'],
    queryFn: fetchEquityProperties,
    staleTime: 300_000,
  });

  const isLoading =
    accountsQuery.isLoading || transactionsQuery.isLoading || peopleQuery.isLoading ||
    portfoliosQuery.isLoading || propertiesQuery.isLoading;

  const isError =
    accountsQuery.isError || transactionsQuery.isError || peopleQuery.isError ||
    portfoliosQuery.isError || propertiesQuery.isError;

  const handleRetry = () => {
    accountsQuery.refetch();
    transactionsQuery.refetch();
    peopleQuery.refetch();
    portfoliosQuery.refetch();
    propertiesQuery.refetch();
  };

  // ── Derived equity data ───────────────────────────────────────────────────
  const { partnerRows, grandTotal } = useMemo(() => {
    if (
      !accountsQuery.data || !transactionsQuery.data || !peopleQuery.data ||
      !portfoliosQuery.data || !propertiesQuery.data
    ) {
      return { partnerRows: [] as EquityPartnerRow[], grandTotal: 0 };
    }

    const peopleMap    = new Map(peopleQuery.data.map((p) => [p.id, p.name]));
    const portfolioMap = new Map(portfoliosQuery.data.map((p) => [p.id, p.name]));
    const propertyMap  = new Map(propertiesQuery.data.map((p) => [p.id, p.name]));

    const txByAccount = new Map<string, RawCapitalTransaction[]>();
    for (const tx of transactionsQuery.data) {
      const list = txByAccount.get(tx.capital_account_id) ?? [];
      list.push(tx);
      txByAccount.set(tx.capital_account_id, list);
    }

    const resolveEntityName = (entityType: string, entityId: string): string => {
      if (entityType === 'portfolio') return portfolioMap.get(entityId) ?? '—';
      if (entityType === 'property')  return propertyMap.get(entityId)  ?? '—';
      return '—';
    };

    const partnerMap = new Map<string, EquityAccountRow[]>();
    for (const account of accountsQuery.data) {
      const txs = txByAccount.get(account.id) ?? [];
      const breakdown = buildCapitalBreakdown(
        account.opening_balance,
        account.currency,
        account.exchange_rate,
        txs,
      );
      const accountRow: EquityAccountRow = {
        accountId:        account.id,
        entityType:       account.entity_type,
        entityName:       resolveEntityName(account.entity_type, account.entity_id),
        openingBalanceUSD: breakdown.openingBalance,
        netMovementsUSD:   breakdown.closingBalance - breakdown.openingBalance,
        closingBalanceUSD: breakdown.closingBalance,
      };
      const existing = partnerMap.get(account.partner_id) ?? [];
      existing.push(accountRow);
      partnerMap.set(account.partner_id, existing);
    }

    const unsorted: Omit<EquityPartnerRow, 'accentIndex'>[] = Array.from(
      partnerMap.entries(),
    ).map(([partnerId, accounts]) => ({
      partnerId,
      partnerName: peopleMap.get(partnerId) ?? '—',
      accounts,
      partnerTotalUSD: accounts.reduce((s, a) => s + a.closingBalanceUSD, 0),
    }));

    unsorted.sort((a, b) => b.partnerTotalUSD - a.partnerTotalUSD);

    const partnerRows: EquityPartnerRow[] = unsorted.map((row, idx) => ({
      ...row,
      accentIndex: idx,
    }));

    const grandTotal = partnerRows.reduce((s, r) => s + r.partnerTotalUSD, 0);

    return { partnerRows, grandTotal };
  }, [
    accountsQuery.data, transactionsQuery.data, peopleQuery.data,
    portfoliosQuery.data, propertiesQuery.data,
  ]);

  const hasData = partnerRows.length > 0;

  const printRef                      = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!printRef.current) return;
    const today = new Date().toISOString().split('T')[0];
    await exportToPDF(
      printRef.current,
      `equity-report-${today}.pdf`,
      () => setIsExporting(true),
      () => setIsExporting(false),
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {isLoading && <EquityReportSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reports.equity.error')}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reports.equity.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reports.equity.empty')}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading || !hasData}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isExporting || isLoading || !hasData
                ? 'text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed opacity-60'
                : 'text-white bg-[#1E5DC4] hover:bg-[#164399] cursor-pointer',
            ].join(' ')}
          >
            {isExporting ? t('reports.pl.exporting') : t('reports.pl.exportPdf')}
          </button>
        </div>
      )}

      {!isLoading && !isError && hasData && (
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
                  {t('reports.equity.title')}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  تاريخ التصدير: {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Summary card — grand total */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 flex
                          items-center justify-between">
            <p className="text-sm text-[#475569]">{t('reports.equity.totalEquity')}</p>
            <p
              className="font-mono tabular-nums text-2xl font-medium"
              style={{ color: signColor(grandTotal) }}
            >
              {formatUSD(grandTotal)}
            </p>
          </div>

          {/* Detail table */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="ps-4 pe-2 py-3 text-start text-xs font-medium text-[#475569]">
                    {t('reports.equity.colEntity')}
                  </th>
                  <th className="ps-2 pe-4 py-3 text-end text-xs font-medium text-[#475569]">
                    {t('reports.equity.colOpening')}
                  </th>
                  <th className="ps-2 pe-4 py-3 text-end text-xs font-medium text-[#475569]">
                    {t('reports.equity.colMovements')}
                  </th>
                  <th className="ps-2 pe-4 py-3 text-end text-xs font-medium text-[#475569]">
                    {t('reports.equity.colClosing')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {partnerRows.map((partner) => {
                  const accent = getAccentColors(partner.accentIndex);
                  return (
                    <React.Fragment key={partner.partnerId}>
                      {/* Partner header row */}
                      <tr className="bg-[#F1F5F9]">
                        <td colSpan={4} className="ps-4 pe-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center justify-center
                                           w-8 h-8 rounded-full text-xs font-medium"
                                style={{ backgroundColor: accent.bg, color: accent.icon }}
                              >
                                {getInitials(partner.partnerName)}
                              </span>
                              <span className="font-medium text-[#0F172A]">
                                {partner.partnerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="font-mono tabular-nums font-medium text-base"
                                style={{ color: signColor(partner.partnerTotalUSD) }}
                              >
                                {formatUSD(partner.partnerTotalUSD)}
                              </span>
                              <button
                                onClick={() => navigate(ROUTES.PARTNER_DETAIL(partner.partnerId))}
                                className="text-[#94A3B8] hover:text-[#1E5DC4] transition-colors"
                                title={t('reports.equity.viewPartner')}
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Entity detail rows */}
                      {partner.accounts.map((account) => (
                        <tr
                          key={account.accountId}
                          className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]"
                        >
                          <td className="ps-8 pe-2 py-2 text-[#1E293B]">
                            <div className="flex items-center gap-2">
                              <span>{account.entityName}</span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={
                                  account.entityType === 'portfolio'
                                    ? { color: '#1E5DC4', backgroundColor: '#E8F0FB' }
                                    : { color: '#B45309', backgroundColor: '#FEF7EC' }
                                }
                              >
                                {account.entityType === 'portfolio'
                                  ? t('reports.equity.typeBadgePortfolio')
                                  : t('reports.equity.typeBadgeProperty')}
                              </span>
                            </div>
                          </td>
                          <td className="ps-2 pe-4 py-2 text-end font-mono tabular-nums text-[#475569]">
                            {formatUSD(account.openingBalanceUSD)}
                          </td>
                          <td
                            className="ps-2 pe-4 py-2 text-end font-mono tabular-nums"
                            style={{ color: signColor(account.netMovementsUSD) }}
                          >
                            {account.netMovementsUSD !== 0
                              ? (account.netMovementsUSD > 0 ? '+' : '') +
                                formatUSD(account.netMovementsUSD)
                              : formatUSD(0)}
                          </td>
                          <td
                            className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                            style={{ color: signColor(account.closingBalanceUSD) }}
                          >
                            {formatUSD(account.closingBalanceUSD)}
                          </td>
                        </tr>
                      ))}

                      {/* Partner subtotal row */}
                      <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                        <td colSpan={3} className="ps-4 pe-2 py-2 font-medium text-[#1E293B]">
                          {t('reports.equity.partnerTotal')}
                        </td>
                        <td
                          className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                          style={{ color: signColor(partner.partnerTotalUSD) }}
                        >
                          {formatUSD(partner.partnerTotalUSD)}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand total footer */}
                <tr className="border-t-2 border-[#E2E8F0] bg-[#F1F5F9]">
                  <td colSpan={3} className="ps-4 pe-2 py-3 text-base font-medium text-[#0F172A]">
                    {t('reports.equity.grandTotal')}
                  </td>
                  <td
                    className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                    style={{ color: signColor(grandTotal) }}
                  >
                    {formatUSD(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
