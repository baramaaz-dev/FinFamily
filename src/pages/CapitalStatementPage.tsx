import { useMemo }                 from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery }                from '@tanstack/react-query';
import { useTranslation }          from 'react-i18next';
import { ChevronRight, FileText }  from 'lucide-react';
import { supabaseClient }          from '@/lib/supabase';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';
import type { CapitalTransaction } from '@/types';
import { buildCapitalBreakdown }   from '../utils/capital';
import { PostingStatusBadge }      from '@/components/shared/PostingStatusBadge';

// ─── Fetch helpers ────────────────────────────────────────────────────────────

type RawCapitalAccount = {
  id: string;
  entity_type: string;
  entity_id: string;
  opening_balance: number;
  currency: string;
  opening_date: string;
  people: { name: string } | null;
};

async function fetchCapitalAccount(accountId: string): Promise<RawCapitalAccount> {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select(`
      id, entity_type, entity_id,
      opening_balance, currency, opening_date,
      people!partner_id ( name )
    `)
    .eq('id', accountId)
    .single();
  if (error) throw error;
  return data as unknown as RawCapitalAccount;
}

type RawTransaction = {
  id: string;
  type: CapitalTransaction['type'];
  amount: number;
  currency: SupportedCurrency;
  exchange_rate: number | null;
  date: string;
  reference_no: string | null;
  notes: string | null;
  journal_entry_id: string | null;
  created_at: string;
};

async function fetchTransactions(accountId: string): Promise<RawTransaction[]> {
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('id, type, amount, currency, exchange_rate, date, reference_no, notes, journal_entry_id, created_at')
    .eq('capital_account_id', accountId)
    .order('date',       { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RawTransaction[];
}

async function fetchEntityName(entityType: string, entityId: string): Promise<string> {
  if (entityType === 'portfolio') {
    const { data } = await supabaseClient.from('portfolios').select('name').eq('id', entityId).single();
    return data?.name ?? '—';
  }
  if (entityType === 'property') {
    const { data } = await supabaseClient.from('properties').select('name').eq('id', entityId).single();
    return data?.name ?? '—';
  }
  return '—';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSignedAmount(type: CapitalTransaction['type'], amount: number): number {
  const increases = ['capital_injection', 'profit_share'];
  return increases.includes(type) ? amount : -amount;
}

const TX_TYPE_COLORS: Record<CapitalTransaction['type'], string> = {
  capital_injection: 'text-[#1A7D4F] bg-[#EBF5F0]',
  profit_share:      'text-[#1A7D4F] bg-[#EBF5F0]',
  capital_reduction: 'text-[#C0392B] bg-[#FEF0EF]',
  drawing:           'text-[#C0392B] bg-[#FEF0EF]',
  loss_share:        'text-[#C0392B] bg-[#FEF0EF]',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SummaryRowProps {
  label:      string;
  value:      number;
  prefix:     '+' | '−';
  color:      'positive' | 'negative' | 'neutral';
  alwaysShow?: boolean;
}

const SUMMARY_COLOR: Record<SummaryRowProps['color'], string> = {
  positive: 'text-[#1A7D4F]',
  negative: 'text-[#C0392B]',
  neutral:  'text-[#475569]',
};

function SummaryRow({ label, value, prefix, color, alwaysShow = false }: SummaryRowProps) {
  if (!alwaysShow && value === 0) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#475569]">{label}</span>
      <span className={`font-mono tabular-nums text-sm ${SUMMARY_COLOR[color]}`}>
        {prefix} {formatCurrency(value, 'USD')}
      </span>
    </div>
  );
}

function StatementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-[#F1F5F9] rounded animate-pulse" />
              <div className="h-4 w-28 bg-[#F1F5F9] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
        <div className="bg-[#F8FAFC] h-10 border-b border-[#E2E8F0]" />
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 border-b border-[#E2E8F0] px-4 flex items-center gap-4">
            <div className="h-3 w-20 bg-[#F1F5F9] rounded animate-pulse" />
            <div className="h-5 w-24 bg-[#F1F5F9] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#F1F5F9] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatementEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <FileText size={40} className="text-[#94A3B8]" />
      <p className="font-medium text-[#1E293B]">{t('capital.statement.empty.title')}</p>
      <p className="text-sm text-[#94A3B8]">{t('capital.statement.empty.subtitle')}</p>
    </div>
  );
}

function StatementError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <p className="text-[#475569] text-sm">{t('capital.statement.error')}</p>
      <button
        onClick={onRetry}
        className="text-sm text-[#1E5DC4] border border-[#1E5DC4] rounded-md px-3 py-1.5 hover:bg-[#E8F0FB] transition-colors"
      >
        {t('capital.statement.retry')}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CapitalStatementPage() {
  const { t }        = useTranslation();
  const navigate     = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();

  const {
    data: account,
    isLoading: accountLoading,
    isError: accountError,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ['capital-account', accountId],
    queryFn:  () => fetchCapitalAccount(accountId!),
    enabled:  !!accountId,
    staleTime: 30_000,
  });

  const {
    data: transactions,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['capital-transactions', accountId],
    queryFn:  () => fetchTransactions(accountId!),
    enabled:  !!accountId,
    staleTime: 15_000,
  });

  const {
    data: entityName,
    isLoading: entityLoading,
  } = useQuery({
    queryKey: ['entity-name', account?.entity_type, account?.entity_id],
    queryFn:  () => fetchEntityName(account!.entity_type, account!.entity_id),
    enabled:  !!account,
  });

  const breakdown = useMemo(() => {
    if (!account || !transactions) return null;
    return buildCapitalBreakdown(
      account.opening_balance,
      account.currency as 'USD' | 'SYP',
      null,
      transactions,
    );
  }, [account, transactions]);

  const isLoading = accountLoading || txLoading || entityLoading;
  const isError   = accountError || txError;

  function handleRetry() {
    refetchAccount();
    refetchTx();
  }

  return (
    <div className="p-6 space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate('/capital')}
        className="inline-flex items-center gap-1 text-sm text-[#475569] hover:text-[#1E293B] transition-colors"
      >
        <ChevronRight size={16} />
        {t('capital.statement.backToList')}
      </button>

      {/* Page title */}
      <h1 className="text-xl font-medium text-[#1E293B]">
        {t('capital.statement.title')}
      </h1>

      {isLoading && <StatementSkeleton />}

      {!isLoading && isError && (
        <StatementError onRetry={handleRetry} />
      )}

      {!isLoading && !isError && account && (
        <>
          {/* Account header card */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

              {/* Partner */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.partner')}
                </p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {account.people?.name ?? '—'}
                </p>
              </div>

              {/* Entity type */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.entityType')}
                </p>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    account.entity_type === 'portfolio'
                      ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                      : 'text-[#1A7D4F] bg-[#EBF5F0]'
                  }`}
                >
                  {t(`capital.entityTypes.${account.entity_type}`)}
                </span>
              </div>

              {/* Entity name */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.entity')}
                </p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {entityName ?? '—'}
                </p>
              </div>

              {/* Opening balance */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.openingBalance')}
                </p>
                <p
                  className={`text-sm font-medium font-mono tabular-nums ${
                    account.opening_balance >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                  }`}
                >
                  {formatCurrency(account.opening_balance, account.currency as SupportedCurrency)}
                </p>
              </div>

              {/* Currency */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.currency')}
                </p>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    account.currency === 'USD'
                      ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                      : 'text-[#B45309] bg-[#FEF7EC]'
                  }`}
                >
                  {account.currency}
                </span>
              </div>

              {/* Opening date */}
              <div>
                <p className="text-xs text-[#94A3B8]">
                  {t('capital.statement.accountHeader.openingDate')}
                </p>
                <p className="text-sm font-medium text-[#1E293B]">
                  {account.opening_date}
                </p>
              </div>

            </div>
          </div>

          {/* Closing balance summary card */}
          {breakdown && (
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <h2 className="text-sm font-medium text-[#1E293B] mb-4">
                {t('capital.summary.title')}
              </h2>
              <div className="space-y-2">
                <SummaryRow
                  label={t('capital.summary.openingBalance')}
                  value={breakdown.openingBalance}
                  prefix="+"
                  color="neutral"
                  alwaysShow
                />
                <SummaryRow
                  label={t('capital.summary.injections')}
                  value={breakdown.injections}
                  prefix="+"
                  color="positive"
                />
                <SummaryRow
                  label={t('capital.summary.profitShares')}
                  value={breakdown.profitShares}
                  prefix="+"
                  color="positive"
                />
                <SummaryRow
                  label={t('capital.summary.lossShares')}
                  value={breakdown.lossShares}
                  prefix="−"
                  color="negative"
                />
                <SummaryRow
                  label={t('capital.summary.drawings')}
                  value={breakdown.drawings}
                  prefix="−"
                  color="negative"
                />
                <SummaryRow
                  label={t('capital.summary.reductions')}
                  value={breakdown.reductions}
                  prefix="−"
                  color="negative"
                />
                <div className="border-t border-[#E2E8F0] my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1E293B]">
                    {t('capital.summary.closingBalance')}
                  </span>
                  <span className={`font-mono tabular-nums text-lg font-semibold ${
                    breakdown.closingBalance >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                  }`}>
                    {breakdown.closingBalance >= 0 ? '+' : '−'}
                    {formatCurrency(Math.abs(breakdown.closingBalance), 'USD')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#94A3B8] mt-3">
                {t('capital.summary.currencyNote')}
              </p>
            </div>
          )}

          {/* Transactions table card */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.date')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.type')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.amount')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.currency')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.exchangeRate')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.referenceNo')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.notes')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.postingStatus')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-[#475569]">
                      {t('capital.statement.columns.source')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!transactions || transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <StatementEmpty />
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => {
                      const signed = getSignedAmount(tx.type, tx.amount);
                      const isPositive = signed > 0;
                      return (
                        <tr key={tx.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">

                          {/* date */}
                          <td className="px-4 py-3 text-sm text-[#475569] whitespace-nowrap">
                            {tx.date}
                          </td>

                          {/* type badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TX_TYPE_COLORS[tx.type]}`}
                            >
                              {t(`capital.transactions.types.${tx.type}`)}
                            </span>
                          </td>

                          {/* signed amount */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`font-mono tabular-nums text-sm ${
                                isPositive ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                              }`}
                            >
                              {isPositive ? '+' : '−'}
                              {formatCurrency(Math.abs(signed), tx.currency as SupportedCurrency)}
                            </span>
                          </td>

                          {/* currency badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                tx.currency === 'USD'
                                  ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                                  : 'text-[#B45309] bg-[#FEF7EC]'
                              }`}
                            >
                              {tx.currency}
                            </span>
                          </td>

                          {/* exchange rate */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tx.exchange_rate == null || tx.currency === 'USD' ? (
                              <span className="text-[#94A3B8]">—</span>
                            ) : (
                              <span className="font-mono tabular-nums text-[#475569] text-sm">
                                {tx.exchange_rate}
                              </span>
                            )}
                          </td>

                          {/* reference no */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tx.reference_no == null ? (
                              <span className="text-[#94A3B8]">—</span>
                            ) : (
                              <span className="text-sm text-[#475569]">{tx.reference_no}</span>
                            )}
                          </td>

                          {/* notes */}
                          <td className="px-4 py-3">
                            {tx.notes == null ? (
                              <span className="text-[#94A3B8]">—</span>
                            ) : (
                              <span
                                className="text-sm text-[#475569] max-w-[200px] truncate block"
                                title={tx.notes}
                              >
                                {tx.notes}
                              </span>
                            )}
                          </td>

                          {/* posting status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <PostingStatusBadge journalEntryId={tx.journal_entry_id} />
                          </td>

                          {/* source */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {tx.reference_no?.startsWith('SETTLE-') ? (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5
                                               text-xs font-medium text-[#1A7D4F] bg-[#EBF5F0]">
                                {t('capital.statement.settlementBadge')}
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
