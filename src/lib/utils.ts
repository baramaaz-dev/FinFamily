import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '—'
  const num = Number(amount)
  if (isNaN(num)) return '—'

  if (currency === 'USD') {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return (
    new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + ' ل.س'
  )
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function formatShare(numerator: number, denominator: number): string {
  if (!denominator) return '—'
  const pct = ((numerator / denominator) * 100).toFixed(2)
  return `${numerator}/${denominator} (${pct}٪)`
}

interface Share {
  share_numerator: number | string
  share_denominator: number | string
}

export function validateSharesSum(shares: Share[]): boolean {
  if (!shares || shares.length === 0) return false
  const denominator = shares[0].share_denominator
  const allSameDenominator = shares.every(s => s.share_denominator === denominator)

  if (allSameDenominator) {
    const numeratorSum = shares.reduce((sum, s) => sum + Number(s.share_numerator), 0)
    return numeratorSum === Number(denominator)
  }

  const sum = shares.reduce(
    (acc, s) => acc + Number(s.share_numerator) / Number(s.share_denominator),
    0,
  )
  return Math.abs(sum - 1) < 0.0001
}

export function toUSD(
  amount: number | string,
  currency: string,
  exchangeRate: number | string,
): number {
  if (currency === 'USD') return Number(amount)
  return Number(amount) / Number(exchangeRate)
}

export const PORTFOLIO_TYPES = {
  cash_usd: 'نقد دولار',
  cash_syp: 'نقد سوري',
  gold: 'ذهب',
  project: 'مشروع',
} as const

export const TRANSACTION_TYPES = {
  income: 'دخل',
  expense: 'مصروف',
  transfer: 'تحويل',
} as const

export const PROPERTY_TYPES = {
  residential: 'سكني',
  commercial: 'تجاري',
  land: 'أرض',
} as const

export const PROPERTY_STATUS = {
  rented: 'مؤجّر',
  vacant: 'شاغر',
} as const

export const OWNERSHIP_BASIS = {
  إرث: 'إرث',
  شراء: 'شراء',
  هبة: 'هبة',
  وصية: 'وصية',
  شراكة: 'شراكة',
} as const

export const CAPITAL_TRANSACTION_TYPES = {
  capital_injection: 'زيادة حصة',
  capital_reduction: 'إنقاص حصة',
  drawing: 'مسحوبات',
  profit_share: 'نصيب أرباح',
  loss_share: 'نصيب خسائر',
} as const
