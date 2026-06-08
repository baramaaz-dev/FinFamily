import { useMemo }                 from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { useQuery }                from '@tanstack/react-query';
import { useTranslation }          from 'react-i18next';
import { toUSD, formatCurrency }   from '@/lib/currency';
import { format }                  from 'date-fns';
import { ChevronRight, Wallet, Building2 } from 'lucide-react';
import { supabaseClient }          from '@/lib/supabase';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ─── Local interfaces ────────────────────────────────────────────────────────

interface PortfolioMembership {
  share_numerator:   number;
  share_denominator: number;
  joined_date:       string;
  portfolios: {
    id:   string;
    name: string;
    type: string;
  };
}

interface PropertyOwnership {
  share_numerator:   number;
  share_denominator: number;
  ownership_basis:   string;
  properties: {
    id:              string;
    name:            string;
    type:            string;
    location:        string | null;
    status:          string;
    estimated_value: number | null;
  };
}

// ─── Skeleton sub-components ─────────────────────────────────────────────────

function PartnerDetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-[#E2E8F0]" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-lg border border-[#E2E8F0] bg-white p-4 text-center">
            <div className="mx-auto h-8 w-10 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </div>
      {[0, 1].map(i => (
        <div key={i} className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
          <div className="border-b border-[#E2E8F0] px-4 py-3">
            <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
          <div className="space-y-3 p-4">
            {[0, 1, 2].map(j => (
              <div key={j} className="h-8 animate-pulse rounded bg-[#E2E8F0]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-8 animate-pulse rounded bg-[#E2E8F0]" />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PartnerDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t }    = useTranslation();

  // Hook 1 — Person data
  const {
    data: person,
    isLoading: personLoading,
    error: personError,
    refetch: refetchPerson,
  } = useQuery({
    queryKey: ['partner-detail', id],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('people')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });

  // Hook 2 — Partner portfolios
  const {
    data: portfolioMemberships = [],
    isLoading: portfoliosLoading,
  } = useQuery({
    queryKey: ['partner-portfolios', id],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('portfolio_members')
        .select('share_numerator, share_denominator, joined_date, portfolios(id, name, type)')
        .eq('person_id', id!);
      if (error) throw error;
      return (data ?? []) as unknown as PortfolioMembership[];
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  // Hook 3 — Partner properties
  const {
    data: propertyOwnerships = [],
    isLoading: propertiesLoading,
  } = useQuery({
    queryKey: ['partner-properties', id],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('property_owners')
        .select('share_numerator, share_denominator, ownership_basis, properties(id, name, type, location, status, estimated_value)')
        .eq('person_id', id!);
      if (error) throw error;
      return (data ?? []) as unknown as PropertyOwnership[];
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  // Hook 4 — Capital accounts count
  const { data: capitalCount = 0 } = useQuery({
    queryKey: ['partner-capital-count', id],
    queryFn: async () => {
      const { count, error } = await supabaseClient
        .from('partner_capital_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', id!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  // Hook 5 — Portfolio transactions (for balance calculation)
  const portfolioIds = portfolioMemberships.map((pm) => pm.portfolios.id);

  const { data: allPortfolioTxs = [], isLoading: txLoading } = useQuery({
    queryKey: ['partner-portfolio-transactions', id],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('transactions')
        .select('portfolio_id, type, amount, currency, exchange_rate')
        .in('portfolio_id', portfolioIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id && portfolioMemberships.length > 0,
    staleTime: 30_000,
  });

  // Portfolio balance map — net USD balance per portfolio id
  const portfolioBalanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const pm of portfolioMemberships) {
      const txs = allPortfolioTxs.filter(
        (tx) => tx.portfolio_id === pm.portfolios.id
      );
      const balance = txs.reduce((sum, tx) => {
        const usdAmount = toUSD(
          Number(tx.amount),
          tx.currency as 'USD' | 'SYP',
          tx.exchange_rate ?? 1
        );
        if (tx.type === 'income')  return sum + usdAmount;
        if (tx.type === 'expense') return sum - usdAmount;
        return sum;
      }, 0);
      map.set(pm.portfolios.id, balance);
    }
    return map;
  }, [allPortfolioTxs, portfolioMemberships]);

  const signColor = (value: number): string => {
    if (value > 0) return 'text-[#1A7D4F]';
    if (value < 0) return 'text-[#C0392B]';
    return 'text-[#94A3B8]';
  };

  // Loading guard — all hooks declared above
  if (personLoading) return <PartnerDetailSkeleton />;

  // Error guard
  if (personError) return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center">
      <p className="text-sm font-medium text-[#C0392B]">{t('partners.error.title')}</p>
      <button
        onClick={() => refetchPerson()}
        className="mt-3 rounded-md border border-[#E2E8F0] px-4 py-1.5 text-sm text-[#1E5DC4] hover:bg-[#E8F0FB]"
      >
        {t('partners.error.retry')}
      </button>
    </div>
  );

  // Not found guard
  if (person === null) return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center">
      <p className="text-base font-medium text-[#1E293B]">{t('partners.error.notFound')}</p>
      <p className="mt-1 text-sm text-[#475569]">{t('partners.error.notFoundSub')}</p>
      <button
        onClick={() => navigate('/settings/people')}
        className="mt-4 rounded-md bg-[#1E5DC4] px-4 py-2 text-sm text-white hover:bg-[#164399]"
      >
        {t('partners.backToList')}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/settings/people')}
          className="flex items-center gap-1 text-sm text-[#1E5DC4] hover:text-[#164399]"
        >
          <ChevronRight className="h-4 w-4" />
          {t('partners.backToList')}
        </button>
      </div>

      {/* Partner header card */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center
                          rounded-full bg-[#E8F0FB] text-xl font-medium text-[#1E5DC4]">
            {person.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium leading-tight text-[#1E293B]">
              {person.name}
            </h1>
            {person.relation && (
              <p className="mt-0.5 text-sm text-[#475569]">{person.relation}</p>
            )}
            {person.notes && (
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">{person.notes}</p>
            )}
            <p className="mt-2 text-xs text-[#94A3B8]">
              {t('partners.header.memberSince')}:{' '}
              <span className="font-mono tabular-nums">
                {format(new Date(person.created_at), 'dd/MM/yyyy')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Statistics strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="font-mono tabular-nums text-2xl font-medium text-[#1E5DC4]">
            {portfolioMemberships.length}
          </p>
          <p className="mt-1 text-xs text-[#475569]">{t('partners.stats.portfolios')}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="font-mono tabular-nums text-2xl font-medium text-[#1A7D4F]">
            {propertyOwnerships.length}
          </p>
          <p className="mt-1 text-xs text-[#475569]">{t('partners.stats.properties')}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 text-center">
          <p className="font-mono tabular-nums text-2xl font-medium text-[#B45309]">
            {capitalCount}
          </p>
          <p className="mt-1 text-xs text-[#475569]">{t('partners.stats.capitalAccounts')}</p>
        </div>
      </div>

      {/* Portfolios section */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="border-b border-[#E2E8F0] px-4 py-3">
          <h2 className="text-base font-medium text-[#1E293B]">
            {t('partners.portfoliosSection.title')}
          </h2>
        </div>
        {portfoliosLoading ? (
          <TableSkeleton />
        ) : portfolioMemberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Wallet className="h-10 w-10 text-[#94A3B8]" />
            <p className="text-sm text-[#475569]">
              {t('partners.portfoliosSection.empty')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.name')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.type')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.share')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.joinedDate')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.balance')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.portfoliosSection.columns.shareValue')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioMemberships.map((pm) => (
                <TableRow key={pm.portfolios.id} className="text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                  <TableCell className="font-medium">{pm.portfolios.name}</TableCell>
                  <TableCell>
                    <span className="rounded bg-[#E8F0FB] px-2 py-0.5 text-xs text-[#1E5DC4]">
                      {t(`partners.portfoliosSection.types.${pm.portfolios.type}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums text-sm text-[#1E293B]">
                      {pm.share_numerator}/{pm.share_denominator}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-[#475569]">
                    {format(new Date(pm.joined_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {txLoading ? (
                      <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
                    ) : (() => {
                      const balance = portfolioBalanceMap.get(pm.portfolios.id) ?? 0;
                      return (
                        <span className={`font-mono tabular-nums text-sm ${signColor(balance)}`}>
                          {formatCurrency(balance, 'USD')}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {txLoading ? (
                      <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
                    ) : (() => {
                      const balance    = portfolioBalanceMap.get(pm.portfolios.id) ?? 0;
                      const shareValue = balance * (pm.share_numerator / pm.share_denominator);
                      return (
                        <span className={`font-mono tabular-nums text-sm ${signColor(shareValue)}`}>
                          {formatCurrency(shareValue, 'USD')}
                        </span>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Properties section */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="border-b border-[#E2E8F0] px-4 py-3">
          <h2 className="text-base font-medium text-[#1E293B]">
            {t('partners.propertiesSection.title')}
          </h2>
        </div>
        {propertiesLoading ? (
          <TableSkeleton />
        ) : propertyOwnerships.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Building2 className="h-10 w-10 text-[#94A3B8]" />
            <p className="text-sm text-[#475569]">
              {t('partners.propertiesSection.empty')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.name')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.type')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.location')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.share')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.ownershipBasis')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.estimatedValue')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('partners.propertiesSection.columns.shareValue')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertyOwnerships.map((po) => (
                <TableRow key={po.properties.id} className="text-sm text-[#1E293B] hover:bg-[#F8FAFC]">
                  <TableCell className="font-medium">{po.properties.name}</TableCell>
                  <TableCell>
                    <span className="rounded bg-[#E8F0FB] px-2 py-0.5 text-xs text-[#1E5DC4]">
                      {t(`partners.propertiesSection.types.${po.properties.type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {po.properties.location ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums text-sm text-[#1E293B]">
                      {po.share_numerator}/{po.share_denominator}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {po.ownership_basis}
                  </TableCell>
                  <TableCell>
                    {po.properties.estimated_value != null ? (
                      <span className="font-mono tabular-nums text-sm text-[#1E293B]">
                        {formatCurrency(po.properties.estimated_value, 'USD')}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {po.properties.estimated_value != null ? (
                      <span className="font-mono tabular-nums text-sm text-[#1E293B]">
                        {formatCurrency(
                          po.properties.estimated_value * (po.share_numerator / po.share_denominator),
                          'USD'
                        )}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Capital Summary stub */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1E293B]">
            {t('partners.stubs.capitalTitle')}
          </h2>
          <span className="rounded-md bg-[#FEF7EC] px-2 py-0.5 text-xs font-medium text-[#B45309]">
            {t('partners.stubs.comingSoon')}
          </span>
        </div>
      </div>

      {/* Withdrawals stub */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1E293B]">
            {t('partners.stubs.withdrawalsTitle')}
          </h2>
          <span className="rounded-md bg-[#FEF7EC] px-2 py-0.5 text-xs font-medium text-[#B45309]">
            {t('partners.stubs.comingSoon')}
          </span>
        </div>
      </div>

    </div>
  );
}
