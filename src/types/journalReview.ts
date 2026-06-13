export type JournalEntrySourceType =
  | 'transaction'
  | 'lease_payment'
  | 'property_expense'
  | 'capital_transaction'
  | 'settlement'
  | 'manual';

export interface PendingJournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_class: string;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
  currency: 'USD' | 'SYP';
  exchange_rate: number | null;
}

export interface PendingJournalEntry {
  id: string;
  source_type: JournalEntrySourceType;
  source_id: string | null;
  status: 'draft';
  entry_date: string;
  reference_no: string | null;
  description: string;
  created_at: string;
  lines: PendingJournalLine[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}
