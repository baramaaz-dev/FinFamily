import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plus, PlusCircle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import { AddLeaseDialog } from '@/components/properties/AddLeaseDialog';
import { RecordLeasePaymentDialog } from '@/components/properties/RecordLeasePaymentDialog';
import { AddPropertyExpenseDialog } from '@/components/properties/AddPropertyExpenseDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Property } from '@/types';

interface OwnerRow {
  person_id:         string;
  share_numerator:   number;
  share_denominator: number;
  ownership_basis:   string;
  people: { id: string; name: string; relation: string | null } | null;
}

interface LeaseRow {
  id:          string;
  property_id: string;
  tenant_name: string;
  rent_amount: number;
  currency:    'USD' | 'SYP';
  frequency:   'monthly' | 'annual';
  start_date:  string;
  end_date:    string | null;
}

interface LeasePaymentRow {
  id:            string;
  lease_id:      string;
  amount:        number;
  currency:      'USD' | 'SYP';
  exchange_rate: number | null;
  paid_date:     string;
  notes:         string | null;
}

function typeBadgeClass(type: Property['type']): string {
  const map: Record<Property['type'], string> = {
    residential: 'text-[#1A7D4F] bg-[#EBF5F0]',
    commercial:  'text-[#1E5DC4] bg-[#E8F0FB]',
    land:        'text-[#B45309] bg-[#FEF7EC]',
  };
  return map[type];
}

function statusBadgeClass(status: Property['status']): string {
  const map: Record<Property['status'], string> = {
    rented: 'text-[#1A7D4F] bg-[#EBF5F0]',
    vacant: 'text-[#B45309] bg-[#FEF7EC]',
  };
  return map[status];
}

function leaseStatusInfo(lease: LeaseRow): {
  key:   'properties.leases.list.statusActive' | 'properties.leases.list.statusFuture' | 'properties.leases.list.statusExpired';
  class: string;
} {
  const today = new Date().toISOString().split('T')[0];
  if (lease.start_date > today)
    return { key: 'properties.leases.list.statusFuture',  class: 'text-[#1E5DC4] bg-[#E8F0FB]' };
  if (lease.end_date && lease.end_date < today)
    return { key: 'properties.leases.list.statusExpired', class: 'text-[#B45309] bg-[#FEF7EC]' };
  return   { key: 'properties.leases.list.statusActive',  class: 'text-[#1A7D4F] bg-[#EBF5F0]' };
}

export default function PropertyOwnershipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [leaseDialogOpen, setLeaseDialogOpen] = useState<boolean>(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState<boolean>(false);
  const [paymentTarget, setPaymentTarget] = useState<LeaseRow | null>(null);

  const {
    data: property,
    isLoading: propertyLoading,
    isError: propertyError,
    refetch: refetchProperty,
  } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('properties')
        .select('id, name, type, status, location, purchase_date, estimated_value')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data as Property;
    },
    enabled: !!id,
  });

  const { data: owners = [], isLoading: ownersLoading } = useQuery({
    queryKey: ['property_owners', id],
    queryFn: async (): Promise<OwnerRow[]> => {
      const { data, error } = await supabaseClient
        .from('property_owners')
        .select('person_id, share_numerator, share_denominator, ownership_basis, people(id, name, relation)')
        .eq('property_id', id as string);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        person_id:         row.person_id,
        share_numerator:   row.share_numerator,
        share_denominator: row.share_denominator,
        ownership_basis:   row.ownership_basis,
        people:            (row.people as unknown as { id: string; name: string; relation: string | null } | null),
      }));
    },
    enabled: !!id,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases', id],
    queryFn: async (): Promise<LeaseRow[]> => {
      const { data, error } = await supabaseClient
        .from('leases')
        .select('id, property_id, tenant_name, rent_amount, currency, frequency, start_date, end_date')
        .eq('property_id', id as string)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeaseRow[];
    },
    enabled: !!id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['lease_payments', id],
    queryFn: async (): Promise<LeasePaymentRow[]> => {
      const { data: leasesData } = await supabaseClient
        .from('leases')
        .select('id')
        .eq('property_id', id as string);
      const leaseIds = (leasesData ?? []).map((l) => l.id);
      if (leaseIds.length === 0) return [];
      const { data, error } = await supabaseClient
        .from('lease_payments')
        .select('id, lease_id, amount, currency, exchange_rate, paid_date, notes')
        .in('lease_id', leaseIds)
        .order('paid_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeasePaymentRow[];
    },
    enabled: !!id,
  });

  const leaseMap = new Map(leases.map((l) => [l.id, l]));

  const totalShare   = owners.reduce(
    (sum, o) => sum + o.share_numerator / o.share_denominator,
    0
  );
  const totalPercent = (totalShare * 100).toFixed(2);
  const isComplete   = Math.abs(totalShare - 1) < 0.000001;
  const isExceeding  = totalShare > 1 + 0.000001;

  return (
    <div className="space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate('/properties')}
        className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1E293B] transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        {t('properties.statement.backToProperties')}
      </button>

      {/* Page title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('properties.statement.pageTitle')}
          </h1>
          {property && (
            <p className="mt-0.5 text-sm text-[#475569]">{property.name}</p>
          )}
        </div>
        {property && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setExpenseDialogOpen(true)}
              className="border-[#C0392B] text-[#C0392B] hover:bg-[#FEF0EF]"
            >
              <Plus className="h-4 w-4 me-2" />
              {t('properties.expenses.form.addExpenseButton')}
            </Button>
            <Button
              onClick={() => setLeaseDialogOpen(true)}
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
            >
              <Plus className="h-4 w-4 me-2" />
              {t('properties.leases.form.addLeaseButton')}
            </Button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {(propertyLoading || ownersLoading) && (
        <div className="space-y-3">
          <div className="animate-pulse bg-[#E2E8F0] rounded-lg h-36 w-full" />
          <div className="animate-pulse bg-[#E2E8F0] rounded-lg h-48 w-full" />
        </div>
      )}

      {/* Error state */}
      {propertyError && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-center space-y-3">
          <p className="text-sm font-medium text-[#C0392B]">
            {t('properties.statement.errorLoading')}
          </p>
          <Button
            variant="outline"
            className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
            onClick={() => refetchProperty()}
          >
            {t('properties.statement.retryButton')}
          </Button>
        </div>
      )}

      {/* Not found */}
      {!propertyLoading && !property && !propertyError && (
        <p className="text-sm text-[#475569]">
          {t('properties.statement.propertyNotFound')}
        </p>
      )}

      {/* Property info card */}
      {property && !propertyLoading && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
          <h2 className="text-base font-medium text-[#1E293B]">
            {t('properties.statement.propertyInfoTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">

            <div>
              <p className="text-[#475569]">{t('properties.columns.name')}</p>
              <p className="font-medium text-[#1E293B] mt-0.5">{property.name}</p>
            </div>

            <div>
              <p className="text-[#475569]">{t('properties.columns.type')}</p>
              <div className="mt-0.5">
                <span className={[
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                  typeBadgeClass(property.type),
                ].join(' ')}>
                  {t(`properties.types.${property.type}`)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[#475569]">{t('properties.columns.status')}</p>
              <div className="mt-0.5">
                <span className={[
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                  statusBadgeClass(property.status),
                ].join(' ')}>
                  {t(`properties.status.${property.status}`)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[#475569]">{t('properties.columns.location')}</p>
              <p className="text-[#1E293B] mt-0.5">{property.location ?? '—'}</p>
            </div>

            <div>
              <p className="text-[#475569]">{t('properties.form.purchaseDateLabel')}</p>
              <p className="text-[#1E293B] font-mono tabular-nums mt-0.5">
                {property.purchase_date ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-[#475569]">{t('properties.columns.estimatedValue')}</p>
              <p className="text-[#1E293B] font-mono tabular-nums mt-0.5">
                {property.estimated_value
                  ? formatCurrency(property.estimated_value, 'USD')
                  : '—'}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Ownership statement */}
      {property && !propertyLoading && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">

          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <h2 className="text-base font-medium text-[#1E293B]">
              {t('properties.statement.ownershipTitle')}
            </h2>
          </div>

          {owners.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-8">
              {t('properties.statement.noOwners')}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                    {(['columnOwner', 'columnRelation', 'columnShare',
                       'columnPercent', 'columnBasis'] as const).map((col) => (
                      <TableHead
                        key={col}
                        className="text-start text-xs font-medium text-[#475569]"
                      >
                        {t(`properties.statement.${col}`)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.map((owner) => {
                    const pct = (
                      (owner.share_numerator / owner.share_denominator) * 100
                    ).toFixed(2);
                    return (
                      <TableRow
                        key={owner.person_id}
                        className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                      >
                        <TableCell className="font-medium">
                          {owner.people?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-[#475569]">
                          {owner.people?.relation ?? '—'}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {owner.share_numerator}/{owner.share_denominator}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {pct}%
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-[#1E5DC4] bg-[#E8F0FB]">
                            {owner.ownership_basis}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Total indicator */}
              <div className={[
                'flex items-center justify-between px-4 py-2.5',
                'border-t border-[#E2E8F0] text-sm font-medium',
                isComplete
                  ? 'bg-[#EBF5F0] text-[#1A7D4F]'
                  : isExceeding
                    ? 'bg-[#FEF0EF] text-[#C0392B]'
                    : 'bg-[#F1F5F9] text-[#475569]',
              ].join(' ')}>
                <span>{t('properties.statement.totalLabel')}</span>
                <span className="font-mono tabular-nums">
                  {isComplete
                    ? t('properties.statement.totalComplete')
                    : isExceeding
                      ? t('properties.statement.totalExceeds')
                      : `${totalPercent}%`}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Leases list */}
      {property && !propertyLoading && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <h2 className="text-base font-medium text-[#1E293B]">
              {t('properties.leases.list.sectionTitle')}
            </h2>
          </div>

          {leases.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-8">
              {t('properties.leases.list.noLeases')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  {(['columnTenant', 'columnRent', 'columnFrequency',
                    'columnPeriod', 'columnStatus'] as const).map((col) => (
                    <TableHead
                      key={col}
                      className="text-start text-xs font-medium text-[#475569]"
                    >
                      {t(`properties.leases.list.${col}`)}
                    </TableHead>
                  ))}
                  <TableHead className="text-end text-xs font-medium text-[#475569]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => {
                  const status = leaseStatusInfo(lease);
                  return (
                    <TableRow
                      key={lease.id}
                      className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                    >
                      <TableCell className="font-medium">{lease.tenant_name}</TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {formatCurrency(lease.rent_amount, lease.currency)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-[#475569] bg-[#F1F5F9]">
                          {t(`properties.leases.form.frequency${
                            lease.frequency === 'monthly' ? 'Monthly' : 'Annual'
                          }`)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-[#475569] text-xs">
                        {lease.start_date} — {lease.end_date ?? t('properties.leases.list.openEnded')}
                      </TableCell>
                      <TableCell>
                        <span className={[
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          status.class,
                        ].join(' ')}>
                          {t(status.key)}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <button
                          type="button"
                          onClick={() => setPaymentTarget(lease)}
                          title={t('properties.leases.list.addPaymentTooltip')}
                          className="text-[#1A7D4F] hover:text-[#126038] transition-colors"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Payments log */}
      {property && !propertyLoading && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <h2 className="text-base font-medium text-[#1E293B]">
              {t('properties.leases.payments.sectionTitle')}
            </h2>
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-8">
              {t('properties.leases.payments.noPayments')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  {(['columnDate', 'columnTenant', 'columnAmount',
                    'columnCurrency', 'columnRate', 'columnNotes'] as const).map((col) => (
                    <TableHead
                      key={col}
                      className="text-start text-xs font-medium text-[#475569]"
                    >
                      {t(`properties.leases.payments.${col}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                  >
                    <TableCell className="font-mono tabular-nums">
                      {payment.paid_date}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      {leaseMap.get(payment.lease_id)?.tenant_name ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      {payment.currency}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-[#475569]">
                      {payment.currency === 'SYP' && payment.exchange_rate != null
                        ? payment.exchange_rate.toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell
                      className="text-[#475569] max-w-[180px] truncate"
                      title={payment.notes ?? ''}
                    >
                      {payment.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {property && (
        <AddLeaseDialog
          open={leaseDialogOpen}
          onOpenChange={setLeaseDialogOpen}
          propertyId={id ?? ''}
          propertyName={property.name}
        />
      )}

      {paymentTarget && (
        <RecordLeasePaymentDialog
          open={!!paymentTarget}
          onOpenChange={(o) => { if (!o) setPaymentTarget(null); }}
          lease={paymentTarget}
          propertyId={id ?? ''}
        />
      )}

      {property && (
        <AddPropertyExpenseDialog
          open={expenseDialogOpen}
          onOpenChange={setExpenseDialogOpen}
          propertyId={id ?? ''}
          propertyName={property.name}
        />
      )}

    </div>
  );
}
