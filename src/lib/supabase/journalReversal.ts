import { supabaseClient } from '@/lib/supabase';

export async function reverseJournalEntry(
  originalId: string,
  reason: string
): Promise<void> {
  const { error } = await supabaseClient.rpc('reverse_journal_entry', {
    p_original_id: originalId,
    p_reason:      reason,
  });

  if (error) throw new Error(error.message);
}
