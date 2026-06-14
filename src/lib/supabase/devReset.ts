import { supabaseClient } from '@/lib/supabase';

export async function resetAllTransactionalData(): Promise<void> {
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
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}
