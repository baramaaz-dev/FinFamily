import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase';
import { exportToPDF } from '../../utils/exportToPDF';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toUSD(amount: number, currency: string, exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (currency === 'SYP' && exchangeRate) return amount / exchangeRate;
  return 0;
}

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

// ── Interfaces ────────────────────────────────────────────────────────────────

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

interface PLLineItem {
  label: string;
  amountUSD: number;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

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

  const [dateFrom, setDateFrom] = useState(getFirstDayOfMonth());
  const [dateTo, setDateTo]     = useState(getToday());
  const [appliedFrom, setAppliedFrom] = useState(getFirstDayOfMonth());
  const [appliedTo, setAppliedTo]     = useState(getToday());
  const [entityValue, setEntityValue]               = useState('');
  const [appliedEntityValue, setAppliedEntityValue] = useState('');

  const printRef                      = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleApply = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    setAppliedEntityValue(entityValue);
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

  const selectedEntityType = useMemo((): 'all' | 'portfolio' | 'property' => {
    if (appliedEntityValue.startsWith('portfolio:')) return 'portfolio';
    if (appliedEntityValue.startsWith('property:'))  return 'property';
    return 'all';
  }, [appliedEntityValue]);

  const selectedEntityId = useMemo((): string | null => {
    const parts = appliedEntityValue.split(':');
    return parts.length === 2 ? parts[1] : null;
  }, [appliedEntityValue]);

  const txQuery = useQuery({
    queryKey: ['pl-report-transactions', appliedFrom, appliedTo, appliedEntityValue],
    queryFn: () => fetchPLTransactions(
      appliedFrom,
      appliedTo,
      selectedEntityType === 'portfolio' ? (selectedEntityId ?? undefined) : undefined,
    ),
    staleTime: 30_000,
  });

  const lpQuery = useQuery({
    queryKey: ['pl-report-lease-payments', appliedFrom, appliedTo],
    queryFn: () => fetchPLLeasePayments(appliedFrom, appliedTo),
    staleTime: 30_000,
  });

  const peQuery = useQuery({
    queryKey: ['pl-report-property-expenses', appliedFrom, appliedTo, appliedEntityValue],
    queryFn: () => fetchPLPropertyExpenses(
      appliedFrom,
      appliedTo,
      selectedEntityType === 'property' ? (selectedEntityId ?? undefined) : undefined,
    ),
    staleTime: 30_000,
  });

  const portfoliosQuery = useQuery({
    queryKey: ['pl-report-portfolios'],
    queryFn: fetchPLPortfolios,
    staleTime: 300_000,
  });

  const leasesQuery = useQuery({
    queryKey: ['pl-report-leases-properties'],
    queryFn: fetchPLLeasesWithProperties,
    staleTime: 300_000,
  });

  const propertiesQuery = useQuery({
    queryKey: ['pl-report-properties'],
    queryFn: fetchPLProperties,
    staleTime: 300_000,
  });

  const isLoading = txQuery.isLoading || lpQuery.isLoading || peQuery.isLoading
    || portfoliosQuery.isLoading || leasesQuery.isLoading || propertiesQuery.isLoading;

  const isError = txQuery.isError || lpQuery.isError || peQuery.isError
    || portfoliosQuery.isError || leasesQuery.isError || propertiesQuery.isError;

  const handleRetry = () => {
    txQuery.refetch();
    lpQuery.refetch();
    peQuery.refetch();
  };

  const {
    portfolioIncomeLines,
    rentalIncomeLines,
    portfolioExpenseLines,
    propertyExpenseLines,
    totalIncomeUSD,
    totalExpensesUSD,
    netPL,
    showPortfolioSections,
    showPropertySections,
  } = useMemo(() => {
    if (!txQuery.data || !lpQuery.data || !peQuery.data
        || !portfoliosQuery.data || !leasesQuery.data || !propertiesQuery.data) {
      return {
        portfolioIncomeLines:  [] as PLLineItem[],
        rentalIncomeLines:     [] as PLLineItem[],
        portfolioExpenseLines: [] as PLLineItem[],
        propertyExpenseLines:  [] as PLLineItem[],
        totalIncomeUSD:   0,
        totalExpensesUSD: 0,
        netPL:            0,
        showPortfolioSections: true,
        showPropertySections:  true,
      };
    }

    const showPortfolioSections = selectedEntityType !== 'property';
    const showPropertySections  = selectedEntityType !== 'portfolio';

    const leaseMap = new Map(leasesQuery.data.map((l) => [l.id, l.propertyName]));

    const incomeByCategory  = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    for (const tx of txQuery.data) {
      const usd = toUSD(tx.amount, tx.currency, tx.exchange_rate);
      if (tx.type === 'income') {
        const key = tx.category ?? '__uncategorized__';
        incomeByCategory.set(key, (incomeByCategory.get(key) ?? 0) + usd);
      } else if (tx.type === 'expense') {
        const key = tx.category ?? '__uncategorized__';
        expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + usd);
      }
    }

    const portfolioIncomeLines: PLLineItem[] = Array.from(incomeByCategory.entries()).map(
      ([cat, amt]) => ({
        label: cat === '__uncategorized__' ? t('reports.pl.uncategorizedIncome') : cat,
        amountUSD: amt,
      })
    );

    const portfolioExpenseLines: PLLineItem[] = Array.from(expenseByCategory.entries()).map(
      ([cat, amt]) => ({
        label: cat === '__uncategorized__' ? t('reports.pl.uncategorizedExpense') : cat,
        amountUSD: amt,
      })
    );

    // Filter lease payments to only the selected property when entity = property
    const visibleLeaseIds: Set<string> = new Set(
      selectedEntityType === 'property' && selectedEntityId
        ? leasesQuery.data
            .filter((l) => l.property_id === selectedEntityId)
            .map((l) => l.id)
        : leasesQuery.data.map((l) => l.id)
    );
    const visibleLeasePayments = lpQuery.data.filter((lp) => visibleLeaseIds.has(lp.lease_id));

    const rentalByLease = new Map<string, number>();
    for (const lp of visibleLeasePayments) {
      const usd = toUSD(lp.amount, lp.currency, lp.exchange_rate);
      rentalByLease.set(lp.lease_id, (rentalByLease.get(lp.lease_id) ?? 0) + usd);
    }
    const rentalIncomeLines: PLLineItem[] = Array.from(rentalByLease.entries()).map(
      ([leaseId, amt]) => ({
        label: leaseMap.get(leaseId) ?? '—',
        amountUSD: amt,
      })
    );

    const peByType = new Map<string, number>();
    for (const pe of peQuery.data) {
      const usd = toUSD(pe.amount, pe.currency, pe.exchange_rate);
      peByType.set(pe.type, (peByType.get(pe.type) ?? 0) + usd);
    }
    const propertyExpenseLines: PLLineItem[] = Array.from(peByType.entries()).map(
      ([type, amt]) => ({
        label: type,
        amountUSD: amt,
      })
    );

    const totalIncomeUSD =
      (showPortfolioSections ? portfolioIncomeLines.reduce((s, l) => s + l.amountUSD, 0) : 0) +
      (showPropertySections  ? rentalIncomeLines.reduce((s, l) => s + l.amountUSD, 0) : 0);
    const totalExpensesUSD =
      (showPortfolioSections ? portfolioExpenseLines.reduce((s, l) => s + l.amountUSD, 0) : 0) +
      (showPropertySections  ? propertyExpenseLines.reduce((s, l) => s + l.amountUSD, 0) : 0);
    const netPL = totalIncomeUSD - totalExpensesUSD;

    return {
      portfolioIncomeLines,
      rentalIncomeLines,
      portfolioExpenseLines,
      propertyExpenseLines,
      totalIncomeUSD,
      totalExpensesUSD,
      netPL,
      showPortfolioSections,
      showPropertySections,
    };
  }, [txQuery.data, lpQuery.data, peQuery.data,
      portfoliosQuery.data, leasesQuery.data, propertiesQuery.data,
      selectedEntityType, selectedEntityId, t]);

  const hasData =
    (showPortfolioSections && (portfolioIncomeLines.length > 0 || portfolioExpenseLines.length > 0)) ||
    (showPropertySections  && (rentalIncomeLines.length > 0    || propertyExpenseLines.length > 0));

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reports.pl.periodFrom')}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#1E293B]
                       focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reports.pl.periodTo')}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#1E293B]
                       focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#475569]">{t('reports.filters.entityLabel')}</label>
          <select
            value={entityValue}
            onChange={(e) => setEntityValue(e.target.value)}
            className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm
                       text-[#1E293B] bg-white focus:outline-none
                       focus:ring-2 focus:ring-[#1E5DC4] min-w-48"
          >
            <option value="">{t('reports.filters.allEntities')}</option>
            {(portfoliosQuery.data ?? []).map((p) => (
              <option key={p.id} value={`portfolio:${p.id}`}>
                {t('reports.filters.portfolioPrefix')} {p.name}
              </option>
            ))}
            {(propertiesQuery.data ?? []).map((p) => (
              <option key={p.id} value={`property:${p.id}`}>
                {t('reports.filters.propertyPrefix')} {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleApply}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#1E5DC4]
                     hover:bg-[#164399] transition-colors"
        >
          {t('reports.pl.apply')}
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting || isLoading || !hasData}
          className={[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors ms-auto',
            isExporting || isLoading || !hasData
              ? 'text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed opacity-60'
              : 'text-white bg-[#1E5DC4] hover:bg-[#164399] cursor-pointer',
          ].join(' ')}
        >
          {isExporting ? t('reports.pl.exporting') : t('reports.pl.exportPdf')}
        </button>
      </div>

      {isLoading && <PLReportSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#C0392B]">
          <p className="text-sm">{t('reports.pl.error')}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#C0392B]
                       hover:bg-[#922B21] transition-colors"
          >
            {t('reports.pl.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && !hasData && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[#94A3B8]">{t('reports.pl.empty')}</p>
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
                  {t('reports.pl.title')}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  {appliedFrom} — {appliedTo}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  تاريخ التصدير: {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#A3D4BC] bg-[#EBF5F0] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.pl.totalIncome')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#1A7D4F]">
                {formatUSD(totalIncomeUSD)}
              </p>
            </div>
            <div className="rounded-lg border border-[#F5B9B5] bg-[#FEF0EF] p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.pl.totalExpenses')}</p>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#C0392B]">
                {formatUSD(totalExpensesUSD)}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <p className="text-xs text-[#475569] mb-1">{t('reports.pl.netPl')}</p>
              <p
                className="font-mono tabular-nums text-2xl font-medium"
                style={{ color: signColor(netPL) }}
              >
                {formatUSD(netPL)}
              </p>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {/* ── Income section ── */}
                <tr className="bg-[#F1F5F9]">
                  <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                    {t('reports.pl.sectionIncome')}
                  </td>
                </tr>

                {showPortfolioSections && portfolioIncomeLines.length > 0 && (
                  <>
                    <tr className="bg-[#F8FAFC]">
                      <td colSpan={2} className="ps-6 pe-4 py-1 text-xs text-[#94A3B8] font-medium">
                        {t('reports.pl.portfolioIncome')}
                      </td>
                    </tr>
                    {portfolioIncomeLines.map((line, i) => (
                      <tr key={`pi-${i}`} className="border-t border-[#F1F5F9]">
                        <td className="ps-8 pe-4 py-2 text-[#1E293B]">{line.label}</td>
                        <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#1A7D4F]">
                          {formatUSD(line.amountUSD)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {showPropertySections && rentalIncomeLines.length > 0 && (
                  <>
                    <tr className="bg-[#F8FAFC]">
                      <td colSpan={2} className="ps-6 pe-4 py-1 text-xs text-[#94A3B8] font-medium">
                        {t('reports.pl.rentalIncome')}
                      </td>
                    </tr>
                    {rentalIncomeLines.map((line, i) => (
                      <tr key={`ri-${i}`} className="border-t border-[#F1F5F9]">
                        <td className="ps-8 pe-4 py-2 text-[#1E293B]">{line.label}</td>
                        <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#1A7D4F]">
                          {formatUSD(line.amountUSD)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="ps-4 pe-4 py-2 font-medium text-[#1E293B]">
                    {t('reports.pl.totalIncome')}
                  </td>
                  <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#1A7D4F]">
                    {formatUSD(totalIncomeUSD)}
                  </td>
                </tr>

                {/* ── Expenses section ── */}
                <tr className="bg-[#F1F5F9]">
                  <td colSpan={2} className="ps-4 pe-4 py-2 font-medium text-[#475569]">
                    {t('reports.pl.sectionExpenses')}
                  </td>
                </tr>

                {showPortfolioSections && portfolioExpenseLines.length > 0 && (
                  <>
                    <tr className="bg-[#F8FAFC]">
                      <td colSpan={2} className="ps-6 pe-4 py-1 text-xs text-[#94A3B8] font-medium">
                        {t('reports.pl.portfolioExpenses')}
                      </td>
                    </tr>
                    {portfolioExpenseLines.map((line, i) => (
                      <tr key={`pe-${i}`} className="border-t border-[#F1F5F9]">
                        <td className="ps-8 pe-4 py-2 text-[#1E293B]">{line.label}</td>
                        <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#C0392B]">
                          {formatUSD(line.amountUSD)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {showPropertySections && propertyExpenseLines.length > 0 && (
                  <>
                    <tr className="bg-[#F8FAFC]">
                      <td colSpan={2} className="ps-6 pe-4 py-1 text-xs text-[#94A3B8] font-medium">
                        {t('reports.pl.propertyExpenses')}
                      </td>
                    </tr>
                    {propertyExpenseLines.map((line, i) => (
                      <tr key={`ppe-${i}`} className="border-t border-[#F1F5F9]">
                        <td className="ps-8 pe-4 py-2 text-[#1E293B]">{line.label}</td>
                        <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums text-[#C0392B]">
                          {formatUSD(line.amountUSD)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="ps-4 pe-4 py-2 font-medium text-[#1E293B]">
                    {t('reports.pl.totalExpenses')}
                  </td>
                  <td className="ps-4 pe-4 py-2 text-end font-mono tabular-nums font-medium text-[#C0392B]">
                    {formatUSD(totalExpensesUSD)}
                  </td>
                </tr>

                {/* ── Net P&L row ── */}
                <tr className="border-t-2 border-[#E2E8F0]">
                  <td className="ps-4 pe-4 py-3 text-base font-medium text-[#0F172A]">
                    {t('reports.pl.netPl')}
                  </td>
                  <td
                    className="ps-4 pe-4 py-3 text-end font-mono tabular-nums text-lg font-medium"
                    style={{ color: signColor(netPL) }}
                  >
                    {formatUSD(netPL)}
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
