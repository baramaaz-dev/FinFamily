import type { JournalEntry, JournalEntryLine } from '@/types';

export type JournalEntryStatus     = JournalEntry['status'];
export type JournalEntrySourceType = JournalEntry['source_type'];

export interface JournalEntryLineInput {
  account_id:    string;
  debit_amount:  string;
  credit_amount: string;
  currency:      'USD' | 'SYP';
  exchange_rate: string;
  description:   string;
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[];
}

export interface CreateJournalEntryPayload {
  period_id:    string;
  entry_date:   string;
  reference_no: string | null;
  description:  string;
  lines: Array<{
    account_id:    string;
    debit_amount:  number;
    credit_amount: number;
    currency:      'USD' | 'SYP';
    exchange_rate: number | null;
    description:   string | null;
  }>;
}
