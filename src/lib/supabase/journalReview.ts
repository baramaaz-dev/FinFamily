import { supabaseClient }                  from '@/lib/supabase';
import type { PendingJournalEntry, PendingJournalLine } from '@/types/journalReview';

export async function getPendingJournalEntries(): Promise<PendingJournalEntry[]> {
  // Step 1: fetch all draft journal entries
  const { data: entries, error: entryErr } = await supabaseClient
    .from('journal_entries')
    .select('id, source_type, source_id, status, entry_date, reference_no, description, created_at')
    .eq('status', 'draft')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (entryErr) throw entryErr;
  if (!entries || entries.length === 0) return [];

  // Step 2: fetch lines for those entries
  const entryIds = entries.map(e => e.id);
  const { data: lines, error: lineErr } = await supabaseClient
    .from('journal_entry_lines')
    .select('id, journal_entry_id, account_id, debit_amount, credit_amount, currency, exchange_rate, description')
    .in('journal_entry_id', entryIds);
  if (lineErr) throw lineErr;

  // Step 3: fetch account details for all unique account IDs
  const accountIds = [...new Set((lines ?? []).map(l => l.account_id))];
  let accountMap = new Map<string, { code: string; name: string; account_class: string }>();
  if (accountIds.length > 0) {
    const { data: accounts, error: acctErr } = await supabaseClient
      .from('accounts')
      .select('id, code, name, account_class')
      .in('id', accountIds);
    if (acctErr) throw acctErr;
    (accounts ?? []).forEach(a => accountMap.set(a.id, { code: a.code, name: a.name, account_class: a.account_class }));
  }

  // Assemble lines grouped by entry
  const lineMap = new Map<string, PendingJournalLine[]>();
  (lines ?? []).forEach(l => {
    const acct = accountMap.get(l.account_id) ?? { code: '', name: '', account_class: '' };
    const line: PendingJournalLine = {
      id:               l.id,
      journal_entry_id: l.journal_entry_id,
      account_id:       l.account_id,
      account_code:     acct.code,
      account_name:     acct.name,
      account_class:    acct.account_class,
      debit_amount:     l.debit_amount,
      credit_amount:    l.credit_amount,
      description:      l.description,
      currency:         l.currency as 'USD' | 'SYP',
      exchange_rate:    l.exchange_rate,
    };
    if (!lineMap.has(l.journal_entry_id)) lineMap.set(l.journal_entry_id, []);
    lineMap.get(l.journal_entry_id)!.push(line);
  });

  // Assemble entries
  return entries.map(e => {
    const entryLines = lineMap.get(e.id) ?? [];
    const total_debit  = entryLines.reduce((s, l) => s + l.debit_amount, 0);
    const total_credit = entryLines.reduce((s, l) => s + l.credit_amount, 0);
    return {
      id:           e.id,
      source_type:  e.source_type as PendingJournalEntry['source_type'],
      source_id:    e.source_id,
      status:       'draft' as const,
      entry_date:   e.entry_date,
      reference_no: e.reference_no,
      description:  e.description,
      created_at:   e.created_at,
      lines:        entryLines,
      total_debit,
      total_credit,
      is_balanced:  Math.abs(total_debit - total_credit) < 0.001,
    };
  });
}
