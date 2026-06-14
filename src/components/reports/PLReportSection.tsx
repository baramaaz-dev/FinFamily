import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '@/lib/supabase';
import { exportToPDF } from '../../utils/exportToPDF';
import { useProfitLossGL } from '@/hooks/useReportsGL';

// ── Legacy source-table helpers (preserved — do not delete) ───────────────────

function toUSD(amount: number, currency: string, exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (currency === 'SYP' && exchangeRate) return amount / exchangeRate;
  return 0;
}

interface RawTransaction {
  id: string;
  portfolio_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  exchange_rate: number | null;
  category: string | null;
  date: string;
}

interface RawLeasePayment {
  id: string;
  lease_id: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  paid_date: string;
}

interface RawPropertyExpense {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  paid_date: string | null;
}

async function fetchPLTransactions(
  dateFrom: string,
  dateTo: string,
  portfolioId?: string,
): Promise<RawTransaction[]> {
  let q = supabaseClient
    .from('transactions')
    .select('id, portfolio_id, type, amount, currency, exchange_rate, category, date')
    .in('type', ['income', 'expense'])
    .gte('date', dateFrom)
    .lte('date', dateTo);
  if (portfolioId) q = q.eq('portfolio_id', portfolioId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function fetchPLLeasePayments(dateFrom: string, dateTo: string): Promise<RawLeasePayment[]> {
  const { data, error } = await supabaseClient
    .from('lease_payments')
    .select('id, lease_id, amount, currency, exchange_rate, paid_date')
    .gte('paid_date', dateFrom)
    .lte('paid_date', dateTo);
  if (error) throw error;
  return data ?? [];
}

async function fetchPLPropertyExpenses(
  dateFrom: string,
  dateTo: string,
  propertyId?: string,
): Promise<RawPropertyExpense[]> {
  let q = supabaseClient
    .from('property_expenses')
    .select('id, property_id, type, amount, currency, exchange_rate, paid_date')
    .not('paid_date', 'is', null)
    .gte('paid_date', dateFrom)
    .lte('paid_date', dateTo);
  if (propertyId) q = q.eq('property_id', propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function fetchPLPortfolios(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('portfolios').select('id, name');
  if (error) throw error;
  return data ?? [];
}

async function fetchPLLeasesWithProperties(): Promise<{ id: string; property_id: string; propertyName: string }[]> {
  const { data, error } = await supabaseClient
    .from('leases')
    .select('id, property_id, properties(name)');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    property_id: row.property_id,
    propertyName: (row.properties as unknown as { name: string } | null)?.name ?? '—',
  }));
}

async function fetchPLProperties(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabaseClient.from('properties').select('id, name');
  if (error) throw error;
  return data ?? [];
}

// Keep legacy helpers in scope so they are not tree-shaken — do not delete
void toUSD;
void fetchPLTransactions;
void fetchPLLeasePayments;
void fetchPLPropertyExpenses;
void fetchPLPortfolios;
void fetchPLLeasesWithProperties;
void fetchPLProperties;

// ── Display helpers ───────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function signColor(value: number): string {
  if (value > 0) return '#1A7D4F';
  if (value < 0) return '#C0392B';
  return '#94A3B8';
}

function getFirstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PLReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-[#F1F5F9]" />
        ))}
      </div>
      <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
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

export default function PLReportSection() {
  const { t } = useTranslation();

  const [dateFrom, setDateFrom]       = useState(getFirstDayOfMonth());
  const [dateTo, setDateTo]           = useState(getToday());
  const [appliedFrom, setAppliedFrom] = useState(getFirstDayOfMonth());
  const [appliedTo, setAppliedTo]     = useState(getToday());

  const printRef                      = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleApply = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const handleExport = async () => {
    if (!printRef.current) return;
    await exportToPDF(
      printRef.current,
      `pl-report-${appliedFrom}-${appliedTo}.pdf`,
      () => setIsExporting(true),
      () => setIsExporting(false),
    );
  };

  const glQuery = useProfitLossGL(appliedFrom, appliedTo);
  const summary = glQuery.data;
  const hasData = summary !== undefined &&
    (summary.total_revenue !== 0 || summary.total_expense !== 0);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reportsGL.pl.periodFrom')}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#1E293B]
                       focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reportsGL.pl.periodTo')}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#1E293B]
                       focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] bg-white"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#1E5DC4]
                     hover:bg-[#164399] transition-colors"
        >
          {t('reportsGL.pl.apply')}
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting || glQuery.isLoading || !hasData}
          className={[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors ms-auto',
            isExporting || glQuery.isLoading || !hasData
              ? 'text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed opacity-60'
              : 'text-white bg-[#1E5DC4] hover:bg-[#164399] cursor-pointer',
          ].join(' ')}
        >
          {isExporting ? t('reportsGL.pl.exporting') : t('reportsGL.pl.exportPdf')}
        </button>
      </div>

      {glQuery.isLoading && <PLReportSkeleton />}

      {!glQuery.isLoading && glQuery.isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reportsGL.pl.error')}</p>
          <button
            onClick={() => glQuery.refetch()}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reportsGL.pl.retry')}
          </button>
        </div>
      )}

      {!glQuery.isLoading && !glQuery.isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reportsGL.pl.empty')}</p>
        </div>
      )}

      {!glQuery.isLoading && !glQuery.isError && hasData && summary && (
        <div ref={printRef} className="space-y-4">
          {/* Print header — hidden in browser, revealed by exportToPDF during capture */}
          <div className="pdf-show hidden border-b-2 border-[#E2E8F0] pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-medium text-[#0F172A]">FinFamily</p>
                <p className="text-sm text-[#475569]">{'إدارة الأصول العائلية'}</p>
              </div>
              <div className="text-end">
                <p className="text-base font-medium text-[#1E293B]">{t('reportsGL.pl.title')}</p>
                <p className="text-xs text-[#94A3B8]">{appliedFrom} — {appliedTo}</p>
                <p className="text-xs text-[#94A3B8]">
                  {'تاريخ التصدير:'}{' '}
                  {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#A3D4BC] bg-[#EBF5F0] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.pl.totalRevenue')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#1A7D4F]">
                {summary.total_revenue !== 0 ? formatUSD(summary.total_revenue) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[#F5B9B5] bg-[#FEF0EF] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.pl.totalExpense')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#C0392B]">
                {summary.total_expense !== 0 ? formatUSD(summary.total_expense) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.pl.netPl')}</p>
              <p
                className="font-mono tabular-nums text-2xl font-medium"
                style={{ color: signColor(summary.net_pl) }}
              >
                {summary.net_pl !== 0 ? formatUSD(summary.net_pl) : '—'}
              </p>
            </div>
          </div>

          {/* IFRS 18 category breakdown */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {summary.categories.map((cat) =>
                    cat.revenues.length === 0 && cat.expenses.length === 0 ? null : (
                      <React.Fragment key={cat.category}>
                        {/* Category header */}
                        <tr className="bg-[#F1F5F9]">
                          <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                            {t(`reportsGL.pl.category.${cat.category}`)}
                          </td>
                        </tr>

                        {/* Revenue rows */}
                        {cat.revenues.length > 0 && (
                          <>
                            <tr className="bg-[#F8FAFC]">
                              <td colSpan={2} className="ps-6 pe-4 py-1 text-xs font-medium text-[#94A3B8]">
                                {t('reportsGL.pl.sectionRevenue')}
                              </td>
                            </tr>
                            {cat.revenues.map((row) => (
                              <tr key={row.account_code} className="border-t border-[#F1F5F9]">
                                <td className="ps-8 pe-4 py-2 text-[#1E293B]">
                                  <span className="font-mono text-xs text-[#94A3B8] me-2">{row.account_code}</span>
                                  {row.account_name}
                                </td>
                                <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#1A7D4F]">
                                  {row.net_balance !== 0 ? formatUSD(row.net_balance) : '—'}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                              <td className="ps-6 pe-4 py-2 text-[#475569] font-medium">
                                {t('reportsGL.pl.totalRevenue')}
                              </td>
                              <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#1A7D4F]">
                                {cat.revenue_total !== 0 ? formatUSD(cat.revenue_total) : '—'}
                              </td>
                            </tr>
                          </>
                        )}

                        {/* Expense rows */}
                        {cat.expenses.length > 0 && (
                          <>
                            <tr className="bg-[#F8FAFC]">
                              <td colSpan={2} className="ps-6 pe-4 py-1 text-xs font-medium text-[#94A3B8]">
                                {t('reportsGL.pl.sectionExpense')}
                              </td>
                            </tr>
                            {cat.expenses.map((row) => (
                              <tr key={row.account_code} className="border-t border-[#F1F5F9]">
                                <td className="ps-8 pe-4 py-2 text-[#1E293B]">
                                  <span className="font-mono text-xs text-[#94A3B8] me-2">{row.account_code}</span>
                                  {row.account_name}
                                </td>
                                <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#C0392B]">
                                  {row.net_balance !== 0 ? formatUSD(row.net_balance) : '—'}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                              <td className="ps-6 pe-4 py-2 text-[#475569] font-medium">
                                {t('reportsGL.pl.totalExpense')}
                              </td>
                              <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#C0392B]">
                                {cat.expense_total !== 0 ? formatUSD(cat.expense_total) : '—'}
                              </td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
                    ),
                  )}

                  {/* Grand total rows */}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                    <td className="ps-4 pe-4 py-2 font-medium text-[#1E293B]">
                      {t('reportsGL.pl.totalRevenue')}
                    </td>
                    <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#1A7D4F]">
                      {summary.total_revenue !== 0 ? formatUSD(summary.total_revenue) : '—'}
                    </td>
                  </tr>
                  <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <td className="ps-4 pe-4 py-2 font-medium text-[#1E293B]">
                      {t('reportsGL.pl.totalExpense')}
                    </td>
                    <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#C0392B]">
                      {summary.total_expense !== 0 ? formatUSD(summary.total_expense) : '—'}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-[#E2E8F0]">
                    <td className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                      {t('reportsGL.pl.netPl')}
                    </td>
                    <td
                      className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                      style={{ color: signColor(summary.net_pl) }}
                    >
                      {summary.net_pl !== 0 ? formatUSD(summary.net_pl) : '—'}
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
