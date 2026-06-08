import type { CapitalTransaction } from '../types';

// Per STR-006 §6.3 — apply exchange rate for SYP amounts.
// Null-safe variant: if no rate is available, returns 0 for SYP.
export function toUSD(
  amount: number,
  currency: 'USD' | 'SYP',
  exchangeRate: number | null,
): number {
  if (currency === 'USD') return amount;
  if (!exchangeRate || exchangeRate <= 0) return 0;
  return amount / exchangeRate;
}

export interface CapitalBreakdown {
  openingBalance: number;
  injections:     number;
  profitShares:   number;
  lossShares:     number;
  drawings:       number;
  reductions:     number;
  closingBalance: number;
}

// MVP: SYP opening_balance without exchange_rate defaults to 0 in USD view.
// Full multi-currency opening balance support deferred to post-MVP.
export function buildCapitalBreakdown(
  openingBalance: number,
  openingCurrency: 'USD' | 'SYP',
  openingExchangeRate: number | null,
  transactions: Pick<CapitalTransaction, 'type' | 'amount' | 'currency' | 'exchange_rate'>[],
): CapitalBreakdown {
  const openingUSD = toUSD(openingBalance, openingCurrency, openingExchangeRate);

  const totals = transactions.reduce(
    (acc, tx) => {
      const usd = toUSD(tx.amount, tx.currency, tx.exchange_rate);
      switch (tx.type) {
        case 'capital_injection': acc.injections  += usd; break;
        case 'profit_share':      acc.profitShares += usd; break;
        case 'loss_share':        acc.lossShares   += usd; break;
        case 'drawing':           acc.drawings     += usd; break;
        case 'capital_reduction': acc.reductions   += usd; break;
      }
      return acc;
    },
    { injections: 0, profitShares: 0, lossShares: 0, drawings: 0, reductions: 0 },
  );

  const closingBalance =
    openingUSD
    + totals.injections
    + totals.profitShares
    - totals.lossShares
    - totals.drawings
    - totals.reductions;

  return {
    openingBalance: openingUSD,
    ...totals,
    closingBalance,
  };
}
