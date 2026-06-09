import { useTranslation } from 'react-i18next';
import { Link }           from 'react-router-dom';
import { ROUTES }         from '@/router/routes';

export interface PartnerShareRow {
  personId       : string;
  name           : string;
  totalCapitalUSD: number;
  sharePercent   : number;
  accentIndex    : number;
}

interface PartnerSharesSectionProps {
  rows      : PartnerShareRow[];
  grandTotal: number;
  isLoading : boolean;
  isError   : boolean;
  onRetry   : () => void;
}

function getAccentColors(index: number): { bg: string; text: string; bar: string } {
  if (index === 0) return { bg: '#E8F0FB', text: '#1E5DC4', bar: '#1E5DC4' };
  if (index === 1) return { bg: '#EBF5F0', text: '#1A7D4F', bar: '#1A7D4F' };
  return           { bg: '#FEF7EC', text: '#B45309', bar: '#B45309' };
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
}

function signColor(value: number): string {
  return value >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]';
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style                : 'currency',
    currency             : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function PartnerSharesSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="w-28 h-5 bg-[#F1F5F9] animate-pulse rounded" />
        <div className="w-16 h-4 bg-[#F1F5F9] animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F1F5F9] animate-pulse rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
                <div className="w-20 h-4 bg-[#F1F5F9] animate-pulse rounded" />
              </div>
              <div className="w-full h-1.5 bg-[#F1F5F9] animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PartnerSharesSection({
  rows,
  grandTotal,
  isLoading,
  isError,
  onRetry,
}: PartnerSharesSectionProps) {
  const { t } = useTranslation();

  if (isLoading) return <PartnerSharesSkeleton />;

  if (isError) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <p className="text-sm text-[#C0392B]">
          {t('dashboard.partnerShares.error')}{' '}
          <button onClick={onRetry} className="underline text-[#1E5DC4] cursor-pointer">
            {t('dashboard.partnerShares.retry')}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#1E293B]">
          {t('dashboard.partnerShares.title')}
        </h2>
        <Link to={ROUTES.PARTNERS} className="text-sm text-[#1E5DC4] hover:text-[#164399]">
          {t('dashboard.partnerShares.viewAll')}
        </Link>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <p className="text-sm text-[#94A3B8] text-center py-6">
          {t('dashboard.partnerShares.empty')}
        </p>
      )}

      {/* Partner rows */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((row) => {
            const accent = getAccentColors(row.accentIndex);
            const pct    = Math.min(100, Math.max(0, row.sharePercent));
            return (
              <div key={row.personId} className="flex items-center gap-3">

                {/* Avatar circle */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                  style={{ backgroundColor: accent.bg, color: accent.text }}
                >
                  {getInitials(row.name)}
                </div>

                {/* Name + balance + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-[#1E293B] truncate">
                      {row.name}
                    </p>
                    <div className="text-end shrink-0">
                      <p className={`font-mono text-sm ${signColor(row.totalCapitalUSD)}`}>
                        {formatUSD(row.totalCapitalUSD)}
                      </p>
                      <p className="font-mono text-xs text-[#475569]">
                        {t('dashboard.partnerShares.shareLabel')
                          .replace('{percent}', pct.toFixed(1))}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: accent.bar }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Grand total footer */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0] bg-[#F8FAFC] -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
          <p className="text-sm font-medium text-[#475569]">
            {t('dashboard.partnerShares.totalLabel')}
          </p>
          <p className={`font-mono text-sm font-medium ${signColor(grandTotal)}`}>
            {formatUSD(grandTotal)}
          </p>
        </div>
      )}

    </div>
  );
}
