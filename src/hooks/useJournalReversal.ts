import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }                       from 'sonner';
import { useTranslation }              from 'react-i18next';
import { reverseJournalEntry }         from '@/lib/supabase/journalReversal';
import { POSTED_ENTRIES_KEY, PENDING_ENTRIES_KEY } from '@/hooks/useJournalReview';

export function useReverseJournalEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) =>
      reverseJournalEntry(entryId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTED_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: PENDING_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success(t('journalReview.reversal.successToast'));
    },
    onError: (error: Error) => {
      if (error.message === 'ALREADY_REVERSED') {
        toast.error(t('journalReview.reversal.errorAlreadyReversed'));
        queryClient.invalidateQueries({ queryKey: POSTED_ENTRIES_KEY });
      } else if (error.message === 'NOT_POSTED') {
        toast.error(t('journalReview.reversal.errorNotPosted'));
      } else if (error.message.includes('NO_OPEN_PERIOD')) {
        toast.error(t('journalReview.post.errorNoPeriod'));
      } else {
        toast.error(t('journalReview.reversal.errorGeneric'));
      }
    },
  });
}
