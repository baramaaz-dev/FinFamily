import { useTranslation }    from 'react-i18next';
import { TrendingUp, AlertCircle } from 'lucide-react';
import NetWorthCardSkeleton  from './NetWorthCardSkeleton';

export interface NetWorthCardProps {
  portfolioBalanceUSD: number;
  propertyValueUSD:    number;
  isLoading:           boolean;
  isError:             boolean;
  onRetry:             () => void;
}

const signColor = (value: number): string =>
  value >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]';

const formatUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function NetWorthCard({
  portfolioBalanceUSD,
  propertyValueUSD,
  isLoading,
  isError,
  onRetry,
}: NetWorthCardProps) {
  const { t } = useTranslation();

  if (isLoading) return <NetWorthCardSkeleton />;

  if (isError) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
        <AlertCircle className="h-6 w-6 text-[#C0392B]" />
        <p className="mt-2 text-sm text-[#475569]">
          {t('dashboard.netWorth.error')}
        </p>
        <button
          onClick={onRetry}
          className="mt-3 cursor-pointer text-sm text-[#1E5DC4] underline hover:text-[#164399]"
        >
          {t('dashboard.netWorth.retry')}
        </button>
      </div>
    );
  }

  const total = portfolioBalanceUSD + propertyValueUSD;

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-medium text-[#1E293B]">
            {t('dashboard.netWorth.title')}
          </p>
          <p className="mt-0.5 text-sm text-[#475569]">
            {t('dashboard.netWorth.subtitle')}
          </p>
        </div>
        <div className="rounded-md bg-[#E8F0FB] p-2">
          <TrendingUp className="h-5 w-5 text-[#1E5DC4]" />
        </div>
      </div>

      <p className="mt-4">
        <span className={`font-mono text-3xl font-medium ${signColor(total)}`}>
          {formatUSD(total)}
        </span>
      </p>

      <hr className="my-4 border-[#E2E8F0]" />

      <div className="flex gap-6">
        <div>
          <p className="text-sm text-[#475569]">
            {t('dashboard.netWorth.portfolios')}
          </p>
          <p className={`font-mono text-sm font-medium ${signColor(portfolioBalanceUSD)}`}>
            {formatUSD(portfolioBalanceUSD)}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#475569]">
            {t('dashboard.netWorth.properties')}
          </p>
          <p className={`font-mono text-sm font-medium ${signColor(propertyValueUSD)}`}>
            {formatUSD(propertyValueUSD)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#94A3B8]">
        {t('dashboard.netWorth.currencyNote')}
      </p>
    </div>
  );
}
