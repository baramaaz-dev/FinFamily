import { useNavigate }    from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES }         from '@/router/routes';

export interface PortfolioBalanceCardProps {
  id:            string;
  name:          string;
  type:          'cash_usd' | 'cash_syp' | 'gold' | 'project';
  membersCount:  number;
  netBalanceUSD: number;
}

function typeBadgeClass(type: PortfolioBalanceCardProps['type']): string {
  const map: Record<PortfolioBalanceCardProps['type'], string> = {
    cash_usd: 'text-[#1A7D4F] bg-[#EBF5F0]',
    cash_syp: 'text-[#B45309] bg-[#FEF7EC]',
    gold:     'text-[#B45309] bg-[#FEF7EC]',
    project:  'text-[#1E5DC4] bg-[#E8F0FB]',
  };
  return map[type];
}

function signColor(value: number): string {
  return value >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]';
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PortfolioBalanceCard({
  id,
  name,
  type,
  membersCount,
  netBalanceUSD,
}: PortfolioBalanceCardProps) {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  function handleClick() {
    navigate(ROUTES.PORTFOLIO(id));
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white p-4 transition-shadow hover:border-[#B8CFF5] hover:shadow-sm"
    >
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(type)}`}>
        {t(`portfolios.types.${type}`)}
      </span>

      <p className="mt-2 truncate text-sm font-medium text-[#1E293B]">{name}</p>

      <p className="mt-3 text-xs text-[#475569]">{t('dashboard.portfolios.netBalance')}</p>

      <p className={`font-mono text-xl font-medium ${signColor(netBalanceUSD)}`}>
        {formatUSD(netBalanceUSD)}
      </p>

      <p className="mt-1 text-xs text-[#475569]">
        {t('dashboard.portfolios.members').replace('{count}', String(membersCount))}
      </p>
    </div>
  );
}
