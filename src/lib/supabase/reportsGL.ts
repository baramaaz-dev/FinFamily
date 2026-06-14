import { supabaseClient } from '@/lib/supabase';
import type {
  IFRSCategory,
  PLSummary, PLAccountRow, PLCategory,
  EquitySummary, EquityPartnerSection, EquityAccountRow,
  BSSummary, BSAccountRow,
} from '@/types/reportsGL';

// ── Raw row shape from the VIEW ───────────────────────────────────────────────

interface GLRow {
  account_code:   string;
  account_name:   string;
  account_class:  string;
  normal_balance: 'debit' | 'credit';
  debit_amount:   number;
  credit_amount:  number;
}

// ── Client-side aggregation ───────────────────────────────────────────────────

interface AccountAgg extends GLRow {
  total_debit:  number;
  total_credit: number;
}

function aggregateByAccount(rows: GLRow[]): AccountAgg[] {
  const map = new Map<string, AccountAgg>();
  for (const row of rows) {
    const existing = map.get(row.account_code);
    if (existing) {
      existing.total_debit  += row.debit_amount;
      existing.total_credit += row.credit_amount;
    } else {
      map.set(row.account_code, {
        ...row,
        total_debit:  row.debit_amount,
        total_credit: row.credit_amount,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.account_code.localeCompare(b.account_code),
  );
}

function netBalance(agg: AccountAgg): number {
  return agg.normal_balance === 'debit'
    ? agg.total_debit - agg.total_credit
    : agg.total_credit - agg.total_debit;
}

// ── IFRS 18 category classifier by first digit of account code ────────────────

function ifrsClass(code: string): { category: IFRSCategory; kind: 'revenue' | 'expense' } | null {
  switch (code[0]) {
    case '4': return { category: 'operating', kind: 'revenue' };
    case '5': return { category: 'investing', kind: 'revenue' };
    case '6': return { category: 'financing', kind: 'revenue' };
    case '7': return { category: 'operating', kind: 'expense' };
    case '8': return { category: 'investing', kind: 'expense' };
    case '9': return { category: 'financing', kind: 'expense' };
    default:  return null;
  }
}

// ── P&L ──────────────────────────────────────────────────────────────────────

export async function getProfitLossGL(dateFrom: string, dateTo: string): Promise<PLSummary> {
  const { data, error } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, account_class, normal_balance, debit_amount, credit_amount')
    .in('account_class', ['revenue', 'expense'])
    .gte('entry_date', dateFrom)
    .lte('entry_date', dateTo);
  if (error) throw error;

  const aggs = aggregateByAccount((data ?? []) as GLRow[]);

  const catBuckets = new Map<IFRSCategory, { revenues: PLAccountRow[]; expenses: PLAccountRow[] }>(
    (['operating', 'investing', 'financing'] as IFRSCategory[]).map((cat) => [
      cat,
      { revenues: [], expenses: [] },
    ]),
  );

  for (const agg of aggs) {
    const cls = ifrsClass(agg.account_code);
    if (!cls) continue;
    const bucket = catBuckets.get(cls.category)!;
    const row: PLAccountRow = {
      account_code: agg.account_code,
      account_name: agg.account_name,
      net_balance:  netBalance(agg),
    };
    if (cls.kind === 'revenue') bucket.revenues.push(row);
    else                        bucket.expenses.push(row);
  }

  let total_revenue = 0;
  let total_expense = 0;

  const categories: PLCategory[] = (['operating', 'investing', 'financing'] as IFRSCategory[]).map(
    (cat) => {
      const { revenues, expenses } = catBuckets.get(cat)!;
      const revenue_total = revenues.reduce((s, r) => s + r.net_balance, 0);
      const expense_total = expenses.reduce((s, r) => s + r.net_balance, 0);
      total_revenue += revenue_total;
      total_expense += expense_total;
      return { category: cat, revenues, expenses, revenue_total, expense_total, net: revenue_total - expense_total };
    },
  );

  return {
    categories,
    total_revenue,
    total_expense,
    net_pl: total_revenue - total_expense,
    date_from: dateFrom,
    date_to: dateTo,
  };
}

// ── Partners Equity ───────────────────────────────────────────────────────────

export async function getPartnersEquityGL(asOfDate: string): Promise<EquitySummary> {
  const { data, error } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, account_class, normal_balance, debit_amount, credit_amount')
    .eq('account_class', 'equity')
    .lte('entry_date', asOfDate);
  if (error) throw error;

  const aggs = aggregateByAccount((data ?? []) as GLRow[]);

  const sectionMap = new Map<'31' | '32', EquityAccountRow[]>([
    ['31', []],
    ['32', []],
  ]);

  for (const agg of aggs) {
    const prefix = agg.account_code.slice(0, 2) as '31' | '32';
    const list = sectionMap.get(prefix);
    if (!list) continue;
    list.push({
      account_code: agg.account_code,
      account_name: agg.account_name,
      balance: netBalance(agg),
    });
  }

  const sections: EquityPartnerSection[] = (['31', '32'] as const).map((prefix) => {
    const rows = sectionMap.get(prefix) ?? [];
    return { prefix, rows, total: rows.reduce((s, r) => s + r.balance, 0) };
  });

  return {
    sections,
    grand_total: sections.reduce((s, sec) => s + sec.total, 0),
    as_of_date: asOfDate,
  };
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export async function getBalanceSheetGL(asOfDate: string): Promise<BSSummary> {
  const { data, error } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, account_class, normal_balance, debit_amount, credit_amount')
    .lte('entry_date', asOfDate);
  if (error) throw error;

  const aggs = aggregateByAccount((data ?? []) as GLRow[]);

  const assets:      BSAccountRow[] = [];
  const liabilities: BSAccountRow[] = [];
  const equity:      BSAccountRow[] = [];

  for (const agg of aggs) {
    const row: BSAccountRow = {
      account_code: agg.account_code,
      account_name: agg.account_name,
      balance: netBalance(agg),
    };
    if      (agg.account_class === 'asset')     assets.push(row);
    else if (agg.account_class === 'liability') liabilities.push(row);
    else if (agg.account_class === 'equity')    equity.push(row);
  }

  const total_assets      = assets.reduce((s, r) => s + r.balance, 0);
  const total_liabilities = liabilities.reduce((s, r) => s + r.balance, 0);
  const total_equity      = equity.reduce((s, r) => s + r.balance, 0);
  const is_balanced       = Math.abs(total_assets - (total_liabilities + total_equity)) < 0.01;

  return {
    assets, total_assets,
    liabilities, total_liabilities,
    equity, total_equity,
    is_balanced,
    as_of_date: asOfDate,
  };
}
