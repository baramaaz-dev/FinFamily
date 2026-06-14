import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }                       from 'sonner';
import { useTranslation }              from 'react-i18next';
import { postJournalEntry }            from '@/lib/supabase/journalPosting';

export function usePostSingleEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (entryId: string) => postJournalEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries-pending'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success(t('journalReview.post.successSingle'));
    },
    onError: (error: Error) => {
      if (error.message === 'NO_OPEN_PERIOD') {
        toast.error(t('journalReview.post.errorNoPeriod'));
      } else if (error.message === 'ALREADY_POSTED') {
        toast.error(t('journalReview.post.errorAlreadyPosted'));
        queryClient.invalidateQueries({ queryKey: ['journal-entries-pending'] });
      } else {
        toast.error(t('journalReview.post.errorGeneric'));
      }
    },
  });
}

export async function postEntriesBulk(
  entryIds: string[],
  onProgress: (current: number, total: number) => void
): Promise<{ posted: number; failed: string | null }> {
  let posted = 0;
  for (let i = 0; i < entryIds.length; i++) {
    onProgress(i + 1, entryIds.length);
    try {
      await postJournalEntry(entryIds[i]);
      posted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { posted, failed: `${entryIds[i].slice(0, 8)}: ${msg}` };
    }
  }
  return { posted, failed: null };
}
