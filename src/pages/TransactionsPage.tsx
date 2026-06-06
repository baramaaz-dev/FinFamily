import { useTranslation }                                     from 'react-i18next';
import { useQuery }                                           from '@tanstack/react-query';
import { supabaseClient }                                     from '@/lib/supabase';
import type { Transaction }                                   from '@/types';
import { formatCurrency }                                     from '@/lib/currency';
import { format }                                             from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
}                                                             from '@/components/ui/table';
import { Button }                                             from '@/components/ui/button';
import { Plus, Pencil, Trash2, ArrowLeftRight }               from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeBadgeClass(type: Transaction['type']): string {
  const map: Record<Transaction['type'], string> = {
    income:   'text-[#1A7D4F] bg-[#EBF5F0]',
    expense:  'text-[#C0392B] bg-[#FEF0EF]',
    transfer: 'text-[#1E5DC4] bg-[#E8F0FB]',
  };
  return map[type];
}

function amountTextClass(type: Transaction['type']): string {
  const map: Record<Transaction['type'], string> = {
    income:   'text-[#1A7D4F]',
    expense:  'text-[#C0392B]',
    transfer: 'text-[#475569]',
  };
  return map[type];
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      id,
      portfolio_id,
      type,
      amount,
      currency,
      exchange_rate,
      category,
      date,
      notes,
      journal_entry_id,
      created_at,
      portfolios ( name )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:               row.id,
    portfolio_id:     row.portfolio_id,
    portfolio_name:   (row.portfolios as unknown as { name: string })?.name ?? '—',
    type:             row.type as Transaction['type'],
    amount:           row.amount,
    currency:         row.currency as Transaction['currency'],
    exchange_rate:    row.exchange_rate,
    category:         row.category,
    date:             row.date,
    notes:            row.notes,
    journal_entry_id: row.journal_entry_id,
    created_at:       row.created_at,
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white"
    >
      <div className="flex items-center gap-4 bg-[#F1F5F9] px-4 py-3">
        {[80, 64, 96, 112, 80, 128, 64].map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[#E2E8F0]"
            style={{ width: w }}
          />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-t border-[#E2E8F0] px-4 py-3">
          {[80, 64, 96, 112, 80, 128, 64].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-[#E2E8F0]"
              style={{ width: w }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TransactionsEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <ArrowLeftRight className="h-12 w-12 text-[#94A3B8]" />
      <p className="text-base font-medium text-[#1E293B]">{t('transactions.empty.title')}</p>
      <p className="text-sm text-[#475569]">{t('transactions.empty.subtitle')}</p>
      <Button
        disabled
        onClick={onAdd}
        title={t('transactions.comingSoon')}
        className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
      >
        <Plus className="me-2 h-4 w-4" />
        {t('transactions.addTransaction')}
      </Button>
    </div>
  );
}

function TransactionsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm font-medium text-[#C0392B]">{t('transactions.error.title')}</p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
      >
        {t('transactions.error.retry')}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn:  fetchTransactions,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">{t('transactions.pageTitle')}</h1>
          <p className="mt-0.5 text-sm text-[#475569]">{t('transactions.pageSubtitle')}</p>
        </div>
        <Button
          disabled
          title={t('transactions.comingSoon')}
          className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
        >
          <Plus className="me-2 h-4 w-4" />
          {t('transactions.addTransaction')}
        </Button>
      </div>

      {/* States */}
      {isLoading && <TransactionsSkeleton />}
      {isError   && <TransactionsError onRetry={refetch} />}
      {!isLoading && !isError && transactions.length === 0 && <TransactionsEmpty onAdd={() => {}} />}

      {/* Table */}
      {!isLoading && !isError && transactions.length > 0 && (
        <div
          className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white"
          role="region"
          aria-label={t('transactions.pageTitle')}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                <TableHead className="text-start">{t('transactions.columns.date')}</TableHead>
                <TableHead className="text-start">{t('transactions.columns.type')}</TableHead>
                <TableHead className="text-start">{t('transactions.columns.amount')}</TableHead>
                <TableHead className="text-start">{t('transactions.columns.portfolio')}</TableHead>
                <TableHead className="text-start">{t('transactions.columns.category')}</TableHead>
                <TableHead className="text-start">{t('transactions.columns.notes')}</TableHead>
                <TableHead className="text-end">{t('transactions.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]">

                  {/* Date */}
                  <TableCell className="font-mono tabular-nums text-[#475569]">
                    {format(new Date(tx.date), 'dd/MM/yyyy')}
                  </TableCell>

                  {/* Type badge */}
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClass(tx.type)}`}>
                      {t(`transactions.types.${tx.type}`)}
                    </span>
                  </TableCell>

                  {/* Amount — with optional SYP→USD secondary line */}
                  <TableCell>
                    <span className={`font-mono tabular-nums font-medium ${amountTextClass(tx.type)}`}>
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    {tx.currency === 'SYP' && tx.exchange_rate !== null && (
                      <span className="block text-xs text-[#94A3B8]">
                        {'≈ '}{formatCurrency(tx.amount / tx.exchange_rate, 'USD')}
                      </span>
                    )}
                  </TableCell>

                  {/* Portfolio */}
                  <TableCell className="text-sm text-[#1E293B]">
                    {tx.portfolio_name}
                  </TableCell>

                  {/* Category */}
                  <TableCell className="text-sm text-[#475569]">
                    {tx.category ?? '—'}
                  </TableCell>

                  {/* Notes */}
                  <TableCell>
                    <span
                      className="block max-w-[200px] truncate text-sm text-[#475569]"
                      title={tx.notes ?? undefined}
                    >
                      {tx.notes || '—'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-end">
                    <button
                      disabled
                      title={t('transactions.actions.edit')}
                      className="me-2 cursor-not-allowed opacity-40 text-[#1E5DC4]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      disabled
                      title={t('transactions.actions.delete')}
                      className="cursor-not-allowed opacity-40 text-[#C0392B]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

    </div>
  );
}
