import { supabaseClient } from '@/lib/supabase';

export async function postJournalEntry(entryId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: period, error: periodError } = await supabaseClient
    .from('accounting_periods')
    .select('id, status')
    .eq('status', 'open')
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();

  if (periodError) throw periodError;
  if (!period) throw new Error('NO_OPEN_PERIOD');

  const { data: entry, error: fetchError } = await supabaseClient
    .from('journal_entries')
    .select('id, status')
    .eq('id', entryId)
    .single();

  if (fetchError) throw fetchError;
  if (!entry) throw new Error('ENTRY_NOT_FOUND');
  if (entry.status !== 'draft') throw new Error('ALREADY_POSTED');

  const { error: updateError } = await supabaseClient
    .from('journal_entries')
    .update({ status: 'posted' })
    .eq('id', entryId)
    .eq('status', 'draft');

  if (updateError) throw updateError;
}
