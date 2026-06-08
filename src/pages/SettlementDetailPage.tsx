import { useState }                  from 'react';
import { useParams, useNavigate }    from 'react-router-dom';
import { useQuery, useQueryClient }  from '@tanstack/react-query';
import { useTranslation }            from 'react-i18next';
import { ChevronRight, Lock }        from 'lucide-react';
import { toast }                     from 'sonner';
import { supabaseClient }            from '@/lib/supabase';
import { formatCurrency, type SupportedCurrency } from '@/lib/currency';
import type { ProfitSettlement, SettlementShare } from '@/types';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// ─── Local types ──────────────────────────────────────────────────────────────

interface EntityMember {
  person_id:         string;
  partner_name:      string;
  share_numerator:   number;
  share_denominator: number;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchSettlement(id: string): Promise<ProfitSettlement | null> {
  const { data, error } = await supabaseClient
    .from('profit_settlements')
    .select('id, entity_type, entity_id, period_start, period_end, total_profit, currency, settlement_date, status, notes, created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as ProfitSettlement;
}

async function fetchShares(settlementId: string): Promise<SettlementShare[]> {
  const { data, error } = await supabaseClient
    .from('settlement_shares')
    .select(`
      id, settlement_id, partner_id, share_numerator, share_denominator,
      amount, capital_transaction_id, created_at,
      people!partner_id ( name )
    `)
    .eq('settlement_id', settlementId)
    .order('amount', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(row => ({
    ...row,
    partner_name: (row.people as unknown as { name: string })?.name ?? '—',
  })) as unknown as SettlementShare[];
}

async function fetchEntityMembers(
  entityType: 'portfolio' | 'property',
  entityId: string,
): Promise<EntityMember[]> {
  if (entityType === 'portfolio') {
    const { data, error } = await supabaseClient
      .from('portfolio_members')
      .select('person_id, share_numerator, share_denominator, people!person_id(name)')
      .eq('portfolio_id', entityId);
    if (error) throw error;
    return (data ?? []).map(m => ({
      person_id:         m.person_id,
      partner_name:      (m.people as unknown as { name: string })?.name ?? '—',
      share_numerator:   m.share_numerator,
      share_denominator: m.share_denominator,
    }));
  }
  const { data, error } = await supabaseClient
    .from('property_owners')
    .select('person_id, share_numerator, share_denominator, people!person_id(name)')
    .eq('property_id', entityId);
  if (error) throw error;
  return (data ?? []).map(m => ({
    person_id:         m.person_id,
    partner_name:      (m.people as unknown as { name: string })?.name ?? '—',
    share_numerator:   m.share_numerator,
    share_denominator: m.share_denominator,
  }));
}

async function fetchEntityName(entityType: string, entityId: string): Promise<string> {
  if (entityType === 'portfolio') {
    const { data } = await supabaseClient
      .from('portfolios')
      .select('name')
      .eq('id', entityId)
      .single();
    return data?.name ?? '—';
  }
  const { data } = await supabaseClient
    .from('properties')
    .select('name')
    .eq('id', entityId)
    .single();
  return data?.name ?? '—';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'draft' | 'confirmed' }) {
  const { t } = useTranslation();
  const style = status === 'draft'
    ? 'bg-[#FEF7EC] text-[#B45309]'
    : 'bg-[#EBF5F0] text-[#1A7D4F]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {t(`settlements.status.${status}`)}
    </span>
  );
}

interface InfoFieldProps { label: string; value: React.ReactNode; }
function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-[#94A3B8]">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded bg-[#F1F5F9] animate-pulse" />
      <div className="h-32 rounded-lg bg-[#F1F5F9] animate-pulse" />
      <div className="h-48 rounded-lg bg-[#F1F5F9] animate-pulse" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettlementDetailPage() {
  const { t }           = useTranslation();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const { settlementId } = useParams<{ settlementId: string }>();

  const [isCalculating, setIsCalculating] = useState(false);

  const {
    data: settlement,
    isLoading: settlementLoading,
    isError: settlementError,
    refetch: refetchSettlement,
  } = useQuery({
    queryKey: ['settlement', settlementId],
    queryFn:  () => fetchSettlement(settlementId!),
    enabled:  !!settlementId,
    staleTime: 30_000,
  });

  const {
    data: shares = [],
    isLoading: sharesLoading,
    refetch: refetchShares,             // ← أضيف هنا
  } = useQuery({
    queryKey: ['settlement-shares', settlementId],
    queryFn:  () => fetchShares(settlementId!),
    enabled:  !!settlementId,
    staleTime: 15_000,
  });

  const { data: entityName = '—' } = useQuery({
    queryKey: ['entity-name-settlement', settlement?.entity_type, settlement?.entity_id],
    queryFn:  () => fetchEntityName(settlement!.entity_type, settlement!.entity_id),
    enabled:  !!settlement,
    staleTime: 5 * 60 * 1000,
  });

  async function handleCalculateShares() {
    if (!settlement) return;
    setIsCalculating(true);
    try {
      const members = await fetchEntityMembers(
        settlement.entity_type as 'portfolio' | 'property',
        settlement.entity_id,
      );

      if (members.length === 0) {
        toast.error(t('settlements.detail.noMembers'));
        return;
      }

      const sharesToInsert = members.map(m => ({
        settlement_id:          settlement.id,
        partner_id:             m.person_id,
        share_numerator:        m.share_numerator,
        share_denominator:      m.share_denominator,
        amount:                 settlement.total_profit * (m.share_numerator / m.share_denominator),
        capital_transaction_id: null,
      }));

      // Validate sum — warn only, do not block (float tolerance per STR-006 §8.2)
      const sumAmounts = sharesToInsert.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(sumAmounts - settlement.total_profit) > 0.0001) {
        console.warn('Share sum mismatch:', { sumAmounts, total: settlement.total_profit });
      }

      const { error } = await supabaseClient
        .from('settlement_shares')
        .insert(sharesToInsert);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['settlement-shares', settlementId] });
      await refetchShares();            // ← أضيف هنا: إجبار على إعادة الجلب فوراً
      toast.success(t('settlements.detail.toast.calculateSuccess'));
    } catch {
      toast.error(t('settlements.detail.toast.calculateError'));
    } finally {
      setIsCalculating(false);
    }
  }

  const isLoading = settlementLoading || sharesLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (settlementError || !settlement) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-[#C0392B]">{t('settlements.detail.error')}</p>
        <Button variant="outline" onClick={() => refetchSettlement()}>
          {t('settlements.detail.retry')}
        </Button>
      </div>
    );
  }

  const sumAmounts = shares.reduce((acc, s) => acc + s.amount, 0);
  const sumMatches = Math.abs(sumAmounts - settlement.total_profit) <= 0.0001;

  return (
    <div className="p-6 space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate('/settlements')}
        className="inline-flex items-center gap-1 text-sm text-[#475569] hover:text-[#1E5DC4] transition-colors"
      >
        <ChevronRight size={16} className="rotate-180" />
        {t('settlements.detail.backToList')}
      </button>

      {/* Page title + status badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-medium text-[#1E293B]">
          {t('settlements.detail.title')}
        </h1>
        <StatusBadge status={settlement.status} />
      </div>

      {/* Settlement info card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
        <h2 className="text-sm font-medium text-[#1E293B] mb-4">
          {t('settlements.detail.settlementInfo')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoField
            label={t('settlements.detail.entity')}
            value={entityName}
          />
          <InfoField
            label={t('settlements.detail.entityType')}
            value={t(`settlements.entityTypes.${settlement.entity_type as 'portfolio' | 'property'}`)}
          />
          <InfoField
            label={t('settlements.detail.period')}
            value={
              <span className="font-mono tabular-nums">
                {settlement.period_start} — {settlement.period_end}
              </span>
            }
          />
          <InfoField
            label={t('settlements.detail.totalProfit')}
            value={
              <span className="font-mono tabular-nums text-[#1A7D4F]">
                {formatCurrency(settlement.total_profit, settlement.currency as SupportedCurrency)}
              </span>
            }
          />
          <InfoField
            label={t('settlements.detail.currency')}
            value={
              <span className={`inline-flex font-mono text-xs px-1.5 py-0.5 rounded ${
                settlement.currency === 'SYP'
                  ? 'bg-[#FEF3C7] text-[#B45309]'
                  : 'bg-[#EFF6FF] text-[#1E5DC4]'
              }`}>
                {settlement.currency}
              </span>
            }
          />
          <InfoField
            label={t('settlements.detail.settlementDate')}
            value={
              <span className="font-mono tabular-nums">{settlement.settlement_date}</span>
            }
          />
        </div>
        {settlement.notes && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#94A3B8] mb-1">{t('settlements.detail.notes')}</p>
            <p className="text-sm text-[#475569]">{settlement.notes}</p>
          </div>
        )}
      </div>

      {/* Shares section */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">

        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h2 className="text-sm font-medium text-[#1E293B]">
            {t('settlements.detail.sharesSection')}
          </h2>
          {shares.length > 0 && settlement.status === 'draft' && (
            <button
              disabled
              title={t('settlements.detail.confirmLocked')}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5
                         text-sm font-medium bg-[#F1F5F9] text-[#94A3B8]
                         cursor-not-allowed border border-[#E2E8F0]"
            >
              <Lock size={13} />
              {t('settlements.detail.confirmSettlement')}
            </button>
          )}
        </div>

        {/* No shares + draft → show calculate button */}
        {shares.length === 0 && settlement.status === 'draft' && (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#1E293B]">
              {t('settlements.detail.noShares.title')}
            </p>
            <p className="text-xs text-[#475569]">
              {t('settlements.detail.noShares.subtitle')}
            </p>
            <button
              onClick={handleCalculateShares}
              disabled={isCalculating}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm
                         font-medium bg-[#1E5DC4] text-white hover:bg-[#164399]
                         disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculating
                ? t('settlements.detail.calculating')
                : t('settlements.detail.calculateShares')}
            </button>
          </div>
        )}

        {/* No shares + confirmed → empty confirmed state */}
        {shares.length === 0 && settlement.status === 'confirmed' && (
          <div className="p-8 text-center">
            <p className="text-sm text-[#94A3B8]">{t('settlements.detail.noMembers')}</p>
          </div>
        )}

        {/* Shares table */}
        {shares.length > 0 && (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="text-[#64748B]">
                    {t('settlements.detail.sharesColumns.partner')}
                  </TableHead>
                  <TableHead className="text-[#64748B]">
                    {t('settlements.detail.sharesColumns.fraction')}
                  </TableHead>
                  <TableHead className="text-[#64748B] text-end">
                    {t('settlements.detail.sharesColumns.amount')}
                  </TableHead>
                  <TableHead className="text-[#64748B]">
                    {t('settlements.detail.sharesColumns.currency')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map(share => (
                  <TableRow key={share.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="text-sm text-[#1E293B]">
                      {share.partner_name}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-[#475569]">
                      {share.share_numerator}/{share.share_denominator}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-sm text-[#1A7D4F] text-end">
                      {formatCurrency(share.amount, settlement.currency as SupportedCurrency)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                        settlement.currency === 'SYP'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#EFF6FF] text-[#1E5DC4]'
                      }`}>
                        {settlement.currency}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Sum check */}
            <div className="px-4 py-3 border-t border-[#E2E8F0]">
              {sumMatches ? (
                <p className="text-xs text-[#1A7D4F]">
                  {t('settlements.detail.sumCheck.match')}
                </p>
              ) : (
                <p className="text-xs text-[#C0392B]">
                  {t('settlements.detail.sumCheck.mismatch')
                    .replace('{sum}',   formatCurrency(sumAmounts, settlement.currency as SupportedCurrency))
                    .replace('{total}', formatCurrency(settlement.total_profit, settlement.currency as SupportedCurrency))}
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
