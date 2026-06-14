import { supabaseClient } from '@/lib/supabase';

export async function getPendingDraftCount(
  startDate: string,
  endDate:   string,
): Promise<number> {
  const { count, error } = await supabaseClient
    .from('journal_entries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (error) throw error;
  return count ?? 0;
}

export async function closePeriod(periodId: string): Promise<void> {
  const { error } = await supabaseClient
    .from('accounting_periods')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', periodId)
    .eq('status', 'open');
  if (error) throw error;
}

export async function reopenPeriod(periodId: string): Promise<void> {
  const { error } = await supabaseClient
    .from('accounting_periods')
    .update({ status: 'open', closed_at: null })
    .eq('id', periodId)
    .eq('status', 'closed');
  if (error) throw error;
}

export async function hasOtherOpenPeriod(excludePeriodId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('accounting_periods')
    .select('id')
    .eq('status', 'open')
    .neq('id', excludePeriodId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function lockPeriod(
  periodId:   string,
  periodName: string,
  startDate:  string,
  endDate:    string,
): Promise<void> {

  // Step 1: Find retained earnings account (3300)
  // NOTE: accounts table uses 'code', not 'account_code'
  const { data: retainedAccount, error: acctError } = await supabaseClient
    .from('accounts')
    .select('id, code, name')
    .eq('code', '3300')
    .maybeSingle();

  if (acctError) throw acctError;
  if (!retainedAccount) throw new Error('RETAINED_EARNINGS_ACCOUNT_NOT_FOUND');

  // Step 2: Fetch revenue account balances from general_ledger VIEW
  const { data: revenueLines, error: revError } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, debit_amount, credit_amount')
    .eq('account_class', 'revenue')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);

  if (revError) throw revError;

  // Step 3: Fetch expense account balances from general_ledger VIEW
  const { data: expenseLines, error: expError } = await supabaseClient
    .from('general_ledger')
    .select('account_code, account_name, debit_amount, credit_amount')
    .eq('account_class', 'expense')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);

  if (expError) throw expError;

  // Step 4: Aggregate by account_code
  type AccountBalance = { account_code: string; account_name: string; net: number };

  function aggregate(
    lines: { account_code: string; account_name: string; debit_amount: number; credit_amount: number }[],
    isRevenue: boolean,
  ): AccountBalance[] {
    const map = new Map<string, AccountBalance>();
    (lines ?? []).forEach(l => {
      const key      = l.account_code;
      const existing = map.get(key) ?? {
        account_code: l.account_code,
        account_name: l.account_name,
        net: 0,
      };
      existing.net += isRevenue
        ? ((l.credit_amount ?? 0) - (l.debit_amount ?? 0))
        : ((l.debit_amount  ?? 0) - (l.credit_amount ?? 0));
      map.set(key, existing);
    });
    return Array.from(map.values()).filter(a => Math.abs(a.net) > 0.001);
  }

  const revenueAccounts = aggregate(revenueLines ?? [], true);
  const expenseAccounts = aggregate(expenseLines ?? [], false);

  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.net, 0);
  const totalExpense = expenseAccounts.reduce((s, a) => s + a.net, 0);
  const netProfit    = totalRevenue - totalExpense;

  // Step 5: Resolve account IDs from accounts table (uses 'code', not 'account_code')
  const allCodes = [
    ...revenueAccounts.map(a => a.account_code),
    ...expenseAccounts.map(a => a.account_code),
  ];

  const accountIdMap = new Map<string, string>();
  if (allCodes.length > 0) {
    const { data: accountRows, error: idError } = await supabaseClient
      .from('accounts')
      .select('id, code')
      .in('code', allCodes);
    if (idError) throw idError;
    (accountRows ?? []).forEach(a => accountIdMap.set(a.code as string, a.id as string));
  }

  const hasActivity = revenueAccounts.length > 0 || expenseAccounts.length > 0;
  let closingEntryId: string | null = null;

  if (hasActivity) {
    // Step 6: Build closing entry lines
    // Revenue: DEBIT to zero out credit balance
    // Expense: CREDIT to zero out debit balance
    // Retained earnings: net result
    const pendingLines: {
      account_id:    string;
      debit_amount:  number;
      credit_amount: number;
      description:   string;
      currency:      string;
    }[] = [];

    for (const rev of revenueAccounts) {
      const acctId = accountIdMap.get(rev.account_code);
      if (!acctId) continue;
      pendingLines.push({
        account_id:    acctId,
        debit_amount:  rev.net,
        credit_amount: 0,
        description:   `إقفال: ${rev.account_name}`,
        currency:      'USD',
      });
    }

    for (const exp of expenseAccounts) {
      const acctId = accountIdMap.get(exp.account_code);
      if (!acctId) continue;
      pendingLines.push({
        account_id:    acctId,
        debit_amount:  0,
        credit_amount: exp.net,
        description:   `إقفال: ${exp.account_name}`,
        currency:      'USD',
      });
    }

    // Retained earnings line
    pendingLines.push({
      account_id:    retainedAccount.id,
      debit_amount:  netProfit < 0 ? Math.abs(netProfit) : 0,
      credit_amount: netProfit >= 0 ? netProfit : 0,
      description:   `صافي أرباح الفترة: ${periodName}`,
      currency:      'USD',
    });

    if (pendingLines.length >= 2) {
      // Step 7: Insert closing journal entry header
      // period_id and entry_date are required NOT NULL on journal_entries
      const { data: entryRow, error: entryError } = await supabaseClient
        .from('journal_entries')
        .insert({
          period_id:   periodId,
          entry_date:  endDate,
          source_type: 'closing',
          source_id:   periodId,
          status:      'posted',
          description: `قيود إقفال الفترة: ${periodName}`,
        })
        .select('id')
        .single();

      if (entryError) throw entryError;
      closingEntryId = entryRow.id;

      // Step 8: Insert all closing lines in one statement
      const linesWithEntryId = pendingLines.map(l => ({
        ...l,
        journal_entry_id: closingEntryId,
      }));

      const { error: linesError } = await supabaseClient
        .from('journal_entry_lines')
        .insert(linesWithEntryId);

      if (linesError) {
        await supabaseClient.from('journal_entries').delete().eq('id', closingEntryId);
        throw linesError;
      }
    }
  }

  // Step 9: Lock the period
  const { error: lockError } = await supabaseClient
    .from('accounting_periods')
    .update({
      status:           'locked',
      locked_at:        new Date().toISOString(),
      closing_entry_id: closingEntryId,
    })
    .eq('id', periodId)
    .eq('status', 'closed');

  if (lockError) {
    if (closingEntryId) {
      await supabaseClient
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', closingEntryId);
      await supabaseClient
        .from('journal_entries')
        .delete()
        .eq('id', closingEntryId);
    }
    throw lockError;
  }
}
