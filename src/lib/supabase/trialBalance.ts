import { supabaseClient }                                          from '@/lib/supabase';
import type { TrialBalanceSummary, TrialBalanceRow, AccountClass, NormalBalance } from '@/types/trialBalance';

export async function getTrialBalance(
  dateFrom: string,
  dateTo:   string,
): Promise<TrialBalanceSummary> {
  const { data, error } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, account_class, normal_balance, debit_amount, credit_amount')
    .gte('entry_date', dateFrom)
    .lte('entry_date', dateTo);

  if (error) throw error;

  const accountMap = new Map<string, TrialBalanceRow>();

  (data ?? []).forEach(line => {
    const key      = line.account_code as string;
    const existing = accountMap.get(key);
    if (existing) {
      existing.total_debit  += (line.debit_amount  as number) ?? 0;
      existing.total_credit += (line.credit_amount as number) ?? 0;
      existing.net_balance   = existing.total_debit - existing.total_credit;
    } else {
      const debit  = (line.debit_amount  as number) ?? 0;
      const credit = (line.credit_amount as number) ?? 0;
      accountMap.set(key, {
        account_code:   line.account_code   as string,
        account_name:   line.account_name   as string,
        account_class:  line.account_class  as AccountClass,
        normal_balance: line.normal_balance as NormalBalance,
        total_debit:    debit,
        total_credit:   credit,
        net_balance:    debit - credit,
      });
    }
  });

  const rows = Array.from(accountMap.values()).sort((a, b) =>
    a.account_code.localeCompare(b.account_code)
  );

  const grand_total_debit  = rows.reduce((s, r) => s + r.total_debit,  0);
  const grand_total_credit = rows.reduce((s, r) => s + r.total_credit, 0);

  return {
    rows,
    grand_total_debit,
    grand_total_credit,
    is_balanced:  Math.abs(grand_total_debit - grand_total_credit) < 0.01,
    as_of_date:   dateTo,
    period_label: `${dateFrom} — ${dateTo}`,
  };
}

export async function getCurrentPeriodRange(): Promise<{ from: string; to: string }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: period } = await supabaseClient
    .from('accounting_periods')
    .select('start_date, end_date')
    .eq('status', 'open')
    .lte('start_date', today)
    .gte('end_date', today)
    .maybeSingle();

  if (period) {
    return { from: period.start_date as string, to: today };
  }

  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: today };
}
