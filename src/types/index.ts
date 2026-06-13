import type { SupportedCurrency } from '@/lib/currency';

// ─── People ──────────────────────────────────────────────────────────────────

export interface Person {
  id: string;
  name: string;
  relation: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Portfolios ───────────────────────────────────────────────────────────────

export interface Portfolio {
  id:            string;
  name:          string;
  type:          'cash_usd' | 'cash_syp' | 'gold' | 'project';
  description:   string | null;
  created_at:    string;
  members_count: number;
}

export interface PortfolioMember {
  portfolio_id:      string;
  person_id:         string;
  share_numerator:   number;
  share_denominator: number;
  joined_date:       string;
  person_name:       string;          // derived from people JOIN — not a DB column
}

export interface PortfolioStats {
  totalIncomeUsd:   number;
  totalExpensesUsd: number;
  netBalanceUsd:    number;
}

export interface PortfolioDetailMember extends PortfolioMember {
  sharePercent:   string;  // "33.33%"
  shareAmountUsd: number;  // (numerator / denominator) × netBalanceUsd
}

// ─── Transactions ────────────────────────────────────────────────────────────

export interface Transaction {
  id:               string;
  portfolio_id:     string;
  portfolio_name:   string;   // derived — from portfolios(name) embed
  type:             'income' | 'expense' | 'transfer';
  amount:           number;
  currency:         'USD' | 'SYP';
  exchange_rate:    number | null;
  category:         string | null;
  date:             string;
  notes:            string | null;
  journal_entry_id: string | null;
  created_at:       string;
}

// ─── Properties ──────────────────────────────────────────────────────────────

export interface Property {
  id:              string;
  name:            string;
  type:            'residential' | 'commercial' | 'land';
  location:        string | null;
  purchase_date:   string | null;
  estimated_value: number | null;
  status:          'rented' | 'vacant';
  owners_count:    number;           // derived — NOT a DB column
}

export interface PropertyOwner {
  property_id: string
  person_id: string
  share_numerator: number
  share_denominator: number
  ownership_basis: 'إرث' | 'شراء' | 'هبة' | 'وصية' | 'شراكة'
}

export interface Lease {
  id: string
  property_id: string
  tenant_name: string
  rent_amount: number
  currency: SupportedCurrency
  frequency: 'monthly' | 'annual'
  start_date: string
  end_date: string | null
  created_at: string
}

export interface LeasePayment {
  id: string
  lease_id: string
  amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  paid_date: string
  portfolio_id: string | null
  journal_entry_id: string | null     // null until posted to GL (M-03)
  notes: string | null
  created_at: string
}

export interface PropertyExpense {
  id: string
  property_id: string
  type: 'tax' | 'maintenance' | 'utilities' | 'fees'
  amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  due_date: string | null             // nullable per STR-002 §2.3
  paid_date: string | null
  is_recurring: boolean
  frequency: 'monthly' | 'annual' | 'once' | null
  portfolio_id: string | null
  journal_entry_id: string | null     // null until posted to GL (M-03)
  notes: string | null
  created_at: string
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export interface ExchangeRate {
  id: string
  rate: number
  date: string
  notes: string | null
  created_at: string
}

// ─── Capital ──────────────────────────────────────────────────────────────────

export interface PartnerCapitalAccount {
  id: string
  partner_id: string
  entity_type: 'portfolio' | 'property' | 'project'
  entity_id: string
  opening_balance: number
  currency: SupportedCurrency
  opening_date: string
  created_at: string
}

export interface CapitalTransaction {
  id: string
  capital_account_id: string
  type: 'capital_injection' | 'capital_reduction' | 'drawing' | 'profit_share' | 'loss_share'
  amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  date: string
  reference_no: string | null
  journal_entry_id: string | null     // null until posted to GL (M-03)
  notes: string | null
  created_at: string
}

export interface ProfitSettlement {
  id: string
  entity_type: 'portfolio' | 'property' | 'project'
  entity_id: string
  entity_name: string                 // derived — resolved in application layer
  period_start: string
  period_end: string
  total_profit: number
  currency: SupportedCurrency
  settlement_date: string
  status: 'draft' | 'confirmed'
  notes: string | null
  created_at: string
}

export interface SettlementShare {
  id: string
  settlement_id: string
  partner_id: string
  partner_name: string                // derived — resolved in application layer
  share_numerator: number
  share_denominator: number
  amount: number                      // CHECK >= 0 per STR-002 §2.4
  capital_transaction_id: string | null
  created_at: string
}

export interface Distribution {
  id: string
  partner_id: string
  entity_type: 'portfolio' | 'property' | 'project'
  entity_id: string
  amount: number
  currency: SupportedCurrency
  date: string
  notes: string | null
  created_at: string
}

// ─── Projects (v1.1) ─────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string | null
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  budget_amount: number | null
  budget_currency: SupportedCurrency | null
  notes: string | null
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  person_id: string
  share_numerator: number
  share_denominator: number
  effective_from: string
  effective_to: string | null         // null = currently active
  notes: string | null
  created_at: string
}

export interface WbsItem {
  id: string
  project_id: string
  parent_id: string | null            // null = root-level item
  code: string
  name: string
  level: number
  description: string | null
  budget_amount: number | null
  budget_currency: SupportedCurrency | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  order_index: number
  created_at: string
}

export interface ProjectTransaction {
  id: string
  project_id: string
  wbs_item_id: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  category: string | null
  date: string
  journal_entry_id: string | null     // null until posted to GL (M-03)
  notes: string | null
  created_at: string
}

// ─── Accounting Core (v1.2) ───────────────────────────────────────────────────

export interface AccountingPeriod {
  id: string
  fiscal_year: number
  period_number: number
  name: string
  start_date: string
  end_date: string
  status: 'open' | 'closed' | 'locked'
  created_at: string
}

export interface Account {
  id: string
  company_id: string
  parent_id: string | null            // null = root account
  code: string
  name: string
  account_class: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  normal_balance: 'debit' | 'credit'
  level: number
  is_postable: boolean
  is_active: boolean
  created_at: string
}

// Derived in application layer — never stored in DB
export interface AccountNode extends Account {
  children: AccountNode[];
}

export interface JournalEntry {
  id: string
  period_id: string
  entry_date: string
  reference_no: string | null
  description: string
  source_type: 'manual' | 'transaction' | 'project_transaction' | 'lease_payment' | 'property_expense' | 'capital_transaction'
  source_id: string | null            // null for manual entries
  status: 'draft' | 'posted' | 'reversed'
  reversal_of: string | null          // null unless this is a reversal entry
  created_at: string
}

export interface JournalEntryLine {
  id: string
  journal_entry_id: string
  account_id: string
  debit_amount: number                // one of debit/credit must be > 0, other = 0
  credit_amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  description: string | null
  created_at: string
}

// ─── General Ledger VIEW row shape ───────────────────────────────────────────

export interface GeneralLedgerRow {
  company_id: string
  account_code: string
  account_name: string
  account_class: Account['account_class']
  normal_balance: Account['normal_balance']
  fiscal_year: number
  period_number: number
  period_name: string
  entry_date: string
  reference_no: string | null
  entry_description: string
  line_description: string | null
  debit_amount: number
  credit_amount: number
  currency: SupportedCurrency
  exchange_rate: number | null
  source_type: JournalEntry['source_type']
  source_id: string | null
  entry_status: JournalEntry['status']
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}
