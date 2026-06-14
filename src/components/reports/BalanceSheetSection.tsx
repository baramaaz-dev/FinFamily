import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { buildCapitalBreakdown } from '../../utils/capital';
import { supabaseClient } from '@/lib/supabase';
import { exportToPDF } from '../../utils/exportToPDF';
import { useBalanceSheetGL } from '@/hooks/useReportsGL';

// ── Legacy source-table helpers (preserved — do not delete) ───────────────────

function toUSD(amount: number, currency: 'USD' | 'SYP', exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (exchangeRate) return amount / exchangeRate;
  return 0;
}

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

// Keep legacy helpers in scope — do not delete
void toUSD;
void buildCapitalBreakdown;
void fetchBalanceTransactions;
void fetchBalancePortfolios;
void fetchBalanceProperties;
void fetchUnpaidExpenses;
void fetchBalanceCapitalAccounts;
void fetchBalanceCapitalTransactions;
void fetchBalancePeople;
void useQuery;

// ── Display helpers ───────────────────────────────────────────────────────────

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

function getToday(): string {
  return new Date().toISOString().split('T')[0];
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

  const printRef                      = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!printRef.current) return;
    await exportToPDF(
      printRef.current,
      `balance-sheet-${appliedAsOf}.pdf`,
      () => setIsExporting(true),
      () => setIsExporting(false),
    );
  };

  const glQuery = useBalanceSheetGL(appliedAsOf);
  const summary = glQuery.data;
  const hasData = summary !== undefined &&
    (summary.assets.length > 0 || summary.liabilities.length > 0 || summary.equity.length > 0);

  return (
    <div className="space-y-4">
      {/* As-of-date filter — always visible */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">
            {t('reportsGL.bs.asOfDate')}
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
          {t('reportsGL.bs.apply')}
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
          {isExporting ? t('reportsGL.bs.exporting') : t('reportsGL.bs.exportPdf')}
        </button>
      </div>

      {glQuery.isLoading && <BalanceSheetSkeleton />}

      {!glQuery.isLoading && glQuery.isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reportsGL.bs.error')}</p>
          <button
            onClick={() => glQuery.refetch()}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reportsGL.bs.retry')}
          </button>
        </div>
      )}

      {!glQuery.isLoading && !glQuery.isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reportsGL.bs.empty')}</p>
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
                <p className="text-base font-medium text-[#1E293B]">{t('reportsGL.bs.title')}</p>
                <p className="text-xs text-[#94A3B8]">
                  {t('reportsGL.bs.asOfDate')}: {appliedAsOf}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {'تاريخ التصدير:'}{' '}
                  {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Balance banner */}
          {summary.is_balanced ? (
            <div
              className="rounded-lg border px-4 py-3 text-sm font-medium"
              style={{ borderColor: '#A3D4BC', backgroundColor: '#EBF5F0', color: '#1A7D4F' }}
            >
              {t('reportsGL.bs.balanced').replace('{amount}', formatUSD(summary.total_assets))}
            </div>
          ) : (
            <div
              className="rounded-lg border px-4 py-3 text-sm font-medium"
              style={{ borderColor: '#F5B9B5', backgroundColor: '#FEF0EF', color: '#C0392B' }}
            >
              {t('reportsGL.bs.unbalanced').replace(
                '{diff}',
                formatUSD(Math.abs(summary.total_assets - (summary.total_liabilities + summary.total_equity))),
              )}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#A3D4BC] bg-[#EBF5F0] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.bs.totalAssets')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#1A7D4F]">
                {summary.total_assets !== 0 ? formatUSD(summary.total_assets) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[#F5B9B5] bg-[#FEF0EF] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.bs.totalLiab')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#C0392B]">
                {summary.total_liabilities !== 0 ? formatUSD(summary.total_liabilities) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reportsGL.bs.totalEquity')}</p>
              <p
                className="font-mono tabular-nums text-2xl font-medium"
                style={{ color: signColor(summary.total_equity) }}
              >
                {summary.total_equity !== 0 ? formatUSD(summary.total_equity) : '—'}
              </p>
            </div>
          </div>

          {/* Balance sheet table */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="ps-4 pe-2 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('reportsGL.bs.colCode')}
                    </th>
                    <th className="ps-2 pe-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('reportsGL.bs.colName')}
                    </th>
                    <th className="ps-2 pe-4 py-3 text-end text-xs font-medium text-[#475569]">
                      {t('reportsGL.bs.colBalance')}
                    </th>
                  </tr>
                </thead>
                <tbody>

                  {/* ══ ASSETS ══ */}
                  <tr className="bg-[#F1F5F9]">
                    <td colSpan={3} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                      {t('reportsGL.bs.sectionAssets')}
                    </td>
                  </tr>
                  {summary.assets.length === 0 ? (
                    <tr className="border-t border-[#F1F5F9]">
                      <td colSpan={3} className="ps-8 pe-4 py-3 text-[#94A3B8]">{t('reportsGL.bs.noItems')}</td>
                    </tr>
                  ) : (
                    summary.assets.map((row) => (
                      <tr key={row.account_code} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="ps-8 pe-2 py-2 font-mono text-xs text-[#94A3B8]">{row.account_code}</td>
                        <td className="ps-2 pe-4 py-2 text-[#1E293B]">{row.account_name}</td>
                        <td className="ps-2 pe-4 py-2 text-end font-mono tabular-nums text-[#1A7D4F]">
                          {row.balance !== 0 ? formatUSD(row.balance) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#EBF5F0]">
                    <td colSpan={2} className="ps-4 pe-4 py-3 text-base font-medium text-[#126038]">
                      {t('reportsGL.bs.totalAssets')}
                    </td>
                    <td className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium text-[#1A7D4F]">
                      {summary.total_assets !== 0 ? formatUSD(summary.total_assets) : '—'}
                    </td>
                  </tr>

                  {/* ══ LIABILITIES ══ */}
                  <tr className="bg-[#F1F5F9]">
                    <td colSpan={3} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                      {t('reportsGL.bs.sectionLiab')}
                    </td>
                  </tr>
                  {summary.liabilities.length === 0 ? (
                    <tr className="border-t border-[#F1F5F9]">
                      <td colSpan={3} className="ps-8 pe-4 py-3 text-[#94A3B8]">{t('reportsGL.bs.noItems')}</td>
                    </tr>
                  ) : (
                    summary.liabilities.map((row) => (
                      <tr key={row.account_code} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="ps-8 pe-2 py-2 font-mono text-xs text-[#94A3B8]">{row.account_code}</td>
                        <td className="ps-2 pe-4 py-2 text-[#1E293B]">{row.account_name}</td>
                        <td className="ps-2 pe-4 py-2 text-end font-mono tabular-nums text-[#C0392B]">
                          {row.balance !== 0 ? formatUSD(row.balance) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#FEF0EF]">
                    <td colSpan={2} className="ps-4 pe-4 py-3 text-base font-medium text-[#922B21]">
                      {t('reportsGL.bs.totalLiab')}
                    </td>
                    <td className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium text-[#C0392B]">
                      {summary.total_liabilities !== 0 ? formatUSD(summary.total_liabilities) : '—'}
                    </td>
                  </tr>

                  {/* ══ EQUITY ══ */}
                  <tr className="bg-[#F1F5F9]">
                    <td colSpan={3} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                      {t('reportsGL.bs.sectionEquity')}
                    </td>
                  </tr>
                  {summary.equity.length === 0 ? (
                    <tr className="border-t border-[#F1F5F9]">
                      <td colSpan={3} className="ps-8 pe-4 py-3 text-[#94A3B8]">{t('reportsGL.bs.noItems')}</td>
                    </tr>
                  ) : (
                    summary.equity.map((row) => (
                      <tr key={row.account_code} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="ps-8 pe-2 py-2 font-mono text-xs text-[#94A3B8]">{row.account_code}</td>
                        <td className="ps-2 pe-4 py-2 text-[#1E293B]">{row.account_name}</td>
                        <td
                          className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                          style={{ color: signColor(row.balance) }}
                        >
                          {row.balance !== 0 ? formatUSD(row.balance) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                    <td colSpan={2} className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                      {t('reportsGL.bs.totalEquity')}
                    </td>
                    <td
                      className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                      style={{ color: signColor(summary.total_equity) }}
                    >
                      {summary.total_equity !== 0 ? formatUSD(summary.total_equity) : '—'}
                    </td>
                  </tr>

                  {/* ══ LIABILITIES + EQUITY ══ */}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#F1F5F9]">
                    <td colSpan={2} className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                      {t('reportsGL.bs.totalLiabEquity')}
                    </td>
                    <td
                      className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                      style={{ color: signColor(summary.total_liabilities + summary.total_equity) }}
                    >
                      {(summary.total_liabilities + summary.total_equity) !== 0
                        ? formatUSD(summary.total_liabilities + summary.total_equity)
                        : '—'}
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
