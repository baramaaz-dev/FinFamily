import { useState, useMemo }       from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate }              from 'react-router-dom';
import { useTranslation }           from 'react-i18next';
import { Wallet, Plus, Lock, Eye }  from 'lucide-react';
import { supabaseClient }           from '@/lib/supabase';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';
import { buildCapitalBreakdown }   from '../utils/capital';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }                   from '@/components/ui/button';
import AddCapitalAccountDialog      from '@/components/capital/AddCapitalAccountDialog';
import AddCapitalTransactionDialog  from '@/components/capital/AddCapitalTransactionDialog';

// ─── Local types ──────────────────────────────────────────────────────────────

type RawCapitalRow = {
  id: string;
  partner_id: string;
  entity_type: string;
  entity_id: string;
  opening_balance: number;
  currency: string;
  opening_date: string;
  created_at: string;
  people: { name: string } | null;
};

type DisplayCapitalRow = RawCapitalRow & {
  partner_name: string;
  entity_name: string;
};

type EntityNameMap = {
  portfolios: { id: string; name: string }[];
  properties: { id: string; name: string }[];
};

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchCapitalAccounts(): Promise<RawCapitalRow[]> {
  const { data, error } = await supabaseClient
    .from('partner_capital_accounts')
    .select(`
      id, partner_id, entity_type, entity_id,
      opening_balance, currency, opening_date, created_at,
      people!partner_id ( name )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RawCapitalRow[];
}

type RawTxForBalance = {
  capital_account_id: string;
  type: 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share';
  amount: number;
  currency: SupportedCurrency;
  exchange_rate: number | null;
};

async function fetchAllTransactionsForBalance(): Promise<RawTxForBalance[]> {
  const { data, error } = await supabaseClient
    .from('capital_transactions')
    .select('capital_account_id, type, amount, currency, exchange_rate');
  if (error) throw error;
  return (data ?? []) as unknown as RawTxForBalance[];
}

async function fetchEntityNames(): Promise<EntityNameMap> {
  const [pfolio, prop] = await Promise.all([
    supabaseClient.from('portfolios').select('id, name'),
    supabaseClient.from('properties').select('id, name'),
  ]);
  return {
    portfolios: pfolio.data ?? [],
    properties: prop.data ?? [],
  };
}

function resolveEntityName(
  entityType: string,
  entityId: string,
  entityData: EntityNameMap,
): string {
  const list = entityType === 'portfolio' ? entityData.portfolios : entityData.properties;
  return list.find(e => e.id === entityId)?.name ?? '—';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CapitalSkeleton() {
  return (
    <TableBody>
      {[0, 1, 2, 3, 4].map(i => (
        <TableRow key={i}>
          {[0, 1, 2, 3, 4, 5, 6].map(j => (
            <TableCell key={j}>
              <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function CapitalEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={7}>
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Wallet size={40} className="text-[#94A3B8]" />
            <p className="font-medium text-[#1E293B]">{t('capital.empty.title')}</p>
            <p className="text-sm text-[#94A3B8]">{t('capital.empty.subtitle')}</p>
            <Button
              onClick={onAdd}
              className="mt-2 bg-[#1E5DC4] hover:bg-[#1a52b0] text-white"
            >
              <Plus size={15} className="me-1.5" />
              {t('capital.addAccount')}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function CapitalError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={7}>
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <p className="text-[#475569] text-sm">{t('capital.error.title')}</p>
            <button
              onClick={onRetry}
              className="text-sm text-[#1E5DC4] border border-[#1E5DC4] rounded-md px-3 py-1.5 hover:bg-[#E8F0FB] transition-colors"
            >
              {t('capital.error.retry')}
            </button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CapitalAccountsPage() {
  const { t }            = useTranslation();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const [dialogOpen, setDialogOpen]             = useState(false);
  const [selectedAccount, setSelectedAccount]   = useState<DisplayCapitalRow | null>(null);
  const [txDialogOpen, setTxDialogOpen]         = useState(false);

  const {
    data: accounts,
    isLoading: accountsLoading,
    isError: accountsError,
    refetch,
  } = useQuery({
    queryKey: ['capital-accounts'],
    queryFn:  fetchCapitalAccounts,
    staleTime: 30_000,
  });

  const {
    data: entityData,
    isLoading: entityLoading,
  } = useQuery({
    queryKey: ['entity-names-for-capital'],
    queryFn:  fetchEntityNames,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: allTransactions,
  } = useQuery({
    queryKey: ['capital-transactions-all'],
    queryFn:  fetchAllTransactionsForBalance,
    staleTime: 15_000,
  });

  const displayRows = useMemo((): DisplayCapitalRow[] => {
    if (!accounts || !entityData) return [];
    return accounts.map(acc => ({
      ...acc,
      partner_name: acc.people?.name ?? '—',
      entity_name:  resolveEntityName(acc.entity_type, acc.entity_id, entityData),
    }));
  }, [accounts, entityData]);

  const closingBalanceMap = useMemo(() => {
    if (!accounts || !allTransactions) return new Map<string, number>();
    return new Map(
      accounts.map(account => {
        const txs = allTransactions.filter(tx => tx.capital_account_id === account.id);
        const breakdown = buildCapitalBreakdown(
          account.opening_balance,
          account.currency as 'USD' | 'SYP',
          null,
          txs,
        );
        return [account.id, breakdown.closingBalance];
      }),
    );
  }, [accounts, allTransactions]);

  const isLoading = accountsLoading || entityLoading;

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('capital.title')}
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            {t('capital.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#1E5DC4] hover:bg-[#1a52b0] text-white"
        >
          <Plus size={15} className="me-1.5" />
          {t('capital.addAccount')}
        </Button>
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.partner')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.entityType')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.entity')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.openingBalance')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.closingBalance')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.openingDate')}</TableHead>
              <TableHead className="text-[#475569] font-medium">{t('capital.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading  && <CapitalSkeleton />}
          {!isLoading && accountsError  && <CapitalError onRetry={() => refetch()} />}
          {!isLoading && !accountsError && displayRows.length === 0 && (
            <CapitalEmpty onAdd={() => setDialogOpen(true)} />
          )}
          {!isLoading && !accountsError && displayRows.length > 0 && (
            <TableBody>
              {displayRows.map(row => (
                <TableRow key={row.id} className="hover:bg-[#F8FAFC]">
                  <TableCell className="font-medium text-[#1E293B]">{row.partner_name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        row.entity_type === 'portfolio'
                          ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                          : 'text-[#1A7D4F] bg-[#EBF5F0]'
                      }`}
                    >
                      {t(`capital.entityTypes.${row.entity_type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#475569]">{row.entity_name}</TableCell>
                  <TableCell className="font-mono text-[#1E293B]">
                    {formatCurrency(row.opening_balance, row.currency as SupportedCurrency)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const closing = closingBalanceMap.get(row.id) ?? row.opening_balance;
                      return (
                        <span className={`font-mono tabular-nums text-sm ${
                          closing >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]'
                        }`}>
                          {closing >= 0 ? '+' : '−'}
                          {formatCurrency(Math.abs(closing), 'USD')}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-[#475569]">{row.opening_date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/capital/${row.id}`)}
                        title={t('capital.statement.viewButton')}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#1E5DC4] border border-[#B8CFF5] hover:bg-[#E8F0FB] transition-colors"
                      >
                        <Eye size={11} />
                        {t('capital.statement.viewButton')}
                      </button>
                      <button
                        onClick={() => { setSelectedAccount(row); setTxDialogOpen(true); }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#1A7D4F] border border-[#A3D4BC] hover:bg-[#EBF5F0] transition-colors"
                      >
                        <Plus size={11} />
                        {t('capital.transactions.addButton')}
                      </button>
                      <button
                        disabled
                        title={t('capital.comingSoon')}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#94A3B8] cursor-not-allowed opacity-60 border border-[#E2E8F0] bg-[#F1F5F9]"
                      >
                        <Lock size={11} />
                        {t('common.edit')}
                      </button>
                      <button
                        disabled
                        title={t('capital.comingSoon')}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#94A3B8] cursor-not-allowed opacity-60 border border-[#E2E8F0] bg-[#F1F5F9]"
                      >
                        <Lock size={11} />
                        {t('common.delete')}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <AddCapitalAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {}}
      />

      <AddCapitalTransactionDialog
        account={selectedAccount}
        open={txDialogOpen}
        onOpenChange={(open) => {
          setTxDialogOpen(open);
          if (!open) setSelectedAccount(null);
        }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['capital-accounts'] })}
      />
    </div>
  );
}
