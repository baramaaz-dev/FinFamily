import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { buildCapitalBreakdown } from '../../utils/capital';
import { supabaseClient } from '@/lib/supabase';
import { exportToPDF } from '../../utils/exportToPDF';
import { usePartnersEquityGL } from '@/hooks/useReportsGL';

// ── Legacy source-table helpers (preserved — do not delete) ───────────────────

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

// Keep legacy helpers in scope — do not delete
void buildCapitalBreakdown;
void fetchEquityCapitalAccounts;
void fetchEquityCapitalTransactions;
void fetchEquityPeople;
void fetchEquityPortfolios;
void fetchEquityProperties;
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

function EquityReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-lg bg-[#F1F5F9]" />
      <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
        <div className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0]" />
        {[0, 1].map((p) => (
          <div key={p}>
            <div className="flex items-center justify-between px-4 py-3 bg-[#F1F5F9]">
              <div className="h-4 w-28 bg-[#E2E8F0] rounded" />
              <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
            </div>
            {[0, 1].map((r) => (
              <div key={r} className="flex justify-between px-4 py-3 border-b border-[#F1F5F9]">
                <div className="h-4 w-36 bg-[#E2E8F0] rounded" />
                <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EquityReportSection() {
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
      `equity-report-${appliedAsOf}.pdf`,
      () => setIsExporting(true),
      () => setIsExporting(false),
    );
  };

  const glQuery = usePartnersEquityGL(appliedAsOf);
  const summary = glQuery.data;
  const hasData = summary !== undefined && summary.sections.some((s) => s.rows.length > 0);

  return (
    <div className="space-y-4">
      {/* As-of-date filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reportsGL.equity.asOfDate')}</label>
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
          {t('reportsGL.equity.apply')}
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
          {isExporting ? t('reportsGL.equity.exporting') : t('reportsGL.equity.exportPdf')}
        </button>
      </div>

      {glQuery.isLoading && <EquityReportSkeleton />}

      {!glQuery.isLoading && glQuery.isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reportsGL.equity.error')}</p>
          <button
            onClick={() => glQuery.refetch()}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('reportsGL.equity.retry')}
          </button>
        </div>
      )}

      {!glQuery.isLoading && !glQuery.isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reportsGL.equity.empty')}</p>
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
                <p className="text-base font-medium text-[#1E293B]">{t('reportsGL.equity.title')}</p>
                <p className="text-xs text-[#94A3B8]">
                  {t('reportsGL.equity.asOfDate')}: {appliedAsOf}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {'تاريخ التصدير:'}{' '}
                  {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Grand total banner */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 flex
                          items-center justify-between">
            <p className="text-sm text-[#475569]">{t('reportsGL.equity.grandTotal')}</p>
            <p
              className="font-mono tabular-nums text-2xl font-medium"
              style={{ color: signColor(summary.grand_total) }}
            >
              {summary.grand_total !== 0 ? formatUSD(summary.grand_total) : '—'}
            </p>
          </div>

          {/* Accounts grouped by 31XX / 32XX sections */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="ps-4 pe-2 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('reportsGL.equity.colCode')}
                    </th>
                    <th className="ps-2 pe-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('reportsGL.equity.colName')}
                    </th>
                    <th className="ps-2 pe-4 py-3 text-end text-xs font-medium text-[#475569]">
                      {t('reportsGL.equity.colBalance')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.sections.map((section) =>
                    section.rows.length === 0 ? null : (
                      <>
                        <tr key={`hdr-${section.prefix}`} className="bg-[#F1F5F9]">
                          <td colSpan={3} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                            {t(`reportsGL.equity.section${section.prefix}`)}
                          </td>
                        </tr>

                        {section.rows.map((row) => (
                          <tr
                            key={row.account_code}
                            className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]"
                          >
                            <td className="ps-8 pe-2 py-2 font-mono text-xs text-[#94A3B8]">
                              {row.account_code}
                            </td>
                            <td className="ps-2 pe-4 py-2 text-[#1E293B]">{row.account_name}</td>
                            <td
                              className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                              style={{ color: signColor(row.balance) }}
                            >
                              {row.balance !== 0 ? formatUSD(row.balance) : '—'}
                            </td>
                          </tr>
                        ))}

                        <tr key={`sub-${section.prefix}`} className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                          <td colSpan={2} className="ps-4 pe-2 py-2 font-medium text-[#1E293B]">
                            {t(`reportsGL.equity.section${section.prefix}`)}
                          </td>
                          <td
                            className="ps-2 pe-4 py-2 text-end font-mono tabular-nums font-medium"
                            style={{ color: signColor(section.total) }}
                          >
                            {section.total !== 0 ? formatUSD(section.total) : '—'}
                          </td>
                        </tr>
                      </>
                    ),
                  )}

                  {/* Grand total footer */}
                  <tr className="border-t-2 border-[#E2E8F0] bg-[#F1F5F9]">
                    <td colSpan={2} className="ps-4 pe-2 py-3 text-base font-medium text-[#0F172A]">
                      {t('reportsGL.equity.grandTotal')}
                    </td>
                    <td
                      className="ps-2 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                      style={{ color: signColor(summary.grand_total) }}
                    >
                      {summary.grand_total !== 0 ? formatUSD(summary.grand_total) : '—'}
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
