import { useQuery }                                        from '@tanstack/react-query';
import { getPendingJournalEntries, getPostedJournalEntries } from '@/lib/supabase/journalReview';

export const PENDING_ENTRIES_KEY = ['journal-entries-pending'] as const;

export function usePendingJournalEntries() {
  return useQuery({
    queryKey: PENDING_ENTRIES_KEY,
    queryFn:  getPendingJournalEntries,
    staleTime: 0,
  });
}

export const POSTED_ENTRIES_KEY = ['journal-entries-posted'] as const;

export function usePostedJournalEntries() {
  return useQuery({
    queryKey: POSTED_ENTRIES_KEY,
    queryFn:  getPostedJournalEntries,
    staleTime: 60_000,
  });
}
