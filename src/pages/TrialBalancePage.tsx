import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation }          from 'react-i18next';
import { Scale, Download, RefreshCw } from 'lucide-react';
import { toast }                   from 'sonner';
import jsPDF                       from 'jspdf';
import html2canvas                 from 'html2canvas';
import { Button }                  from '@/components/ui/button';
import { Input }                   from '@/components/ui/input';
import { useTrialBalance }         from '@/hooks/useTrialBalance';
import { getCurrentPeriodRange }   from '@/lib/supabase/trialBalance';
import { formatCurrency }          from '@/lib/currency';
import type { AccountClass }       from '@/types/trialBalance';

const CLASS_ORDER: AccountClass[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

export default function TrialBalancePage() {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);

  const today       = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState(today);
  const [applied,  setApplied]  = useState({ from: '', to: today });

  const { data: summary, isLoading } = useTrialBalance(applied.from, applied.to);

  useEffect(() => {
    getCurrentPeriodRange().then(({ from, to }) => {
      setDateFrom(from);
      setDateTo(to);
      setApplied({ from, to });
    });
  }, []);

  // ── Quick-select ─────────────────────────────────────────────────────────
  function applyCurrentPeriod() {
    getCurrentPeriodRange().then(({ from, to }) => {
      setDateFrom(from);
      setDateTo(to);
      setApplied({ from, to });
    });
  }

  function applyCurrentYear() {
    const from = `${currentYear}-01-01`;
    setDateFrom(from);
    setDateTo(today);
    setApplied({ from, to: today });
  }

  function applyCurrentMonth() {
    const d    = new Date();
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    setDateFrom(from);
    setDateTo(today);
    setApplied({ from, to: today });
  }

  function handleApply() {
    setApplied({ from: dateFrom, to: dateTo });
  }

  // ── PDF export ───────────────────────────────────────────────────────────
  async function handleExport() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas   = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const imgWidth   = pageWidth - 20;
      const imgHeight  = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`trial-balance-${applied.to}.pdf`);
      toast.success(t('trialBalance.exportSuccess'));
    } catch {
      toast.error(t('trialBalance.exportError'));
    } finally {
      setIsExporting(false);
    }
  }

  // ── Grouped rows ─────────────────────────────────────────────────────────
  const groupedRows = useMemo(() => {
    if (!summary) return [];
    return CLASS_ORDER.map(cls => {
      const rows           = summary.rows.filter(r => r.account_class === cls);
      const subtotal_debit  = rows.reduce((s, r) => s + r.total_debit,  0);
      const subtotal_credit = rows.reduce((s, r) => s + r.total_credit, 0);
      return { class: cls, rows, subtotal_debit, subtotal_credit };
    }).filter(g => g.rows.length > 0);
  }, [summary]);

  function classLabel(cls: AccountClass): string {
    const map: Record<AccountClass, string> = {
      asset:     t('trialBalance.class.asset'),
      liability: t('trialBalance.class.liability'),
      equity:    t('trialBalance.class.equity'),
      revenue:   t('trialBalance.class.revenue'),
      expense:   t('trialBalance.class.expense'),
    };
    return map[cls];
  }

  function netBalanceColor(net: number): string {
    if (net >  0.001) return 'text-[#1A7D4F]';
    if (net < -0.001) return 'text-[#C0392B]';
    return 'text-slate-400';
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-800">{t('trialBalance.title')}</h1>
          {summary && (
            <p className="text-sm text-slate-500 mt-0.5">
              {t('trialBalance.periodLabel')}: {summary.period_label}
            </p>
          )}
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || !summary || summary.rows.length === 0}
          className="bg-[#1E5DC4] hover:bg-[#164399] text-white gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          {isExporting ? t('trialBalance.exporting') : t('trialBalance.exportPdf')}
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('trialBalance.filter.from')}</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{t('trialBalance.filter.to')}</label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
          <div className="flex gap-2 self-end">
            <Button variant="outline" size="sm" className="text-xs" onClick={applyCurrentPeriod}>
              {t('trialBalance.filter.currentPeriod')}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={applyCurrentYear}>
              {t('trialBalance.filter.currentYear')}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={applyCurrentMonth}>
              {t('trialBalance.filter.currentMonth')}
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-[#1E5DC4] hover:bg-[#164399] text-white gap-1 self-end"
            onClick={handleApply}
            disabled={!dateFrom || !dateTo}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('trialBalance.filter.apply')}
          </Button>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Content (printable area) ── */}
      {!isLoading && summary && (
        <div ref={printRef} className="space-y-4">

          {/* Balance banner */}
          {summary.is_balanced ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#EBF5F0] text-[#1A7D4F] text-sm font-medium">
              <Scale className="h-4 w-4 shrink-0" />
              {t('trialBalance.balanced')
                .replace('{amount}', formatCurrency(summary.grand_total_debit, 'USD'))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#FEF0EF] text-[#C0392B] text-sm font-medium">
              <Scale className="h-4 w-4 shrink-0" />
              {t('trialBalance.unbalanced')
                .replace('{diff}', formatCurrency(
                  Math.abs(summary.grand_total_debit - summary.grand_total_credit), 'USD'
                ))}
            </div>
          )}

          {/* Table or empty state */}
          {summary.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Scale className="h-10 w-10 text-slate-300" />
              <p className="text-slate-600">{t('trialBalance.empty.title')}</p>
              <p className="text-slate-400 text-sm">{t('trialBalance.empty.hint')}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-slate-500 text-xs">
                    <th className="text-right px-4 py-3 font-medium">{t('trialBalance.col.code')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('trialBalance.col.name')}</th>
                    <th className="text-left  px-4 py-3 font-medium">{t('trialBalance.col.debit')}</th>
                    <th className="text-left  px-4 py-3 font-medium">{t('trialBalance.col.credit')}</th>
                    <th className="text-left  px-4 py-3 font-medium">{t('trialBalance.col.net')}</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedRows.map(group => (
                    <React.Fragment key={group.class}>
                      {/* Group header row */}
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <td colSpan={2} className="px-4 py-2 font-medium text-slate-700 text-xs">
                          {classLabel(group.class as AccountClass)}
                        </td>
                        <td className="px-4 py-2 text-left font-medium text-xs font-mono tabular-nums text-slate-700">
                          {group.subtotal_debit > 0 ? formatCurrency(group.subtotal_debit, 'USD') : '—'}
                        </td>
                        <td className="px-4 py-2 text-left font-medium text-xs font-mono tabular-nums text-slate-700">
                          {group.subtotal_credit > 0 ? formatCurrency(group.subtotal_credit, 'USD') : '—'}
                        </td>
                        <td className="px-4 py-2 text-left font-medium text-xs font-mono tabular-nums">
                          {(() => {
                            const net = group.subtotal_debit - group.subtotal_credit;
                            return (
                              <span className={netBalanceColor(net)}>
                                {formatCurrency(Math.abs(net), 'USD')}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>

                      {/* Account rows */}
                      {group.rows.map(row => (
                        <tr key={row.account_code} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs text-slate-500">{row.account_code}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">{row.account_name}</td>
                          <td className="px-4 py-2.5 text-left">
                            <span className="font-mono tabular-nums text-slate-700">
                              {row.total_debit > 0.001 ? formatCurrency(row.total_debit, 'USD') : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-left">
                            <span className="font-mono tabular-nums text-slate-700">
                              {row.total_credit > 0.001 ? formatCurrency(row.total_credit, 'USD') : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-left">
                            <span className={`font-mono tabular-nums ${netBalanceColor(row.net_balance)}`}>
                              {Math.abs(row.net_balance) > 0.001
                                ? formatCurrency(Math.abs(row.net_balance), 'USD')
                                : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>

                <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-medium text-slate-800 text-sm">
                      {t('trialBalance.totals')}
                    </td>
                    <td className="px-4 py-3 text-left font-medium font-mono tabular-nums text-slate-800">
                      {formatCurrency(summary.grand_total_debit, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-left font-medium font-mono tabular-nums text-slate-800">
                      {formatCurrency(summary.grand_total_credit, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-left font-medium font-mono tabular-nums">
                      {summary.is_balanced ? (
                        <span className="text-[#1A7D4F]">{formatCurrency(0, 'USD')}</span>
                      ) : (
                        <span className="text-[#C0392B]">
                          {formatCurrency(
                            Math.abs(summary.grand_total_debit - summary.grand_total_credit), 'USD'
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
