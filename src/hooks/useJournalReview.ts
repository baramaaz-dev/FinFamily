import { useQuery }                     from '@tanstack/react-query';
import { getPendingJournalEntries }     from '@/lib/supabase/journalReview';

export const PENDING_ENTRIES_KEY = ['journal-entries-pending'] as const;

export function usePendingJournalEntries() {
  return useQuery({
    queryKey: PENDING_ENTRIES_KEY,
    queryFn:  getPendingJournalEntries,
    staleTime: 0,
  });
}
