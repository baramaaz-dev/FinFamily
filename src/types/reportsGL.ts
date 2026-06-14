// ── IFRS 18 category label ─────────────────────────────────────────────────────
export type IFRSCategory = 'operating' | 'investing' | 'financing';

// ── P&L ──────────────────────────────────────────────────────────────────────
export interface PLAccountRow {
  account_code: string;
  account_name: string;
  net_balance: number;  // positive = net favorable amount (earned / incurred)
}

export interface PLCategory {
  category: IFRSCategory;
  revenues: PLAccountRow[];  // 4XXX / 5XXX / 6XXX
  expenses: PLAccountRow[];  // 7XXX / 8XXX / 9XXX
  revenue_total: number;
  expense_total: number;
  net: number;  // revenue_total - expense_total
}

export interface PLSummary {
  categories: PLCategory[];
  total_revenue: number;
  total_expense: number;
  net_pl: number;
  date_from: string;
  date_to: string;
}

// ── Partners Equity ───────────────────────────────────────────────────────────
export interface EquityAccountRow {
  account_code: string;
  account_name: string;
  balance: number;  // positive = credit > debit (normal for equity)
}

export interface EquityPartnerSection {
  prefix: '31' | '32';  // 31XX = capital accounts, 32XX = current accounts
  rows: EquityAccountRow[];
  total: number;
}

export interface EquitySummary {
  sections: EquityPartnerSection[];
  grand_total: number;
  as_of_date: string;
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────
export interface BSAccountRow {
  account_code: string;
  account_name: string;
  balance: number;  // positive = normal-side amount
}

export interface BSSummary {
  assets: BSAccountRow[];
  total_assets: number;
  liabilities: BSAccountRow[];
  total_liabilities: number;
  equity: BSAccountRow[];
  total_equity: number;
  is_balanced: boolean;
  as_of_date: string;
}
