import { useTranslation }            from 'react-i18next';
import { TrendingUp, TrendingDown }  from 'lucide-react';

interface PLIndicatorCardProps {
  incomeUSD  : number;
  expenseUSD : number;
  netPL      : number;
  periodLabel: string;
  isLoading  : boolean;
  isError    : boolean;
  onRetry    : () => void;
}

function signColor(value: number): string {
  if (value > 0) return 'text-[#1A7D4F]';
  if (value < 0) return 'text-[#C0392B]';
  return 'text-[#94A3B8]';
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style                : 'currency',
    currency             : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function PLIndicatorSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 h-5 bg-[#F1F5F9] animate-pulse rounded" />
        <div className="w-20 h-4 bg-[#F1F5F9] animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
          <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
        </div>
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
          <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
        </div>
        <div className="w-full h-2 bg-[#F1F5F9] animate-pulse rounded-full mt-2" />
        <div className="flex justify-between pt-2">
          <div className="w-32 h-4 bg-[#F1F5F9] animate-pulse rounded" />
          <div className="w-28 h-7 bg-[#F1F5F9] animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export default function PLIndicatorCard({
  incomeUSD,
  expenseUSD,
  netPL,
  periodLabel,
  isLoading,
  isError,
  onRetry,
}: PLIndicatorCardProps) {
  const { t } = useTranslation();

  if (isLoading) return <PLIndicatorSkeleton />;

  if (isError) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <p className="text-sm text-[#C0392B]">
          {t('dashboard.pl.error')}{' '}
          <button onClick={onRetry} className="underline text-[#1E5DC4] cursor-pointer">
            {t('dashboard.pl.retry')}
          </button>
        </p>
      </div>
    );
  }

  const total         = incomeUSD + expenseUSD;
  const incomeBarPct  = total > 0 ? (incomeUSD  / total) * 100 : 0;
  const expenseBarPct = total > 0 ? (expenseUSD / total) * 100 : 0;
  const isEmpty       = total === 0;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#1E293B]">
          {t('dashboard.pl.title')}
        </h2>
        <span className="text-sm text-[#475569]">{periodLabel}</span>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <p className="text-sm text-[#94A3B8] text-center py-6">
          {t('dashboard.pl.empty')}
        </p>
      )}

      {/* P&L rows */}
      {!isEmpty && (
        <>
          {/* Income row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1A7D4F]" />
              <span className="text-sm text-[#475569]">
                {t('dashboard.pl.income')}
              </span>
            </div>
            <span className="font-mono text-sm text-[#1A7D4F]">
              {formatUSD(incomeUSD)}
            </span>
          </div>

          {/* Expense row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-[#C0392B]" />
              <span className="text-sm text-[#475569]">
                {t('dashboard.pl.expense')}
              </span>
            </div>
            <span className="font-mono text-sm text-[#C0392B]">
              {formatUSD(expenseUSD)}
            </span>
          </div>

          {/* Comparison bar */}
          <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden my-3 flex">
            <div
              className="h-full bg-[#1A7D4F] transition-all duration-300"
              style={{ width: `${incomeBarPct}%` }}
            />
            <div
              className="h-full bg-[#C0392B] transition-all duration-300"
              style={{ width: `${expenseBarPct}%` }}
            />
          </div>

          {/* Net P&L footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] mt-1">
            <span className="text-sm font-medium text-[#475569]">
              {t('dashboard.pl.netPL')}
            </span>
            <div className="flex items-center gap-1.5">
              {netPL > 0 && <TrendingUp className="w-4 h-4 text-[#1A7D4F]" />}
              {netPL < 0 && <TrendingDown className="w-4 h-4 text-[#C0392B]" />}
              <span className={`font-mono text-2xl font-medium ${signColor(netPL)}`}>
                {formatUSD(netPL)}
              </span>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
