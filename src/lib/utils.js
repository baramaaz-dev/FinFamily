import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق العملة بالعربية
 */
export function formatCurrency(amount, currency = 'USD') {
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

  // SYP — بدون رمز ISO، نعرض "ل.س"
  return (
    new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + ' ل.س'
  )
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * تنسيق الحصة كسراً
 */
export function formatShare(numerator, denominator) {
  if (!denominator) return '—'
  const pct = ((numerator / denominator) * 100).toFixed(2)
  return `${numerator}/${denominator} (${pct}٪)`
}

/**
 * التحقق من أن مجموع الحصص = 1
 */
export function validateSharesSum(shares) {
  if (!shares || shares.length === 0) return false
  let numeratorSum = 0
  let denominator = shares[0].share_denominator

  // التحقق من أن جميع المقامات متساوية للمقارنة السهلة
  const allSameDenominator = shares.every(s => s.share_denominator === denominator)

  if (allSameDenominator) {
    numeratorSum = shares.reduce((sum, s) => sum + Number(s.share_numerator), 0)
    return numeratorSum === denominator
  }

  // حساب المجموع ككسور عشرية
  const sum = shares.reduce((acc, s) => acc + Number(s.share_numerator) / Number(s.share_denominator), 0)
  return Math.abs(sum - 1) < 0.0001
}

/**
 * تحويل من SYP إلى USD
 */
export function toUSD(amount, currency, exchangeRate) {
  if (currency === 'USD') return Number(amount)
  return Number(amount) / Number(exchangeRate)
}

/**
 * أنواع المحافظ
 */
export const PORTFOLIO_TYPES = {
  cash_usd: 'نقد دولار',
  cash_syp: 'نقد سوري',
  gold: 'ذهب',
  project: 'مشروع',
}

/**
 * أنواع المعاملات
 */
export const TRANSACTION_TYPES = {
  income: 'دخل',
  expense: 'مصروف',
  transfer: 'تحويل',
}

/**
 * أنواع العقارات
 */
export const PROPERTY_TYPES = {
  residential: 'سكني',
  commercial: 'تجاري',
  land: 'أرض',
}

/**
 * حالة العقار
 */
export const PROPERTY_STATUS = {
  rented: 'مؤجّر',
  vacant: 'شاغر',
}

/**
 * أسس الملكية
 */
export const OWNERSHIP_BASIS = {
  إرث: 'إرث',
  شراء: 'شراء',
  هبة: 'هبة',
  وصية: 'وصية',
  شراكة: 'شراكة',
}

/**
 * أنواع معاملات رأس المال
 */
export const CAPITAL_TRANSACTION_TYPES = {
  capital_injection: 'زيادة حصة',
  capital_reduction: 'إنقاص حصة',
  drawing: 'مسحوبات',
  profit_share: 'نصيب أرباح',
  loss_share: 'نصيب خسائر',
}
