import { useQuery } from '@tanstack/react-query';
import { getProfitLossGL, getPartnersEquityGL, getBalanceSheetGL } from '@/lib/supabase/reportsGL';

export function useProfitLossGL(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports-gl-pl', dateFrom, dateTo],
    queryFn:  () => getProfitLossGL(dateFrom, dateTo),
    staleTime: 30_000,
    enabled:  Boolean(dateFrom && dateTo),
  });
}

export function usePartnersEquityGL(asOfDate: string) {
  return useQuery({
    queryKey: ['reports-gl-equity', asOfDate],
    queryFn:  () => getPartnersEquityGL(asOfDate),
    staleTime: 30_000,
    enabled:  Boolean(asOfDate),
  });
}

export function useBalanceSheetGL(asOfDate: string) {
  return useQuery({
    queryKey: ['reports-gl-bs', asOfDate],
    queryFn:  () => getBalanceSheetGL(asOfDate),
    staleTime: 30_000,
    enabled:  Boolean(asOfDate),
  });
}
