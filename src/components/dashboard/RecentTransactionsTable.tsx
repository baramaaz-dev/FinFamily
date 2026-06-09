import { useTranslation } from 'react-i18next';
import { Link }           from 'react-router-dom';
import { ROUTES }         from '@/router/routes';

export interface DashboardTransaction {
  id            : string;
  type          : 'income' | 'expense' | 'transfer';
  amount        : number;
  currency      : 'USD' | 'SYP';
  exchange_rate : number | null;
  category      : string | null;
  date          : string;
  portfolio_name: string;
}

interface RecentTransactionsTableProps {
  transactions: DashboardTransaction[];
  isLoading   : boolean;
  isError     : boolean;
  onRetry     : () => void;
}

function typeBadgeClass(type: DashboardTransaction['type']): string {
  const map: Record<DashboardTransaction['type'], string> = {
    income:   'text-[#1A7D4F] bg-[#EBF5F0]',
    expense:  'text-[#C0392B] bg-[#FEF0EF]',
    transfer: 'text-[#1E5DC4] bg-[#E8F0FB]',
  };
  return map[type];
}

function amountTextClass(type: DashboardTransaction['type']): string {
  const map: Record<DashboardTransaction['type'], string> = {
    income:   'text-[#1A7D4F]',
    expense:  'text-[#C0392B]',
    transfer: 'text-[#1E293B]',
  };
  return map[type];
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
}

function formatApproxUsd(amount: number, rate: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / rate);
}

function RecentTransactionsSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="w-36 h-5 bg-[#F1F5F9] animate-pulse rounded" />
        <div className="w-16 h-4 bg-[#F1F5F9] animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 py-2 border-t border-[#F1F5F9]">
            <div className="w-20 h-4 bg-[#F1F5F9] animate-pulse rounded" />
            <div className="w-14 h-5 bg-[#F1F5F9] animate-pulse rounded-full" />
            <div className="w-24 h-4 bg-[#F1F5F9] animate-pulse rounded" />
            <div className="w-20 h-4 bg-[#F1F5F9] animate-pulse rounded" />
            <div className="w-16 h-4 bg-[#F1F5F9] animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecentTransactionsTable({
  transactions,
  isLoading,
  isError,
  onRetry,
}: RecentTransactionsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <RecentTransactionsSkeleton />;
  }

  if (isError) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <p className="text-sm text-[#C0392B]">
          {t('dashboard.recentTx.error')}{' '}
          <button
            onClick={onRetry}
            className="underline text-[#1E5DC4] cursor-pointer"
          >
            {t('dashboard.recentTx.retry')}
          </button>
        </p>
      </div>
    );
  }

  const typeLabel: Record<DashboardTransaction['type'], string> = {
    income:   t('dashboard.recentTx.typeIncome'),
    expense:  t('dashboard.recentTx.typeExpense'),
    transfer: t('dashboard.recentTx.typeTransfer'),
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-[#1E293B]">
          {t('dashboard.recentTx.title')}
        </h2>
        <Link
          to={ROUTES.TRANSACTIONS}
          className="text-sm text-[#1E5DC4] hover:text-[#164399]"
        >
          {t('dashboard.recentTx.viewAll')}
        </Link>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <p className="text-sm text-[#94A3B8] text-center py-6">
          {t('dashboard.recentTx.empty')}
        </p>
      )}

      {/* Table */}
      {transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-xs font-medium text-[#475569] pb-2 text-start">
                  {t('dashboard.recentTx.colDate')}
                </th>
                <th className="text-xs font-medium text-[#475569] pb-2 text-start ps-3">
                  {t('dashboard.recentTx.colType')}
                </th>
                <th className="text-xs font-medium text-[#475569] pb-2 text-start ps-3">
                  {t('dashboard.recentTx.colAmount')}
                </th>
                <th className="text-xs font-medium text-[#475569] pb-2 text-start ps-3">
                  {t('dashboard.recentTx.colPortfolio')}
                </th>
                <th className="text-xs font-medium text-[#475569] pb-2 text-start ps-3">
                  {t('dashboard.recentTx.colCategory')}
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-[#F1F5F9]">

                  {/* Date */}
                  <td className="py-2 text-sm text-[#1E293B]">{tx.date}</td>

                  {/* Type badge */}
                  <td className="py-2 ps-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass(tx.type)}`}>
                      {typeLabel[tx.type]}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-2 ps-3">
                    <p className={`font-mono text-sm ${amountTextClass(tx.type)}`}>
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    {tx.currency === 'SYP' && tx.exchange_rate !== null && (
                      <p className="font-mono text-xs text-[#94A3B8]">
                        {t('dashboard.recentTx.approxUsd').replace(
                          '{amount}',
                          formatApproxUsd(tx.amount, tx.exchange_rate)
                        )}
                      </p>
                    )}
                  </td>

                  {/* Portfolio */}
                  <td className="py-2 ps-3 text-sm text-[#475569] max-w-[8rem] truncate">
                    {tx.portfolio_name}
                  </td>

                  {/* Category */}
                  <td className="py-2 ps-3 text-sm text-[#94A3B8]">
                    {tx.category ?? t('dashboard.recentTx.noCategory')}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
