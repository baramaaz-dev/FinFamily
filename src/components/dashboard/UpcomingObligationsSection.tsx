import { useTranslation } from 'react-i18next';

// ─── Exported interfaces ──────────────────────────────────────────────────────

export interface ActiveLease {
  id          : string;
  property_id : string;
  tenant_name : string;
  rent_amount : string;
  currency    : string;
  frequency   : string;
  start_date  : string;
  end_date    : string | null;
}

export interface UnpaidExpense {
  id          : string;
  property_id : string;
  type        : string;
  amount      : string;
  currency    : string;
  due_date    : string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpcomingObligationsSectionProps {
  activeLeases    : ActiveLease[];
  unpaidExpenses  : UnpaidExpense[];
  propertyNameMap : Map<string, string>;
  today           : string;
  isLoading       : boolean;
  isError         : boolean;
  onRetry         : () => void;
}

// ─── Constants and helpers ────────────────────────────────────────────────────

const MAX_ROWS = 5;

function formatAmount(amount: string, currency: string): string {
  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
  return `${formatted} ${currency}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ObligationsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[#F1F5F9]" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex justify-between border-t border-[#F1F5F9] py-2">
              <div className="h-3 w-28 animate-pulse rounded bg-[#F1F5F9]" />
              <div className="h-3 w-16 animate-pulse rounded bg-[#F1F5F9]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpcomingObligationsSection({
  activeLeases,
  unpaidExpenses,
  propertyNameMap,
  today,
  isLoading,
  isError,
  onRetry,
}: UpcomingObligationsSectionProps) {
  const { t } = useTranslation();

  if (isLoading) return <ObligationsSkeleton />;

  if (isError) {
    return (
      <p className="py-2 text-sm text-[#C0392B]">
        {t('dashboard.obligations.error')}{' '}
        <button onClick={onRetry} className="cursor-pointer text-[#1E5DC4] underline">
          {t('dashboard.obligations.retry')}
        </button>
      </p>
    );
  }

  const overdueCount    = unpaidExpenses.filter((e) => e.due_date < today).length;
  const visibleLeases   = activeLeases.slice(0, MAX_ROWS);
  const visibleExpenses = unpaidExpenses.slice(0, MAX_ROWS);

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium text-[#1E293B]">
          {t('dashboard.obligations.title')}
        </h2>
        {overdueCount > 0 && (
          <span className="rounded-full px-2 py-0.5 text-xs font-medium text-[#C0392B] bg-[#FEF0EF]">
            {t('dashboard.obligations.overdueBadge').replace('{count}', String(overdueCount))}
          </span>
        )}
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Panel A — Active Leases */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="mb-3 text-sm font-medium text-[#475569]">
            {t('dashboard.obligations.leasesTitle')}
          </p>

          {visibleLeases.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#94A3B8]">
              {t('dashboard.obligations.noLeases')}
            </p>
          ) : (
            <>
              {visibleLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-start justify-between border-t border-[#F1F5F9] py-2 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1E293B]">
                      {propertyNameMap.get(lease.property_id) ?? '—'}
                    </p>
                    <p className="truncate text-xs text-[#475569]">
                      {lease.tenant_name}
                    </p>
                  </div>
                  <div className="ms-3 shrink-0 text-end">
                    <p className="font-mono text-sm text-[#1E293B]">
                      {formatAmount(lease.rent_amount, lease.currency)}
                    </p>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        lease.frequency === 'monthly'
                          ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                          : 'text-[#1A7D4F] bg-[#EBF5F0]'
                      }`}>
                        {lease.frequency === 'monthly'
                          ? t('dashboard.obligations.freqMonthly')
                          : t('dashboard.obligations.freqAnnual')}
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        {lease.end_date ?? t('dashboard.obligations.openEnd')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activeLeases.length > MAX_ROWS && (
                <p className="mt-2 text-center text-xs text-[#94A3B8]">
                  {t('dashboard.obligations.moreItems')
                    .replace('{count}', String(activeLeases.length - MAX_ROWS))}
                </p>
              )}
            </>
          )}
        </div>

        {/* Panel B — Unpaid Expenses */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="mb-3 text-sm font-medium text-[#475569]">
            {t('dashboard.obligations.expensesTitle')}
          </p>

          {visibleExpenses.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#94A3B8]">
              {t('dashboard.obligations.noExpenses')}
            </p>
          ) : (
            <>
              {visibleExpenses.map((expense) => {
                const isOverdue = expense.due_date < today;
                return (
                  <div
                    key={expense.id}
                    className="flex items-start justify-between border-t border-[#F1F5F9] py-2 first:border-t-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1E293B]">
                        {propertyNameMap.get(expense.property_id) ?? '—'}
                      </p>
                      <p className="text-xs text-[#475569]">
                        {expense.due_date}
                      </p>
                    </div>
                    <div className="ms-3 shrink-0 text-end">
                      <p className="font-mono text-sm text-[#1E293B]">
                        {formatAmount(expense.amount, expense.currency)}
                      </p>
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        isOverdue
                          ? 'text-[#C0392B] bg-[#FEF0EF]'
                          : 'text-[#B45309] bg-[#FEF7EC]'
                      }`}>
                        {isOverdue
                          ? t('dashboard.obligations.statusOverdue')
                          : t('dashboard.obligations.statusPending')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {unpaidExpenses.length > MAX_ROWS && (
                <p className="mt-2 text-center text-xs text-[#94A3B8]">
                  {t('dashboard.obligations.moreItems')
                    .replace('{count}', String(unpaidExpenses.length - MAX_ROWS))}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
