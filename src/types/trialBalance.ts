export type AccountClass  = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface TrialBalanceRow {
  account_code:   string;
  account_name:   string;
  account_class:  AccountClass;
  normal_balance: NormalBalance;
  total_debit:    number;
  total_credit:   number;
  net_balance:    number;
}

export interface TrialBalanceSummary {
  rows:                TrialBalanceRow[];
  grand_total_debit:   number;
  grand_total_credit:  number;
  is_balanced:         boolean;
  as_of_date:          string;
  period_label:        string;
}
