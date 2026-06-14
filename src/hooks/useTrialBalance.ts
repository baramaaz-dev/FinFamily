import { useQuery }        from '@tanstack/react-query';
import { getTrialBalance } from '@/lib/supabase/trialBalance';

export function useTrialBalance(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['trial-balance', dateFrom, dateTo],
    queryFn:  () => getTrialBalance(dateFrom, dateTo),
    staleTime: 30_000,
    enabled:   Boolean(dateFrom && dateTo),
  });
}
