import { useState, useMemo } from 'react';
import { useTranslation }   from 'react-i18next';
import { useQuery }         from '@tanstack/react-query';
import { format }           from 'date-fns';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { supabaseClient }           from '@/lib/supabase';
import { formatCurrency, toUSD }    from '@/lib/currency';
import type { Account, GeneralLedgerRow } from '@/types';

interface AccountLedgerSheetProps {
  account:      Account | null;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

interface LedgerLine extends GeneralLedgerRow {
  runningBalance: number;
}

const getDefaultDates = () => {
  const today = new Date();
  const from  = new Date(today.getFullYear(), 0, 1);
  return {
    from: format(from,  'yyyy-MM-dd'),
    to:   format(today, 'yyyy-MM-dd'),
  };
};

export default function AccountLedgerSheet({
  account, open, onOpenChange,
}: AccountLedgerSheetProps) {
  const { t }    = useTranslation();
  const defaults = getDefaultDates();

  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate,   setToDate]   = useState(defaults.to);
  const [appliedFrom, setAppliedFrom] = useState(defaults.from);
  const [appliedTo,   setAppliedTo]   = useState(defaults.to);

  const { data: rawRows, isLoading } = useQuery({
    queryKey: ['ledger', account?.code, appliedFrom, appliedTo],
    queryFn:  async () => {
      const { data, error } = await supabaseClient
        .from('general_ledger')
        .select('*')
        .eq('account_code',  account!.code)
        .eq('entry_status',  'posted')
        .gte('entry_date',   appliedFrom)
        .lte('entry_date',   appliedTo)
        .order('entry_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as GeneralLedgerRow[];
    },
    enabled:   open && !!account?.code,
    staleTime: 30_000,
  });

  const ledgerLines = useMemo<LedgerLine[]>(() => {
    if (!rawRows || !account) return [];
    let running = 0;
    return rawRows.map(row => {
      const debit  = toUSD(row.debit_amount  ?? 0, row.currency, row.exchange_rate ?? 1);
      const credit = toUSD(row.credit_amount ?? 0, row.currency, row.exchange_rate ?? 1);
      if (account.normal_balance === 'credit') {
        running += credit - debit;
      } else {
        running += debit - credit;
      }
      return { ...row, runningBalance: running };
    });
  }, [rawRows, account]);

  const totalDebit = useMemo(
    () => ledgerLines.reduce(
      (s, r) => s + toUSD(r.debit_amount ?? 0, r.currency, r.exchange_rate ?? 1), 0
    ),
    [ledgerLines],
  );
  const totalCredit = useMemo(
    () => ledgerLines.reduce(
      (s, r) => s + toUSD(r.credit_amount ?? 0, r.currency, r.exchange_rate ?? 1), 0
    ),
    [ledgerLines],
  );
  const closingBalance = ledgerLines.length > 0
    ? ledgerLines[ledgerLines.length - 1].runningBalance
    : 0;

  const handleApply = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  if (!account) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="min-w-[720px] overflow-y-auto">

        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-medium text-[#1E293B]">
            {t('settings.accounts.ledger.title')}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm text-[#475569]">{account.code}</span>
            <span className="text-[#94A3B8]">—</span>
            <span className="text-sm text-[#1E293B]">{account.name}</span>
            <span className="ms-auto text-xs text-[#94A3B8]">
              {t('settings.accounts.ledger.postedOnly')}
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Period filter */}
        <div className="flex items-end gap-3 mb-4 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#475569]">
              {t('settings.accounts.ledger.fromDate')}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="text-sm border border-[#E2E8F0] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E5DC4]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#475569]">
              {t('settings.accounts.ledger.toDate')}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="text-sm border border-[#E2E8F0] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E5DC4]"
            />
          </div>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 rounded-md bg-[#1E5DC4] text-white text-sm font-medium hover:bg-[#164399] transition-colors"
          >
            {t('common.apply')}
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 bg-[#F1F5F9] rounded animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && ledgerLines.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-[#94A3B8]">
            {t('settings.accounts.ledger.noEntries')}
          </div>
        )}

        {/* Ledger table */}
        {!isLoading && ledgerLines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[#475569]">
                  <th className="text-start px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.date')}
                  </th>
                  <th className="text-start px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.ref')}
                  </th>
                  <th className="text-start px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.desc')}
                  </th>
                  <th className="text-end px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.debit')}
                  </th>
                  <th className="text-end px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.credit')}
                  </th>
                  <th className="text-end px-3 py-2 text-xs font-medium">
                    {t('settings.accounts.ledger.columns.balance')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {ledgerLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC]">
                    <td className="px-3 py-2 font-mono tabular-nums text-xs text-[#475569]">
                      {format(new Date(line.entry_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">
                      {line.reference_no ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-[#1E293B] max-w-[200px] truncate">
                      {line.entry_description ?? line.line_description ?? '—'}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-end text-[#C0392B]">
                      {line.debit_amount > 0
                        ? formatCurrency(line.debit_amount, line.currency)
                        : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-end text-[#1A7D4F]">
                      {line.credit_amount > 0
                        ? formatCurrency(line.credit_amount, line.currency)
                        : '—'}
                    </td>
                    <td className={`px-3 py-2 font-mono tabular-nums text-end font-medium ${
                      line.runningBalance >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                    }`}>
                      {formatCurrency(Math.abs(line.runningBalance), 'USD')}
                      {line.runningBalance < 0 && (
                        <span className="text-xs ms-1">(-)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F1F5F9] font-medium border-t-2 border-[#E2E8F0]">
                  <td colSpan={3} className="px-3 py-2 text-xs text-[#475569]">
                    {t('settings.accounts.ledger.closingBalance')}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-end text-xs text-[#C0392B]">
                    {formatCurrency(totalDebit, 'USD')}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-end text-xs text-[#1A7D4F]">
                    {formatCurrency(totalCredit, 'USD')}
                  </td>
                  <td className={`px-3 py-2 font-mono tabular-nums text-end text-sm font-semibold ${
                    closingBalance >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                  }`}>
                    {formatCurrency(Math.abs(closingBalance), 'USD')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}
