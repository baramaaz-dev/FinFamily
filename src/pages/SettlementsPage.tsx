import { useState }                  from 'react';
import { useQuery, useQueryClient }  from '@tanstack/react-query';
import { useNavigate }               from 'react-router-dom';
import { useTranslation }            from 'react-i18next';
import { BarChart2, Plus, Eye }      from 'lucide-react';
import { supabaseClient }            from '@/lib/supabase';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button }              from '@/components/ui/button';
import AddSettlementDialog     from '@/components/settlements/AddSettlementDialog';

// ─── Local types ──────────────────────────────────────────────────────────────

type RawSettlement = {
  id:              string;
  entity_type:     string;
  entity_id:       string;
  period_start:    string;
  period_end:      string;
  total_profit:    number;
  currency:        SupportedCurrency;
  settlement_date: string;
  status:          'draft' | 'confirmed';
  notes:           string | null;
  created_at:      string;
};

type DisplaySettlement = RawSettlement & {
  entity_name: string;
};

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchSettlements(): Promise<DisplaySettlement[]> {
  const { data: rows, error } = await supabaseClient
    .from('profit_settlements')
    .select('id, entity_type, entity_id, period_start, period_end, total_profit, currency, settlement_date, status, notes, created_at')
    .order('settlement_date', { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const settlements = rows as unknown as RawSettlement[];

  // Gather portfolio and property IDs to resolve names
  const portfolioIds = [...new Set(settlements.filter(s => s.entity_type === 'portfolio').map(s => s.entity_id))];
  const propertyIds  = [...new Set(settlements.filter(s => s.entity_type === 'property').map(s => s.entity_id))];

  const [portfolioRes, propertyRes] = await Promise.all([
    portfolioIds.length > 0
      ? supabaseClient.from('portfolios').select('id, name').in('id', portfolioIds)
      : { data: [] },
    propertyIds.length > 0
      ? supabaseClient.from('properties').select('id, name').in('id', propertyIds)
      : { data: [] },
  ]);

  const nameMap = new Map<string, string>();
  (portfolioRes.data ?? []).forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));
  (propertyRes.data  ?? []).forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));

  return settlements.map(s => ({ ...s, entity_name: nameMap.get(s.entity_id) ?? s.entity_id }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettlementsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-md bg-[#F1F5F9] animate-pulse" />
      ))}
    </div>
  );
}

function SettlementsEmpty() {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center">
      <BarChart2 className="mx-auto mb-3 text-[#94A3B8]" size={40} />
      <p className="font-medium text-[#0F172A]">{t('settlements.empty.title')}</p>
      <p className="text-sm text-[#475569]">{t('settlements.empty.subtitle')}</p>
    </div>
  );
}

interface SettlementsErrorProps { onRetry: () => void; }
function SettlementsError({ onRetry }: SettlementsErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center space-y-3">
      <p className="text-[#C0392B]">{t('settlements.error')}</p>
      <Button variant="outline" onClick={onRetry}>{t('settlements.retry')}</Button>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'draft' | 'confirmed' }) {
  const { t } = useTranslation();
  const style = status === 'draft'
    ? 'bg-[#FEF3C7] text-[#B45309]'
    : 'bg-[#D1FAE5] text-[#1A7D4F]';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {t(`settlements.status.${status}`)}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettlementsPage() {
  const { t }       = useTranslation();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: settlements = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['settlements'],
    queryFn:  fetchSettlements,
    staleTime: 2 * 60 * 1000,
  });

  function handleSuccess() {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['settlements'] });
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
            <BarChart2 size={22} className="text-[#1E5DC4]" />
            {t('settlements.title')}
          </h1>
          <p className="text-sm text-[#475569] mt-1">{t('settlements.subtitle')}</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
        >
          <Plus size={16} className="me-1.5" />
          {t('settlements.addSettlement')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SettlementsSkeleton />
      ) : isError ? (
        <SettlementsError onRetry={() => refetch()} />
      ) : settlements.length === 0 ? (
        <SettlementsEmpty />
      ) : (
        <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC]">
                <TableHead className="text-[#64748B]">{t('settlements.columns.entity')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.entityType')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.period')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.settlementDate')}</TableHead>
                <TableHead className="text-[#64748B] text-end">{t('settlements.columns.totalProfit')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.currency')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.status')}</TableHead>
                <TableHead className="text-[#64748B]">{t('settlements.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map(s => (
                <TableRow key={s.id} className="hover:bg-[#F8FAFC]">
                  <TableCell className="font-medium text-[#0F172A]">{s.entity_name}</TableCell>
                  <TableCell className="text-[#475569]">
                    {t(`settlements.entityTypes.${s.entity_type as 'portfolio' | 'property'}`)}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-sm text-[#475569]">
                    {s.period_start} — {s.period_end}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-sm text-[#475569]">
                    {s.settlement_date}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-sm text-[#1A7D4F] text-end">
                    {formatCurrency(s.total_profit, s.currency as SupportedCurrency)}
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      s.currency === 'SYP'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#EFF6FF] text-[#1E5DC4]'
                    }`}>
                      {s.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigate(`/settlements/${s.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5
                                 text-xs font-medium text-[#1E5DC4] bg-[#E8F0FB]
                                 hover:bg-[#B8CFF5] transition-colors"
                    >
                      <Eye size={13} />
                      {t('settlements.details')}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddSettlementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />

    </div>
  );
}
