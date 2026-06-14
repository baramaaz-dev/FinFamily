import { supabaseClient } from '@/lib/supabase';

export async function resetAllTransactionalData(): Promise<void> {
  const zeroId = '00000000-0000-0000-0000-000000000000';

  // Step 1: NULL out journal_entry_id FK references in source tables
  // to avoid FK constraint violation when deleting journal_entries
  const fkTables = [
    'transactions',
    'lease_payments',
    'property_expenses',
    'capital_transactions',
    'profit_settlements',
  ];

  for (const table of fkTables) {
    const { error } = await supabaseClient
      .from(table)
      .update({ journal_entry_id: null })
      .neq('id', zeroId);
    if (error) throw new Error(`Failed to clear FK in ${table}: ${error.message}`);
  }

  // Step 2: Delete all rows in child-before-parent order
  const tables = [
    'journal_entry_lines',
    'journal_entries',
    'settlement_shares',
    'profit_settlements',
    'capital_transactions',
    'partner_capital_accounts',
    'distributions',
    'lease_payments',
    'property_expenses',
    'leases',
    'transactions',
  ];

  for (const table of tables) {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .neq('id', zeroId);
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}