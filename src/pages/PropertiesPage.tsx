import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { EditPropertyDialog } from '@/components/properties/EditPropertyDialog';
import { PropertyOwnersDialog } from '@/components/properties/PropertyOwnersDialog';
import { Plus, Pencil, Trash2, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabaseClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/currency';
import type { Property } from '@/types';

async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabaseClient
    .from('properties')
    .select(`
      id,
      name,
      type,
      location,
      purchase_date,
      estimated_value,
      status,
      property_owners(count)
    `)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:              row.id,
    name:            row.name,
    type:            row.type as Property['type'],
    location:        row.location,
    purchase_date:   row.purchase_date,
    estimated_value: row.estimated_value,
    status:          row.status as Property['status'],
    owners_count:    (row.property_owners as { count: number }[])[0]?.count ?? 0,
  }));
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

function PropertiesSkeleton() {
  return (
    <div aria-busy="true" className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
      <div className="flex h-10 items-center gap-4 bg-[#F1F5F9] px-4">
        <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-3 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-3 w-1/5 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-3 w-1/10 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-3 w-1/7 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="ms-auto h-3 w-16 animate-pulse rounded bg-[#E2E8F0]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-[#E2E8F0] px-4 py-3">
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-5 w-16 animate-pulse rounded-md bg-[#E2E8F0]" />
          <div className="h-3 w-1/5 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-5 w-14 animate-pulse rounded-md bg-[#E2E8F0]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="ms-auto flex gap-2">
            <div className="h-7 w-7 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-7 w-7 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-7 w-7 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PropertiesEmptyProps {
  onAdd: () => void;
}

function PropertiesEmpty({ onAdd }: PropertiesEmptyProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Building2 className="h-12 w-12 text-[#94A3B8]" />
      <p className="text-base font-medium text-[#1E293B]">
        {t('properties.empty.title')}
      </p>
      <p className="text-sm text-[#475569]">
        {t('properties.empty.subtitle')}
      </p>
      <Button
        className="mt-2 bg-[#1E5DC4] text-white hover:bg-[#164399]"
        onClick={onAdd}
      >
        <Plus className="me-2 h-4 w-4" />
        {t('properties.addProperty')}
      </Button>
    </div>
  );
}

interface PropertiesErrorProps {
  onRetry: () => void;
}

function PropertiesError({ onRetry }: PropertiesErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm font-medium text-[#C0392B]">
        {t('properties.error.title')}
      </p>
      <Button
        variant="outline"
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
        onClick={onRetry}
      >
        {t('properties.error.retry')}
      </Button>
    </div>
  );
}

export function PropertiesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [ownersTarget, setOwnersTarget] =
    useState<{ id: string; name: string } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [deletePropertyName, setDeletePropertyName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: properties = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['properties'],
    queryFn:  fetchProperties,
    staleTime: 60_000,
  });

  const handleDeleteConfirm = async () => {
    if (!deletePropertyId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabaseClient
        .from('properties')
        .delete()
        .eq('id', deletePropertyId);
      if (error) {
        toast.error(t('properties.toast.deleteError'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(t('properties.toast.deleteSuccess'));
      setDeletePropertyId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('properties.pageTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#475569]">
            {t('properties.pageSubtitle')}
          </p>
        </div>
        <Button
          className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="me-2 h-4 w-4" />
          {t('properties.addProperty')}
        </Button>
      </div>

      {isLoading ? (
        <PropertiesSkeleton />
      ) : isError ? (
        <PropertiesError onRetry={refetch} />
      ) : properties.length === 0 ? (
        <PropertiesEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <div
          role="region"
          aria-label={t('properties.pageTitle')}
          className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.name')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.type')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.location')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.status')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.estimatedValue')}
                </TableHead>
                <TableHead className="text-start text-xs font-medium text-[#475569]">
                  {t('properties.columns.owners')}
                </TableHead>
                <TableHead className="text-end text-xs font-medium text-[#475569]">
                  {t('properties.columns.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow
                  key={property.id}
                  className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                >
                  <TableCell>
                    <Link
                      to={`/properties/${property.id}`}
                      className="text-sm font-medium text-[#1E5DC4] hover:text-[#164399] hover:underline"
                    >
                      {property.name}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClass(property.type)}`}
                    >
                      {t(`properties.types.${property.type}`)}
                    </span>
                  </TableCell>

                  <TableCell>
                    {property.location ? (
                      <span
                        className="block max-w-[180px] truncate text-sm text-[#475569]"
                        title={property.location}
                      >
                        {property.location}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(property.status)}`}
                    >
                      {t(`properties.status.${property.status}`)}
                    </span>
                  </TableCell>

                  <TableCell className="font-mono tabular-nums text-sm text-[#1E293B]">
                    {property.estimated_value != null
                      ? formatCurrency(property.estimated_value, 'USD')
                      : <span className="text-[#94A3B8]">—</span>
                    }
                  </TableCell>

                  <TableCell className="font-mono tabular-nums text-sm text-[#475569]">
                    {property.owners_count > 0
                      ? `${property.owners_count} ${t('properties.ownerSuffix')}`
                      : <span className="text-[#94A3B8]">—</span>
                    }
                  </TableCell>

                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedProperty(property)}
                        title={t('properties.actions.edit')}
                        className="rounded p-1.5 text-[#1E5DC4] hover:bg-[#E8F0FB]"
                        aria-label={t('properties.actions.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setOwnersTarget({ id: property.id, name: property.name })}
                        title={t('properties.owners.dialogTitle')}
                        className="rounded p-1.5 text-[#1A7D4F] hover:bg-[#EBF5F0]"
                        aria-label={t('properties.actions.owners')}
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletePropertyId(property.id);
                          setDeletePropertyName(property.name);
                        }}
                        title={t('properties.actions.delete')}
                        className="rounded p-1.5 text-[#C0392B] hover:bg-[#FDECEA]"
                        aria-label={t('properties.actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AddPropertyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditPropertyDialog
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
      <PropertyOwnersDialog
        open={!!ownersTarget}
        onOpenChange={(o) => { if (!o) setOwnersTarget(null); }}
        propertyId={ownersTarget?.id ?? ''}
        propertyName={ownersTarget?.name ?? ''}
      />
      <AlertDialog
        open={!!deletePropertyId}
        onOpenChange={(open) => { if (!open) setDeletePropertyId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('properties.delete.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('properties.delete.confirmDescription', { name: deletePropertyName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeletePropertyId(null)}
            >
              {t('properties.delete.cancelButton')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-[#C0392B] hover:bg-[#922B21] text-white focus-visible:ring-[#C0392B]"
              onClick={handleDeleteConfirm}
            >
              {t('properties.delete.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PropertiesPage;
