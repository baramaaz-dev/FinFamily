# FinFamily — المحرك المحاسبي
**الوثيقة:** STR-006
**الإصدار:** 1.1
**الحالة:** ✅ معتمدة
**آخر تحديث:** 2026-06-08

> **قاعدة إلزامية:** أي قصة (Story) تتعلق بترحيل القيود أو حسابات رأس المال أو التسويات
> يجب أن تُراجع هذه الوثيقة أولاً. هذا الملف هو المرجع الوحيد لمنطق القيد المزدوج في المشروع.
> عند وجود تعارض بينه وبين أي وثيقة أخرى، هذه الوثيقة هي المرجع.

---

## 1. نطاق المحرك وموقعه من المشروع

### 1.1 ما الذي يُعنى به هذا الملف

المحرك المحاسبي هو الطبقة التي تُحوِّل كل حدث مالي مسجَّل في التطبيق إلى **قيد يومية مزدوج** ينعكس في الأستاذ العام `general_ledger` ومن ثَمَّ في القوائم المالية.

```
مصدر الحدث المالي
        ↓
  [المحرك المحاسبي]
        ↓
  journal_entries  ←→  journal_entry_lines
        ↓
   general_ledger (VIEW)
        ↓
  قوائم مالية (P&L · ميزانية · كشف حساب)
```

### 1.2 ما الذي لا يُغطيه هذا الملف

- تفاصيل واجهة المستخدم لإدخال البيانات — هذه مغطاة في ملفات EPC الخاصة بكل Epic.
- قواعد التحقق من صحة النماذج (Zod schemas) — مغطاة في STR-005.
- هيكل قاعدة البيانات — مغطى في STR-002.
- إرشادات التصميم البصري — مغطاة في STR-004.

### 1.3 المصادر التي تُولِّد قيوداً

ستة مصادر فقط تُولِّد قيوداً في هذا النظام، وكل واحد منها يُسجَّل في `source_type`:

| source_type | الجدول المصدري | Sprint التنفيذ |
|-------------|---------------|----------------|
| `transaction` | `transactions` | Sprint 6 |
| `lease_payment` | `lease_payments` | Sprint 6 |
| `property_expense` | `property_expenses` | Sprint 6 |
| `capital_transaction` | `capital_transactions` | Sprint 6 |
| `project_transaction` | `project_transactions` | ما بعد MVP |
| `manual` | لا يوجد — القيد مدخل يدوياً | Sprint 6 |

---

## 2. دليل الحسابات — Chart of Accounts (IFRS 18)

### 2.1 معيار التصنيف — IFRS 18

دليل الحسابات مبني وفق **IFRS 18** (صدر أبريل 2024، يسري من يناير 2027) الذي استبدل IAS 1.
التغيير الجوهري: إلزامية تصنيف جميع بنود قائمة الدخل ضمن ثلاث فئات محددة:

```
فئة التشغيل   (Operating)   ← النشاط الرئيسي — الإيجارات · المحافظ · المصروفات التشغيلية
فئة الاستثمار (Investing)   ← عوائد الأصول المستقلة — بيع عقار · عوائد استثمارات
فئة التمويل   (Financing)   ← من الالتزامات المالية — فوائد أي تمويل
```

ومنها يُشتق المؤشر الإلزامي الجديد في IFRS 18:
```
إيرادات التشغيل − مصروفات التشغيل = ربح التشغيل  ←  مؤشر إلزامي جديد
```

### 2.2 الهيكل الهرمي الكامل

```
════════════════════════════════════════════════
  الميزانية العمومية
════════════════════════════════════════════════

1000  الأصول                              [asset     · debit  · is_postable=false]
  1100  الأصول المتداولة                  [asset     · debit  · is_postable=false]
    1110  النقدية — USD                    [asset     · debit  · is_postable=true ] ★
    1120  النقدية — SYP                    [asset     · debit  · is_postable=true ] ★
    1130  الذمم المدينة التجارية           [asset     · debit  · is_postable=true ]
    1140  أصول متداولة أخرى               [asset     · debit  · is_postable=true ]
  1200  الأصول غير المتداولة              [asset     · debit  · is_postable=false]
    1210  العقارات الاستثمارية             [asset     · debit  · is_postable=true ] ★
    1220  الاستثمارات المالية              [asset     · debit  · is_postable=true ]
    1230  أصول غير متداولة أخرى           [asset     · debit  · is_postable=true ]

2000  الخصوم                              [liability · credit · is_postable=false]
  2100  الخصوم المتداولة                  [liability · credit · is_postable=false]
    2110  الذمم الدائنة التجارية          [liability · credit · is_postable=true ]
    2120  مصروفات مستحقة الدفع            [liability · credit · is_postable=true ] ★
    2130  إيرادات مؤجلة                   [liability · credit · is_postable=true ]
  2200  الخصوم غير المتداولة              [liability · credit · is_postable=false]
    2210  التزامات طويلة الأجل             [liability · credit · is_postable=true ]

3000  حقوق الشركاء                        [equity    · credit · is_postable=false]
  3100  رأس المال                          [equity    · credit · is_postable=false]
    3110  رأس مال شريك أ                   [equity    · credit · is_postable=true ] ★
    3120  رأس مال شريك ب                   [equity    · credit · is_postable=true ] ★
    31XX  رأس مال شريك ج ...               [equity    · credit · is_postable=true ] ★
  3200  المسحوبات                          [equity    · debit  · is_postable=false]
    3210  مسحوبات شريك أ                   [equity    · debit  · is_postable=true ] ★
    3220  مسحوبات شريك ب                   [equity    · debit  · is_postable=true ] ★
  3300  الأرباح المحتجزة                   [equity    · credit · is_postable=true ]

════════════════════════════════════════════════
  قائمة الدخل — IFRS 18
════════════════════════════════════════════════

──── فئة التشغيل (Operating) ──────────────────

4000  إيرادات التشغيل                     [revenue   · credit · is_postable=false]
  4100  إيرادات الإيجار                    [revenue   · credit · is_postable=true ] ★
  4200  إيرادات المشاريع                   [revenue   · credit · is_postable=true ]
  4300  إيرادات المحافظ                    [revenue   · credit · is_postable=true ] ★
  4400  إيرادات تشغيلية أخرى              [revenue   · credit · is_postable=true ]

7000  مصروفات التشغيل                     [expense   · debit  · is_postable=false]
  7100  مصروفات العقارات                   [expense   · debit  · is_postable=false]
    7110  مصروفات الصيانة                 [expense   · debit  · is_postable=true ] ★
    7120  مصروفات المرافق                 [expense   · debit  · is_postable=true ] ★
    7130  الضرائب والرسوم العقارية         [expense   · debit  · is_postable=true ] ★
    7140  مصروفات عقارية أخرى             [expense   · debit  · is_postable=true ]
  7200  مصروفات المشاريع                  [expense   · debit  · is_postable=true ]
  7300  مصروفات المحافظ                   [expense   · debit  · is_postable=true ] ★
  7400  مصروفات إدارية وعمومية            [expense   · debit  · is_postable=true ]
  7500  مصروفات تشغيلية أخرى             [expense   · debit  · is_postable=true ]

──── فئة الاستثمار (Investing) ────────────────

5000  إيرادات الاستثمار                   [revenue   · credit · is_postable=false]
  5100  أرباح التصرف في الأصول            [revenue   · credit · is_postable=true ]
  5200  عوائد الاستثمارات المالية          [revenue   · credit · is_postable=true ]
  5300  إيرادات استثمارية أخرى            [revenue   · credit · is_postable=true ]

8000  مصروفات الاستثمار                   [expense   · debit  · is_postable=false]
  8100  خسائر التصرف في الأصول            [expense   · debit  · is_postable=true ]
  8200  انخفاض قيمة الأصول               [expense   · debit  · is_postable=true ]

──── فئة التمويل (Financing) ──────────────────

6000  إيرادات التمويل                     [revenue   · credit · is_postable=false]
  6100  إيرادات فوائد                     [revenue   · credit · is_postable=true ]

9000  مصروفات التمويل                     [expense   · debit  · is_postable=false]
  9100  مصاريف فوائد                      [expense   · debit  · is_postable=true ]
  9200  مصاريف تمويلية أخرى              [expense   · debit  · is_postable=true ]
```

> ★ الحسابات الأكثر استخداماً في قوالب القيود الموثَّقة في هذه الوثيقة.

### 2.3 قاعدة الرصيد الطبيعي

```
الأصول      → رصيد طبيعي مدين   → يزيد بـ debit_amount
الخصوم      → رصيد طبيعي دائن   → يزيد بـ credit_amount
حقوق ملكية  → رصيد طبيعي دائن   → يزيد بـ credit_amount
الإيرادات   → رصيد طبيعي دائن   → يزيد بـ credit_amount
المصروفات   → رصيد طبيعي مدين   → يزيد بـ debit_amount
```

**استثناء:** حسابات المسحوبات (`3200`) رصيدها الطبيعي **مدين** رغم انتمائها لمجموعة حقوق الملكية — لأنها تُقلِّصها.

### 2.4 قاعدة إنشاء حسابات الشركاء

لكل شريك جديد يُضاف للنظام، يجب إنشاء حسابين:
- حساب رأس مال: `31XX` (رقم تسلسلي)
- حساب مسحوبات: `32XX`

يُنشآن **تلقائياً في الخلفية** عند أول ربط للشريك بكيان — المستخدم لا يتدخل يدوياً.

---

## 3. دورة حياة الفترة المحاسبية

### 3.1 حالات الفترة

```
open → closed → locked
  ↑        ↓
  └────────┘  (قابلة للعكس: closed → open)
              (locked: نهائية — لا عودة)
```

| الحالة | المعنى | الترحيل مسموح؟ | التراجع مسموح؟ |
|--------|--------|----------------|-----------------|
| `open` | مفتوحة للعمل اليومي | ✅ نعم | ✅ نعم |
| `closed` | مُقفلة مؤقتاً (مراجعة) | ❌ لا | ✅ نعم → open |
| `locked` | مُقفلة نهائياً بعد إعداد القوائم | ❌ لا | ❌ لا |

### 3.2 تحديد الفترة لأي قيد

```
period_id = accounting_periods
  WHERE start_date <= entry_date
    AND end_date   >= entry_date
    AND status = 'open'
  LIMIT 1
```

إذا لم تُوجد فترة مفتوحة تحتوي التاريخ → يُرفض الترحيل.

---

## 4. دورة حياة القيد اليومية

### 4.1 الحالات الممكنة

```
  [إنشاء القيد]
        ↓
     draft ──────────────────────────────────────►  (حذف مسموح)
        │
        │  [التحقق من التوازن + الفترة المفتوحة]
        ↓
     posted ──────────────────────────────────────►  (لا تعديل ولا حذف)
        │
        │  [قيد عكسي جديد يُنشأ]
        ↓
    reversed  ←──  journal_entry (reversal_of = id الأصلي)
```

### 4.2 شروط الترحيل (draft → posted)

يجب أن تتحقق **جميع** هذه الشروط:

```
① مجموع debit_amount لجميع السطور = مجموع credit_amount لجميع السطور
② عدد السطور >= 2
③ كل سطر: (debit_amount > 0 AND credit_amount = 0)
           OR (credit_amount > 0 AND debit_amount = 0)
④ كل account_id يشير لحساب is_postable = true
⑤ الفترة المحاسبية status = 'open'
⑥ entry_date يقع ضمن [period.start_date, period.end_date]
```

### 4.3 القيد العكسي (Reversal)

القيد العكسي هو النهج الوحيد لتصحيح قيد مُرحَّل. لا تعديل على سطوره.

**آلية العكس:**
1. يُنشأ قيد جديد بنفس السطور مع **تبديل المدين والدائن**.
2. يُضبط `reversal_of = id` القيد الأصلي.
3. يُحدَّث القيد الأصلي: `status = 'reversed'`.
4. يُرحَّل القيد الجديد.

إذا كانت الفترة الأصلية `locked` → يُرحَّل القيد العكسي في أول فترة مفتوحة لاحقة.

---

## 5. قوالب القيود — Journal Entry Templates

> **ملاحظة:** جميع أرقام الحسابات أدناه مُحدَّثة وفق IFRS 18 (v1.1).
> النمط: حساب النقدية يتحدد بالعملة — 1110 لـ USD · 1120 لـ SYP.

---

### 5.1 معاملات المحفظة — `source_type: 'transaction'`

#### دخل (income)
```
مدين:  1110  النقدية USD          [amount]
دائن:  4300  إيرادات المحافظ     [amount]
```

#### مصروف (expense)
```
مدين:  7300  مصروفات المحافظ     [amount]
دائن:  1110  النقدية USD          [amount]
```

#### تحويل (transfer) — MVP: صف واحد
```
مدين:  1110  النقدية USD (الوجهة)  [amount]
دائن:  1110  النقدية USD (المصدر)  [amount]
```

**ربط المصدر:**
```
source_type = 'transaction' · source_id = transactions.id
transactions.journal_entry_id = journal_entries.id
```

---

### 5.2 دفعات الإيجار — `source_type: 'lease_payment'`

```
مدين:  1110  النقدية USD          [amount]
دائن:  4100  إيرادات الإيجار     [amount]
```
> عملة SYP → الحساب المُدان: `1120 النقدية SYP`

**ربط المصدر:**
```
source_type = 'lease_payment' · source_id = lease_payments.id
lease_payments.journal_entry_id = journal_entries.id
```

---

### 5.3 مصروفات العقار — `source_type: 'property_expense'`

يُحدَّد حساب المصروف حسب `property_expenses.type`:

| type | الحساب المُدان |
|------|----------------|
| `maintenance` | 7110 مصروفات الصيانة |
| `utilities` | 7120 مصروفات المرافق |
| `tax` | 7130 الضرائب والرسوم العقارية |
| `fees` | 7140 مصروفات عقارية أخرى |

**عند تحديد محفظة (`portfolio_id IS NOT NULL`):**
```
مدين:  71XX  [حسب النوع أعلاه]    [amount]
دائن:  1110  النقدية USD           [amount]
```

**عند عدم تحديد محفظة (`portfolio_id IS NULL`):**
```
مدين:  71XX  [حسب النوع أعلاه]    [amount]
دائن:  2120  مصروفات مستحقة الدفع [amount]
```

**ربط المصدر:**
```
source_type = 'property_expense' · source_id = property_expenses.id
property_expenses.journal_entry_id = journal_entries.id
```

---

### 5.4 الحركات الرأسمالية — `source_type: 'capital_transaction'`

#### ضخ رأسمال (capital_injection)
```
مدين:  1110  النقدية USD           [amount]
دائن:  31XX  رأس مال الشريك [X]    [amount]
```

#### إنقاص رأسمال (capital_reduction)
```
مدين:  31XX  رأس مال الشريك [X]    [amount]
دائن:  1110  النقدية USD           [amount]
```

#### مسحوبات شخصية (drawing)
```
مدين:  32XX  مسحوبات الشريك [X]    [amount]
دائن:  1110  النقدية USD           [amount]
```

#### توزيع أرباح (profit_share) — ينشأ تلقائياً عند تأكيد التسوية
```
مدين:  4100/4300  إيرادات الكيان  [partnerAmount]
دائن:  31XX       رأس مال الشريك  [partnerAmount]
```

#### تحمُّل خسارة (loss_share)
```
مدين:  31XX  رأس مال الشريك [X]    [amount]
دائن:  7300/7100  مصروفات الكيان  [amount]
```

**ربط المصدر:**
```
source_type = 'capital_transaction' · source_id = capital_transactions.id
capital_transactions.journal_entry_id = journal_entries.id
```

---

### 5.5 القيود اليدوية — `source_type: 'manual'`

```
source_id = NULL
```
المستخدم يختار الحسابات والمبالغ يدوياً.
شرط التوازن (§ 4.2 بند ①) يبقى سارياً دون استثناء.

---

## 6. معالجة العملات في القيود

### 6.1 المبدأ الأساسي

المبالغ مُخزَّنة **بعملتها الأصلية** في سطور القيد — لا تحويل تلقائي في قاعدة البيانات.

| حالة المعاملة | currency في السطر | exchange_rate |
|---------------|-------------------|---------------|
| معاملة USD | `USD` | `NULL` |
| معاملة SYP | `SYP` | قيمة السعر لحظة التسجيل |

### 6.2 حساب المبلغ المكافئ بالـ USD (طبقة التطبيق فقط)

```typescript
function toUSD(amount: number, currency: 'USD' | 'SYP', exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (!exchangeRate || exchangeRate <= 0) throw new Error('exchange_rate required for SYP');
  return amount / exchangeRate;
}
```

### 6.3 قاعدة اختيار حساب النقدية

```
currency = 'USD'  →  1110  النقدية USD
currency = 'SYP'  →  1120  النقدية SYP
```

---

## 7. معادلة رأس المال الختامي

### 7.1 المعادلة

```
رأس المال الختامي
  = opening_balance
  + Σ capital_injection
  + Σ profit_share
  − Σ loss_share
  − Σ drawing
  − Σ capital_reduction
```

### 7.2 التطبيق في TypeScript

```typescript
function calcClosingBalance(b: {
  openingBalance: number;
  injections:     number;
  profitShares:   number;
  lossShares:     number;
  drawings:       number;
  reductions:     number;
}): number {
  return (
    b.openingBalance
    + b.injections
    + b.profitShares
    - b.lossShares
    - b.drawings
    - b.reductions
  );
}
```

### 7.3 استعلام Supabase

```typescript
const { data: account } = await supabase
  .from('partner_capital_accounts')
  .select(`
    id, opening_balance, currency,
    capital_transactions ( type, amount, currency, exchange_rate )
  `)
  .eq('partner_id', partnerId)
  .eq('entity_type', entityType)
  .eq('entity_id', entityId)
  .single();

const totals = account.capital_transactions.reduce(
  (acc, ct) => {
    const usd = toUSD(ct.amount, ct.currency, ct.exchange_rate);
    switch (ct.type) {
      case 'capital_injection': acc.injections  += usd; break;
      case 'profit_share':      acc.profitShares += usd; break;
      case 'loss_share':        acc.lossShares   += usd; break;
      case 'drawing':           acc.drawings     += usd; break;
      case 'capital_reduction': acc.reductions   += usd; break;
    }
    return acc;
  },
  { injections: 0, profitShares: 0, lossShares: 0, drawings: 0, reductions: 0 }
);
```

---

## 8. تسويات الأرباح — Profit Settlements

### 8.1 دورة الحياة

```
draft ──────────────────────►  (قابل للتعديل — لم تُنشأ قيود بعد)
   │
   │  [المستخدم يؤكد التسوية]
   ▼
confirmed  →  تُنشأ capital_transactions تلقائياً لكل شريك
              ثم تُرحَّل القيود المحاسبية لكل حركة
```

### 8.2 خوارزمية احتساب الحصص

```typescript
const partnerAmount = total_profit * (share_numerator / share_denominator);
// تحقق: Σ partnerAmount = total_profit  ← قبل التأكيد
```

### 8.3 الروابط بين الجداول عند التأكيد

```
profit_settlements (confirmed)
    └──► settlement_shares (لكل شريك)
              └──► capital_transactions (type='profit_share')
                        └──► journal_entries (source_type='capital_transaction')
                                  └──► journal_entry_lines
```

### 8.4 قيد التسوية لكل شريك

```
مدين:  4100/4300  إيرادات الكيان   [partnerAmount]
دائن:  31XX       رأس مال الشريك   [partnerAmount]
```

---

## 9. الأستاذ العام — General Ledger

### 9.1 مصدر البيانات

`general_ledger` هو **VIEW** لا جدول، يعرض فقط القيود ذات `status = 'posted'`.

```sql
CREATE VIEW general_ledger AS
SELECT
  a.code            AS account_code,
  a.name            AS account_name,
  a.account_class,
  a.normal_balance,
  ap.fiscal_year,
  ap.period_number,
  ap.name           AS period_name,
  je.entry_date,
  je.reference_no,
  je.description    AS entry_description,
  jel.description   AS line_description,
  jel.debit_amount,
  jel.credit_amount,
  jel.currency,
  jel.exchange_rate,
  je.source_type,
  je.source_id
FROM journal_entry_lines jel
JOIN journal_entries     je  ON je.id  = jel.journal_entry_id
JOIN accounts            a   ON a.id   = jel.account_id
JOIN accounting_periods  ap  ON ap.id  = je.period_id
WHERE je.status = 'posted'
ORDER BY a.code, je.entry_date, je.id;
```

### 9.2 رصيد الحساب في تاريخ محدد

```sql
SELECT
  CASE a.normal_balance
    WHEN 'debit'  THEN SUM(debit_amount)  - SUM(credit_amount)
    WHEN 'credit' THEN SUM(credit_amount) - SUM(debit_amount)
  END AS balance
FROM general_ledger gl
JOIN accounts a ON a.code = gl.account_code
WHERE gl.account_code = :accountCode
  AND gl.entry_date  <= :asOfDate
```

---

## 10. قواعد التكامل مع مصادر البيانات

### 10.1 تسلسل العمليات عند الترحيل

```
1. التحقق من journal_entry_id IS NULL  (منع الترحيل المزدوج)
2. إنشاء صف في journal_entries (status='draft')
3. إنشاء سطور القيد في journal_entry_lines
4. التحقق من التوازن: Σ debit = Σ credit
5. التحقق من فتح الفترة: period.status = 'open'
6. تحديث status → 'posted'
7. تحديث source_table.journal_entry_id = journal_entry.id
```

> الخطوات 1–7 تتم في **transaction واحدة** (Supabase RPC).

### 10.2 منع الترحيل المزدوج

```typescript
const { data: existing } = await supabase
  .from('journal_entries')
  .select('id')
  .eq('source_type', sourceType)
  .eq('source_id', sourceId)
  .neq('status', 'reversed')
  .maybeSingle();

if (existing) throw new Error('ALREADY_POSTED');
```

### 10.3 حالة الترحيل في الواجهة

```typescript
const isPosted = (record: { journal_entry_id: string | null }): boolean =>
  record.journal_entry_id !== null;
```

---

## 11. القيود الخاصة بالمشروع

### 11.1 خصائص شركة المحاصة

- لا رأسمال موحَّد للشركة — الرأسمال موزَّع على شركاء × كيانات.
- لا إقفال سنوي بقيد ترحيل موحَّد — يُوزَّع عبر `profit_settlements`.
- حسابات رأس المال مستقلة لكل كيان.

### 11.2 العملة المرجعية

- USD هي العملة المرجعية في جميع التقارير.
- التحويل يتم في TypeScript لحظة العرض — لا في قاعدة البيانات.

### 11.3 حدود MVP

| الميزة | الحالة |
|--------|--------|
| ترحيل `transactions` | ✅ Sprint 6 |
| ترحيل `lease_payments` | ✅ Sprint 6 |
| ترحيل `property_expenses` | ✅ Sprint 6 |
| ترحيل `capital_transactions` | ✅ Sprint 6 |
| قيود يدوية (`manual`) | ✅ Sprint 6 |
| عكس القيود (Reversal) | ✅ Sprint 6 |
| ترحيل `project_transactions` | ⏸️ ما بعد MVP |
| إقفال فترات سنوي تلقائي | ⏸️ يدوي في MVP |
| إدارة دليل الحسابات من الواجهة | 🔒 S-083 — أزرار خاملة في MVP |

---

## 12. ربط القصص بالمحرك — Story Mapping

| القصة | العنوان | الاعتماد على هذه الوثيقة |
|--------|---------|--------------------------|
| S-048 | إنشاء حساب رأس مال | القسم 7 — معادلة رأس المال |
| S-049 | تسجيل حركة رأسمالية | القسم 5.4 — قوالب الحركات الرأسمالية |
| S-050 | كشف حساب رأسمالي | القسم 7 — حساب الرصيد |
| S-051 | حساب رأس المال الختامي | القسم 7.2 — TypeScript |
| S-052 | نموذج إنشاء تسوية أرباح | القسم 8 — دورة التسويات |
| S-053 | احتساب حصص التسوية | القسم 8.2 — الخوارزمية |
| S-054 | تأكيد التسوية | القسم 8.3 — ربط الجداول |
| S-055 | ربط settlement_shares | القسم 8.4 — قيود التسوية |
| S-083 | صفحة دليل الحسابات (إعدادات) | القسم 2 — الهيكل الهرمي |

---

## 13. قائمة التحقق قبل كل قيد

```
[ ] 1. هل source_type و source_id محددان؟ (أو هو قيد manual؟)
[ ] 2. هل journal_entry_id IS NULL في المصدر؟ (منع التكرار)
[ ] 3. هل entry_date يقع ضمن فترة محاسبية مفتوحة؟
[ ] 4. هل القالب الصحيح مُطبَّق؟ (القسم 5)
[ ] 5. هل حساب النقدية صحيح؟ (1110 USD · 1120 SYP)
[ ] 6. هل مجموع debit = مجموع credit؟
[ ] 7. هل جميع الحسابات is_postable = true؟
[ ] 8. هل عدد السطور >= 2؟
[ ] 9. هل تم تحديث journal_entry_id في جدول المصدر بعد الترحيل؟
[ ] 10. هل العملية ملفوفة في transaction واحدة (Supabase RPC)؟
```

---

## 14. سجل التغييرات — Changelog

| التاريخ | الإصدار | التغيير |
|---------|---------|---------|
| 2026-06-08 | 1.0 | إنشاء الوثيقة — المحرك المحاسبي الكامل لـ Sprint 6 |
| 2026-06-08 | 1.1 | تحديث دليل الحسابات وفق IFRS 18: فصل قائمة الدخل إلى ثلاث فئات (4000/7000 تشغيل · 5000/8000 استثمار · 6000/9000 تمويل) · إضافة مجموعة 2200 للخصوم غير المتداولة · إضافة 3300 الأرباح المحتجزة · تحديث جميع قوالب القيود بالأرقام الجديدة · إضافة S-083 لجدول Story Mapping |