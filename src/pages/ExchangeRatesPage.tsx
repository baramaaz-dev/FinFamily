import { useState }            from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation }      from 'react-i18next';
import { TrendingUp }          from 'lucide-react';
import { toast }               from 'sonner';
import AddExchangeRateDialog   from '@/components/exchange-rates/AddExchangeRateDialog';
import EditExchangeRateDialog  from '@/components/exchange-rates/EditExchangeRateDialog';
import { Button }              from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabaseClient }      from '@/lib/supabase';
import type { ExchangeRate }   from '@/types';

async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const { data, error } = await supabaseClient
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExchangeRate[];
}

function ExchangeRatesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[#E2E8F0] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[#E2E8F0] rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-[#E2E8F0] rounded animate-pulse" />
      </div>
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-[#E2E8F0] rounded animate-pulse" />
              <div className="h-4 bg-[#E2E8F0] rounded animate-pulse" />
              <div className="h-4 bg-[#E2E8F0] rounded animate-pulse" />
              <div className="h-4 bg-[#E2E8F0] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExchangeRatesEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <TrendingUp size={48} color="#94A3B8" />
      <p className="text-[#1E293B] font-medium">{t('exchangeRates.empty.title')}</p>
      <p className="text-[#475569] text-sm">{t('exchangeRates.empty.subtitle')}</p>
      <Button
        onClick={onAdd}
        className="bg-[#1E5DC4] text-white"
      >
        {t('exchangeRates.addRate')}
      </Button>
    </div>
  );
}

function ExchangeRatesError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <TrendingUp size={48} color="#94A3B8" />
      <p className="text-[#1E293B] font-medium">{t('exchangeRates.error.title')}</p>
      <Button variant="outline" onClick={onRetry}>
        {t('exchangeRates.error.retry')}
      </Button>
    </div>
  );
}

export default function ExchangeRatesPage() {
  const { t } = useTranslation();

  const { data: rates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn:  fetchExchangeRates,
    staleTime: 30_000,
  });

  const [dialogOpen, setDialogOpen]   = useState(false);
  const queryClient                    = useQueryClient();
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  async function handleDeleteConfirm() {
    if (!deleteRateId) return;
    setIsDeleting(true);
    const { error } = await supabaseClient
      .from('exchange_rates')
      .delete()
      .eq('id', deleteRateId);
    if (error) {
      toast.error(t('exchangeRates.toast.deleteError'));
      setIsDeleting(false);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    await queryClient.invalidateQueries({ queryKey: ['latest-exchange-rate'] });
    toast.success(t('exchangeRates.toast.deleteSuccess'));
    setDeleteRateId(null);
    setIsDeleting(false);
  }

  if (isLoading) return <ExchangeRatesSkeleton />;
  if (isError)   return <ExchangeRatesError onRetry={refetch} />;
  if (rates.length === 0) return (
    <>
      <ExchangeRatesEmpty onAdd={() => setDialogOpen(true)} />
      <AddExchangeRateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#0F172A]">
            {t('exchangeRates.pageTitle')}
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            {t('exchangeRates.pageSubtitle')}
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
        >
          {t('exchangeRates.addRate')}
        </Button>
      </div>

      {/* Rates table */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead>{t('exchangeRates.columns.date')}</TableHead>
              <TableHead>{t('exchangeRates.columns.rate')}</TableHead>
              <TableHead>{t('exchangeRates.columns.notes')}</TableHead>
              <TableHead className="w-24">
                {t('exchangeRates.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate, index) => (
              <TableRow key={rate.id} className="hover:bg-[#F8FAFC]">

                {/* Date */}
                <TableCell className="text-sm text-[#1E293B]">
                  {new Date(rate.date).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </TableCell>

                {/* Rate — with latest badge on first row */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-sm font-medium text-[#1E293B]">
                      {Number(rate.rate).toLocaleString('ar-SA')}
                      {' '}
                      {t('exchangeRates.rateUnit')}
                    </span>
                    {index === 0 && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-[#EBF5F0] text-[#1A7D4F]">
                        {t('exchangeRates.latestBadge')}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Notes */}
                <TableCell className="text-sm text-[#475569]">
                  {rate.notes ?? '—'}
                </TableCell>

                {/* Actions — disabled stubs */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRate(rate)}
                      className="text-[#475569]"
                    >
                      {t('exchangeRates.actions.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteRateId(rate.id)}
                      className="text-[#C0392B]"
                    >
                      {t('exchangeRates.actions.delete')}
                    </Button>
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddExchangeRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <EditExchangeRateDialog
        exchangeRate={selectedRate}
        onOpenChange={(open) => { if (!open) setSelectedRate(null); }}
      />

      <AlertDialog
        open={deleteRateId !== null}
        onOpenChange={(open) => { if (!open && !isDeleting) setDeleteRateId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0F172A]">
              {t('exchangeRates.dialog.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#475569]">
              {t('exchangeRates.dialog.deleteDescription').replace(
                '{rate}',
                (() => {
                  const found = rates.find(r => r.id === deleteRateId);
                  return found
                    ? `${Number(found.rate).toLocaleString('ar-SA')} ${t('exchangeRates.rateUnit')}`
                    : '';
                })()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-[#E2E8F0] text-[#475569]"
            >
              {t('exchangeRates.dialog.deleteCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-[#C0392B] hover:bg-[#922B21] text-white"
            >
              {t('exchangeRates.dialog.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
