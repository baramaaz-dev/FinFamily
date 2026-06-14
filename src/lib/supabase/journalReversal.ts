import { supabaseClient } from '@/lib/supabase';

export async function reverseJournalEntry(
  originalId: string,
  reason: string
): Promise<void> {
  // Step 1: Fetch original entry header
  const { data: original, error: origError } = await supabaseClient
    .from('journal_entries')
    .select('id, status, source_type')
    .eq('id', originalId)
    .single();

  if (origError) throw origError;
  if (!original) throw new Error('ENTRY_NOT_FOUND');
  if (original.status !== 'posted') throw new Error('NOT_POSTED');

  const { data: originalLines, error: linesError } = await supabaseClient
    .from('journal_entry_lines')
    .select('account_id, debit_amount, credit_amount, description, currency, exchange_rate')
    .eq('journal_entry_id', originalId);

  if (linesError) throw linesError;
  if (!originalLines || originalLines.length === 0) throw new Error('NO_LINES');

  // Step 2: Guard — entry must not already be reversed
  const { data: existingReversal } = await supabaseClient
    .from('journal_entries')
    .select('id')
    .eq('source_type', 'reversal')
    .eq('source_id', originalId)
    .maybeSingle();

  if (existingReversal) throw new Error('ALREADY_REVERSED');

  // Step 3: Insert reversal header (posted immediately — CFO is authorizer)
  const { data: reversalEntry, error: headerError } = await supabaseClient
    .from('journal_entries')
    .insert({
      source_type:  'reversal',
      source_id:    originalId,
      status:       'posted',
      description:  reason,
    })
    .select('id')
    .single();

  if (headerError) throw headerError;
  if (!reversalEntry) throw new Error('INSERT_FAILED');

  // Step 4: Insert reversed lines (debit ↔ credit swapped)
  const reversalLines = originalLines.map(line => ({
    journal_entry_id: reversalEntry.id,
    account_id:       line.account_id,
    debit_amount:     line.credit_amount,
    credit_amount:    line.debit_amount,
    description:      `عكس: ${line.description ?? ''}`.trim(),
    currency:         line.currency,
    exchange_rate:    line.exchange_rate,
  }));

  const { error: linesInsertError } = await supabaseClient
    .from('journal_entry_lines')
    .insert(reversalLines);

  if (linesInsertError) {
    await supabaseClient.from('journal_entries').delete().eq('id', reversalEntry.id);
    throw linesInsertError;
  }

  // Step 5: Mark original as reversed (race-condition guard)
  const { error: updateError } = await supabaseClient
    .from('journal_entries')
    .update({ status: 'reversed' })
    .eq('id', originalId)
    .eq('status', 'posted');

  if (updateError) {
    await supabaseClient.from('journal_entry_lines').delete().eq('journal_entry_id', reversalEntry.id);
    await supabaseClient.from('journal_entries').delete().eq('id', reversalEntry.id);
    throw updateError;
  }
}
