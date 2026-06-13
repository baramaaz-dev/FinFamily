import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getManualJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
} from '@/lib/supabase/journalEntries';
import type { CreateJournalEntryPayload } from '@/types/journalEntry';

const MANUAL_ENTRIES_KEY = ['journal-entries-manual'] as const;

export function useManualJournalEntries() {
  return useQuery({
    queryKey: MANUAL_ENTRIES_KEY,
    queryFn:  getManualJournalEntries,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => createJournalEntry(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: MANUAL_ENTRIES_KEY }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: MANUAL_ENTRIES_KEY }),
  });
}
