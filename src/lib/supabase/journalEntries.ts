import { supabaseClient }              from '@/lib/supabase';
import type { AccountingPeriod, JournalEntry, JournalEntryLine } from '@/types';
import type { CreateJournalEntryPayload, JournalEntryWithLines } from '@/types/journalEntry';

export async function findOpenPeriod(entryDate: string): Promise<AccountingPeriod | null> {
  const { data, error } = await supabaseClient
    .from('accounting_periods')
    .select('*')
    .eq('status', 'open')
    .lte('start_date', entryDate)
    .gte('end_date', entryDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getManualJournalEntries(): Promise<JournalEntryWithLines[]> {
  const { data: entries, error: entryErr } = await supabaseClient
    .from('journal_entries')
    .select('*')
    .eq('source_type', 'manual')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (entryErr) throw entryErr;
  if (!entries || entries.length === 0) return [];

  const ids = entries.map(e => e.id);
  const { data: lines, error: lineErr } = await supabaseClient
    .from('journal_entry_lines')
    .select('*')
    .in('journal_entry_id', ids);
  if (lineErr) throw lineErr;

  const lineMap = new Map<string, JournalEntryLine[]>();
  (lines ?? []).forEach(l => {
    if (!lineMap.has(l.journal_entry_id)) lineMap.set(l.journal_entry_id, []);
    lineMap.get(l.journal_entry_id)!.push(l as JournalEntryLine);
  });

  return entries.map(e => ({
    ...(e as JournalEntry),
    lines: lineMap.get(e.id) ?? [],
  }));
}

export async function createJournalEntry(payload: CreateJournalEntryPayload): Promise<JournalEntry> {
  const { data: header, error: headerErr } = await supabaseClient
    .from('journal_entries')
    .insert({
      period_id:    payload.period_id,
      entry_date:   payload.entry_date,
      reference_no: payload.reference_no,
      description:  payload.description,
      source_type:  'manual',
      source_id:    null,
      status:       'draft',
    })
    .select()
    .single();
  if (headerErr) throw headerErr;

  const lineRows = payload.lines.map(l => ({
    journal_entry_id: header.id,
    account_id:       l.account_id,
    debit_amount:     l.debit_amount,
    credit_amount:    l.credit_amount,
    currency:         l.currency,
    exchange_rate:    l.exchange_rate,
    description:      l.description,
  }));

  const { error: linesErr } = await supabaseClient
    .from('journal_entry_lines')
    .insert(lineRows);

  if (linesErr) {
    await supabaseClient.from('journal_entries').delete().eq('id', header.id);
    throw linesErr;
  }

  return header as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('journal_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
