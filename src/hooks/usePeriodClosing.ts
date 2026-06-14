import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }                       from 'sonner';
import { useTranslation }              from 'react-i18next';
import {
  closePeriod, reopenPeriod, lockPeriod,
  getPendingDraftCount, hasOtherOpenPeriod,
} from '@/lib/supabase/periodClosing';

const PERIODS_KEY = ['accounting-periods'] as const;

export function useClosePeriod() {
  const queryClient = useQueryClient();
  const { t }       = useTranslation();
  return useMutation({
    mutationFn: (periodId: string) => closePeriod(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success(t('periodClosing.closeSuccess'));
    },
    onError: () => toast.error(t('periodClosing.closeError')),
  });
}

export function useReopenPeriod() {
  const queryClient = useQueryClient();
  const { t }       = useTranslation();
  return useMutation({
    mutationFn: (periodId: string) => reopenPeriod(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODS_KEY });
      toast.success(t('periodClosing.reopenSuccess'));
    },
    onError: () => toast.error(t('periodClosing.reopenError')),
  });
}

export function useLockPeriod() {
  const queryClient = useQueryClient();
  const { t }       = useTranslation();
  return useMutation({
    mutationFn: (args: {
      periodId:   string;
      periodName: string;
      startDate:  string;
      endDate:    string;
    }) => lockPeriod(args.periodId, args.periodName, args.startDate, args.endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODS_KEY });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success(t('periodClosing.lockSuccess'));
    },
    onError: (error: Error) => {
      if (error.message === 'RETAINED_EARNINGS_ACCOUNT_NOT_FOUND') {
        toast.error(t('periodClosing.lockErrorNoRetainedEarnings'));
      } else {
        toast.error(t('periodClosing.lockError'));
      }
    },
  });
}

export { getPendingDraftCount, hasOtherOpenPeriod };
