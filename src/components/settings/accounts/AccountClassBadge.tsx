import { useTranslation } from 'react-i18next';
import type { Account } from '@/types';

interface AccountClassBadgeProps {
  accountClass: Account['account_class'];
}

const CLASS_COLORS: Record<Account['account_class'], string> = {
  asset:     'text-[#1E5DC4] bg-[#E8F0FB]',
  liability: 'text-[#B45309] bg-[#FEF7EC]',
  equity:    'text-[#1A7D4F] bg-[#EBF5F0]',
  revenue:   'text-[#1A7D4F] bg-[#EBF5F0]',
  expense:   'text-[#C0392B] bg-[#FEF0EF]',
};

export default function AccountClassBadge({ accountClass }: AccountClassBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${CLASS_COLORS[accountClass]}`}>
      {t(`settings.accounts.classes.${accountClass}`)}
    </span>
  );
}
