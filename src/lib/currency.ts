import {
  dinero,
  add,
  subtract,
  allocate,
  toDecimal,
  isZero as dineroIsZero,
} from 'dinero.js';
import type { Dinero } from 'dinero.js';
import { USD as _USD } from '@dinero.js/currencies';

// ─── Currency Definitions ────────────────────────────────────────────────────

/**
 * US Dollar — 2 decimal places (cents).
 * Re-exported from @dinero.js/currencies for convenience.
 */
export const USD = _USD;

/**
 * Syrian Pound — 0 decimal places.
 * Defined as a custom currency because ISO 4217 lists SYP with exponent 2
 * (piastres), but piastres are obsolete in this system. All SYP amounts
 * are whole pounds.
 */
export const SYP = { code: 'SYP', base: 10, exponent: 0 } as const;

// ─── Types ────────────────────────────────────────────────────────────────────

/** The two currencies supported by FinFamily. USD is the reference currency. */
export type SupportedCurrency = 'USD' | 'SYP';

/**
 * A fractional ownership share expressed as numerator / denominator.
 * e.g. { numerator: 1, denominator: 3 } represents one-third.
 */
export interface ShareFraction {
  numerator: number;
  denominator: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Returns the currency object (USD or SYP) for a given currency code. */
function getCurrencyObj(currency: SupportedCurrency) {
  return currency === 'USD' ? USD : SYP;
}

/** Euclidean GCD — integer only, no floats. */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** LCM of two positive integers. */
function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/** LCM of an array of positive integers. */
function lcmAll(values: number[]): number {
  return values.reduce((acc, v) => lcm(acc, v), 1);
}

// ─── Core Factory ─────────────────────────────────────────────────────────────

/**
 * Creates a Dinero object from a human-readable decimal amount.
 *
 * @param amount   - The amount in major units (e.g. 1500.50 for USD, 250000 for SYP)
 * @param currency - 'USD' or 'SYP'
 * @returns        - A Dinero<number> object safe for arithmetic
 *
 * @example
 *   makeMoney(1500.50, 'USD') // Dinero { amount: 150050, currency: USD }
 *   makeMoney(250000, 'SYP') // Dinero { amount: 250000, currency: SYP }
 */
export function makeMoney(amount: number, currency: SupportedCurrency): Dinero<number> {
  const currencyObj = getCurrencyObj(currency);
  const scale = Math.pow(10, currencyObj.exponent);
  const dineroAmount = Math.round(amount * scale);
  return dinero({ amount: dineroAmount, currency: currencyObj });
}

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Extracts the plain decimal number from a Dinero object.
 * Use when storing to Supabase or performing non-Dinero operations.
 *
 * @param d - Any Dinero<number> object
 * @returns - Human-readable decimal (e.g. 1500.50 for USD, 250000 for SYP)
 */
export function dineroToNumber(d: Dinero<number>): number {
  return Number(toDecimal(d));
}

/**
 * Converts any supported currency amount to its USD equivalent.
 * If the currency is already USD, returns the amount unchanged.
 *
 * @param amount       - Raw numeric amount in source currency (major units)
 * @param currency     - Source currency code
 * @param exchangeRate - SYP per 1 USD (from exchange_rates table)
 * @returns            - USD equivalent rounded to 2 decimal places
 *
 * @example
 *   toUSD(250000, 'SYP', 15000) // 16.67
 *   toUSD(1500, 'USD', 15000)   // 1500
 */
export function toUSD(
  amount: number,
  currency: SupportedCurrency,
  exchangeRate: number,
): number {
  if (currency === 'USD') return amount;
  return Math.round((amount / exchangeRate) * 100) / 100;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Returns a locale-formatted currency string for display in the Arabic UI.
 * This function is for DISPLAY ONLY — never use its output in calculations.
 *
 * @param amount   - Raw numeric amount in major units
 * @param currency - 'USD' or 'SYP'
 * @returns        - Arabic-formatted string (locale: ar-SY)
 *
 * @example
 *   formatCurrency(1500.50, 'USD') // Arabic USD string
 *   formatCurrency(250000, 'SYP')  // Arabic number + ' س.ل'
 */
export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  const formatted = new Intl.NumberFormat('ar-SY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} س.ل`;
}

// ─── Arithmetic ───────────────────────────────────────────────────────────────

/**
 * Adds two same-currency Dinero objects.
 *
 * @param a - First operand
 * @param b - Second operand (must share currency with a)
 * @returns - Sum as a new Dinero object
 * @throws  - Error if currencies differ
 */
export function addMoney(a: Dinero<number>, b: Dinero<number>): Dinero<number> {
  return add(a, b);
}

/**
 * Subtracts b from a. Both must share the same currency.
 *
 * @param a - Minuend
 * @param b - Subtrahend (must share currency with a)
 * @returns - Difference as a new Dinero object
 * @throws  - Error if currencies differ
 */
export function subtractMoney(a: Dinero<number>, b: Dinero<number>): Dinero<number> {
  return subtract(a, b);
}

// ─── Zero Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a zero-value Dinero object for the given currency.
 *
 * @param currency - 'USD' or 'SYP'
 */
export function zeroDinero(currency: SupportedCurrency): Dinero<number> {
  return makeMoney(0, currency);
}

/**
 * Returns true if the Dinero object represents a zero amount.
 *
 * @param d - Any Dinero<number> object
 */
export function isZero(d: Dinero<number>): boolean {
  return dineroIsZero(d);
}

// ─── Share Validation ─────────────────────────────────────────────────────────

/**
 * Validates that an array of fractional shares sums exactly to 1.
 * Uses LCM integer arithmetic — no floating-point comparison.
 *
 * @param shares - Array of { numerator, denominator } fractions
 * @returns      - true only when the fractions sum to exactly 1
 *
 * @example
 *   validateShares([{ numerator:1, denominator:2 }, { numerator:1, denominator:2 }]) // true
 *   validateShares([{ numerator:1, denominator:3 }, { numerator:1, denominator:3 }]) // false
 */
export function validateShares(shares: ShareFraction[]): boolean {
  if (shares.length === 0) return false;
  const denominators = shares.map((s) => s.denominator);
  const L = lcmAll(denominators);
  const sum = shares.reduce((acc, s) => acc + s.numerator * (L / s.denominator), 0);
  return sum === L;
}

// ─── Share Allocation ─────────────────────────────────────────────────────────

/**
 * Distributes a total Dinero amount across partners according to fractional
 * shares. Uses Dinero's allocate() to guarantee no rounding loss — any
 * indivisible remainder is assigned to the first share.
 *
 * @param total  - The total amount to distribute
 * @param shares - Array of ShareFraction objects; must sum to 1
 * @returns      - Array of Dinero objects in the same order as shares
 * @throws       - Error if shares do not sum to 1
 *
 * @example
 *   allocateByShares(makeMoney(100, 'USD'), [
 *     { numerator: 2, denominator: 3 },
 *     { numerator: 1, denominator: 3 },
 *   ])
 *   // → [Dinero($66.67), Dinero($33.33)]  — $100.00 total, no cent lost
 */
export function allocateByShares(
  total: Dinero<number>,
  shares: ShareFraction[],
): Dinero<number>[] {
  if (!validateShares(shares)) {
    throw new Error('allocateByShares: shares must sum to exactly 1');
  }
  const denominators = shares.map((s) => s.denominator);
  const L = lcmAll(denominators);
  const ratios = shares.map((s) => s.numerator * (L / s.denominator));
  const result: Dinero<number>[] = allocate(total, ratios);
  return result;
}
