# Family CFO — المحرك المحاسبي
**الوثيقة:** STR-006
**الإصدار:** 1.4
**الحالة:** ✅ معتمدة
**آخر تحديث:** 2026-06-15

> **قاعدة إلزامية:** أي قصة (Story) تتعلق بترحيل القيود أو حسابات الورثة أو التسويات
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
  قوائم مالية (P&L · ميزانية · كشف حساب · صافي قيمة الأصول NAV)
```

### 1.2 طبيعة الكيان ← **محدَّث v1.4**

Family CFO منصة لإدارة **ثروة عائلية** تنطبق عليها الخصائص الآتية:

- الورثة (المستفيدون) هم أصحاب الحقوق في الثروة — حصصهم محددة بالميراث وثابتة قانوناً.
- الأصول تُدار لصالح الورثة لا لتحقيق ربح تجاري — الهدف صون الثروة وتنميتها.
- لا رأسمال مُضخ تقليدياً — أي أموال يضعها وارث في الصندوق هي **قرض** لا مساهمة رأسمالية.
- لا إقفال سنوي بقيد موحَّد — التوزيعات تتم عبر تسويات دورية حسب الحاجة.
- حسابات الاستحقاق (حقوق كل وارث) محسوبة لكل أصل بشكل مستقل.
- **المعيار المرجعي:** IFRS 9 (الأدوات المالية) + IFRS 13 (القياس بالقيمة العادلة) + IFRS 18 (عرض القوائم).

### 1.3 المصادر التي تُولِّد قيوداً ← **محدَّث v1.4**

| source_type | الجدول المصدري | ملاحظة |
|-------------|---------------|--------|
| `transaction` | `transactions` | معاملات المحافظ |
| `lease_payment` | `lease_payments` | دفعات الإيجار |
| `property_expense` | `property_expenses` | مصروفات العقارات |
| `capital_transaction` | `capital_transactions` | حركات رأسمالية |
| `profit_settlement` | `profit_settlements` | تسوية أرباح مؤكَّدة |
| `settlement` | — | تسويات أخرى |
| `reversal` | — | قيد عكسي تلقائي |
| `closing` | — | قيد إقفال فترة |
| `project_transaction` | `project_transactions` | ما بعد MVP |
| `manual` | NULL | قيد يدوي مباشر |

---

## 2. دليل الحسابات — Chart of Accounts (IFRS 18)

### 2.1 معيار التصنيف

دليل الحسابات مبني وفق **IFRS 18** مع مراعاة متطلبات **IFRS 9** لتصنيف الأدوات المالية.
فئات قائمة الدخل الثلاث الإلزامية:

```
فئة التشغيل   (Operating)   ← الإيجارات · إيرادات الأصول التشغيلية
فئة الاستثمار (Investing)   ← عوائد الأصول المالية · مكاسب/خسائر البيع
فئة التمويل   (Financing)   ← أي تمويل خارجي
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
  2300  قروض الورثة                       [liability · credit · is_postable=false]
    23XX  قرض وارث أ                       [liability · credit · is_postable=true ] ★
    23XX  قرض وارث ب                       [liability · credit · is_postable=true ] ★

3000  حقوق الاستحقاق (الورثة)             [equity    · credit · is_postable=false]
  3100  حصص الاستحقاق                     [equity    · credit · is_postable=false]
    31XX  حصة وارث أ                       [equity    · credit · is_postable=true ] ★
    31XX  حصة وارث ب                       [equity    · credit · is_postable=true ] ★
  3200  التوزيعات المسحوبة                [equity    · debit  · is_postable=false]
    32XX  توزيعات وارث أ                   [equity    · debit  · is_postable=true ] ★
    32XX  توزيعات وارث ب                   [equity    · debit  · is_postable=true ] ★
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

### 2.3 قاعدة الرصيد الطبيعي

```
الأصول      → رصيد طبيعي مدين
الخصوم      → رصيد طبيعي دائن
حقوق ملكية  → رصيد طبيعي دائن
الإيرادات   → رصيد طبيعي دائن
المصروفات   → رصيد طبيعي مدين
```

**استثناء:** حسابات التوزيعات المسحوبة (`3200`) رصيدها الطبيعي **مدين** رغم انتمائها لحقوق الاستحقاق.

### 2.4 قاعدة إنشاء حسابات الورثة ← **محدَّث v1.4**

لكل وارث جديد يُضاف إلى جدول `people`، يُنشأ تلقائياً **ثلاثة** حسابات:
- حساب الاستحقاق: `31XX` — equity · credit-normal
- حساب التوزيعات: `32XX` — equity · debit-normal
- حساب قرض الوارث: `23XX` — liability · credit-normal

**التوقيت:** `AFTER INSERT ON people` — فوري قبل أي ربط بكيان.

```sql
CREATE OR REPLACE FUNCTION auto_create_partner_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id          uuid;
  v_capital_parent_id   uuid;
  v_drawings_parent_id  uuid;
  v_loan_parent_id      uuid;
  v_max_capital_code    integer;
  v_max_drawings_code   integer;
  v_max_loan_code       integer;
  v_next_capital_code   text;
  v_next_drawings_code  text;
  v_next_loan_code      text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM accounts WHERE metadata->>'partner_id' = NEW.id::text
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_company_id FROM company LIMIT 1;

  SELECT id INTO v_capital_parent_id  FROM accounts WHERE code = '3100' LIMIT 1;
  SELECT id INTO v_drawings_parent_id FROM accounts WHERE code = '3200' LIMIT 1;
  SELECT id INTO v_loan_parent_id     FROM accounts WHERE code = '2300' LIMIT 1;

  SELECT COALESCE(MAX(code::integer), 3100) INTO v_max_capital_code
  FROM accounts WHERE code LIKE '31%' AND is_postable = true;

  SELECT COALESCE(MAX(code::integer), 3200) INTO v_max_drawings_code
  FROM accounts WHERE code LIKE '32%' AND is_postable = true;

  SELECT COALESCE(MAX(code::integer), 2300) INTO v_max_loan_code
  FROM accounts WHERE code LIKE '23%' AND is_postable = true;

  v_next_capital_code  := (v_max_capital_code  + 1)::text;
  v_next_drawings_code := (v_max_drawings_code + 1)::text;
  v_next_loan_code     := (v_max_loan_code     + 1)::text;

  INSERT INTO accounts (company_id, code, name, account_class, normal_balance,
                        level, is_postable, parent_id, metadata)
  VALUES
    (v_company_id, v_next_capital_code,
     U&'\062D\0635\0629 ' || NEW.name,
     'equity', 'credit', 3, true, v_capital_parent_id,
     jsonb_build_object('partner_id', NEW.id::text)),
    (v_company_id, v_next_drawings_code,
     U&'\062A\0648\0632\064A\0639\0627\062A ' || NEW.name,
     'equity', 'debit', 3, true, v_drawings_parent_id,
     jsonb_build_object('partner_id', NEW.id::text)),
    (v_company_id, v_next_loan_code,
     U&'\0642\0631\0636 ' || NEW.name,
     'liability', 'credit', 3, true, v_loan_parent_id,
     jsonb_build_object('partner_id', NEW.id::text));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> **تغيير v1.4:** إضافة `company_id` إلى جميع INSERT statements — إلزامي لأن `accounts.company_id NOT NULL` (STR-002 v1.5).
> **تغيير v1.3:** إضافة حساب القرض 23XX (قروض الورثة).
> **تغيير مصطلحي:** رأس مال → حصة · مسحوبات → توزيعات.

#### الحذف المشروط

```sql
CREATE OR REPLACE FUNCTION delete_partner_accounts(p_person_id uuid)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM journal_entry_lines jel
    JOIN accounts a ON a.id = jel.account_id
    WHERE a.metadata->>'partner_id' = p_person_id::text
  ) THEN
    RAISE EXCEPTION 'ACCOUNTS_HAVE_ENTRIES';
  END IF;

  DELETE FROM accounts
  WHERE metadata->>'partner_id' = p_person_id::text;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. دورة حياة الفترة المحاسبية

### 3.1 حالات الفترة

```
open → closed → locked
```

| الحالة | الترحيل | التراجع |
|--------|---------|---------|
| `open` | ✅ | ✅ → open |
| `closed` | ❌ | ✅ → open |
| `locked` | ❌ | ❌ |

### 3.2 تحديد الفترة لأي قيد

```sql
WHERE start_date <= entry_date
  AND end_date   >= entry_date
  AND status = 'open'
LIMIT 1
```

---

## 4. دورة حياة القيد اليومية

### 4.1 الحالات الممكنة ← **محدَّث v1.4**

```
  [إنشاء القيد]
        ↓
     draft  ────── يظهر في صفحة "مراجعة القيود" ──────►  (حذف مسموح)
        │
        │  [المراجعة + الترحيل من صفحة review]
        ↓
     posted  ──────────────────────────────────────────►  (لا تعديل ولا حذف)
        │
        │  [قيد عكسي جديد]
        ↓
    reversed
```

> **مهم:** القيود تُنشأ بحالة `draft` دائماً (S-098). لا ترحيل فوري تلقائي.
> الترحيل يتم يدوياً من صفحة مراجعة القيود (/journal/review).

### 4.2 شروط الترحيل (draft → posted)

```
① مجموع debit_amount = مجموع credit_amount
② عدد السطور >= 2
③ كل سطر: debit XOR credit > 0
④ كل account_id: is_postable = true
⑤ الفترة المحاسبية: status = 'open'
⑥ entry_date ضمن [period.start_date, period.end_date]
```

### 4.3 القيد العكسي

1. قيد جديد بنفس السطور مع تبديل المدين والدائن
2. `reversal_of = id` القيد الأصلي · `source_type = 'reversal'`
3. تحديث القيد الأصلي: `status = 'reversed'`

---

## 5. قوالب القيود

### 5.1 معاملات المحفظة — `source_type: 'transaction'`

#### دخل
```
مدين:  1110  النقدية USD       [amount]
دائن:  4300  إيرادات المحافظ  [amount]
```

#### مصروف
```
مدين:  7300  مصروفات المحافظ  [amount]
دائن:  1110  النقدية USD       [amount]
```

#### تحويل
```
مدين:  1110  النقدية USD (الوجهة)  [amount]
دائن:  1110  النقدية USD (المصدر)  [amount]
```

### 5.2 دفعات الإيجار — `source_type: 'lease_payment'`

```
مدين:  1110  النقدية USD      [amount]
دائن:  4100  إيرادات الإيجار [amount]
```

### 5.3 مصروفات العقار — `source_type: 'property_expense'`

| type | الحساب المُدان |
|------|----------------|
| `maintenance` | 7110 |
| `utilities` | 7120 |
| `tax` | 7130 |
| `fees` | 7140 |

**مع محفظة (portfolio_id IS NOT NULL):**
```
مدين:  71XX  [حسب النوع]       [amount]
دائن:  1110  النقدية USD        [amount]
```

**بدون محفظة (portfolio_id IS NULL):**
```
مدين:  71XX  [حسب النوع]       [amount]
دائن:  2120  مصروفات مستحقة    [amount]
```

### 5.4 الحركات الرأسمالية — `source_type: 'capital_transaction'`

| النوع | مدين | دائن |
|-------|------|------|
| capital_injection | 1110 النقدية | 31XX حصة الوارث |
| capital_reduction | 31XX حصة الوارث | 1110 النقدية |
| drawing | 32XX توزيعات الوارث | 1110 النقدية |
| profit_share | (من قيد التسوية) | 31XX حصة الوارث |
| loss_share | 31XX حصة الوارث | 7XXX مصروفات |

> **ملاحظة ثروة عائلية:** `capital_injection` نادر الاستخدام — الأموال التي يضعها الوارث تُسجَّل عادةً في `23XX قرض الوارث` لا في `31XX حصة الاستحقاق`.

### 5.5 قيود التسوية — `source_type: 'profit_settlement'`

قيد واحد مُركَّب (N+1 سطر):

```
مدين:  4100/4300  إيرادات الكيان   [total_profit]    ← سطر واحد
دائن:  31XX       حصة وارث أ       [partnerAmount_A]  ← سطر لكل وارث
دائن:  31XX       حصة وارث ب       [partnerAmount_B]
...
```

### 5.6 القيود اليدوية — `source_type: 'manual'`

`source_id = NULL` · المستخدم يختار الحسابات يدوياً.

---

## 6. معالجة العملات في القيود

### 6.1 المبدأ

المبالغ مُخزَّنة بعملتها الأصلية — لا تحويل في DB.

```typescript
function toUSD(amount: number, currency: 'USD' | 'SYP', exchangeRate: number | null): number {
  if (currency === 'USD') return amount;
  if (!exchangeRate || exchangeRate <= 0) throw new Error('exchange_rate required for SYP');
  return amount / exchangeRate;
}
```

### 6.2 حساب النقدية حسب العملة

```
USD → 1110 · SYP → 1120
```

---

## 7. معادلة رصيد الوارث الختامي

### 7.1 المعادلة

```
رصيد الاستحقاق الختامي
  = الرصيد الافتتاحي
  + Σ profit_share    (نصيب من التوزيعات)
  − Σ loss_share      (نصيب من الخسائر)
  − Σ drawing         (توزيعات مسحوبة فعلياً)
  ± Σ capital_injection / capital_reduction  (نادر)
```

> **قاعدة الثروة:** المعادلة الأساسية = الرصيد الافتتاحي + نصيب الأرباح − التوزيعات المسحوبة.

### 7.2 التطبيق في TypeScript

```typescript
function calcClosingBalance(b: {
  openingBalance: number;
  profitShares:   number;
  lossShares:     number;
  drawings:       number;
  injections:     number;
  reductions:     number;
}): number {
  return (
    b.openingBalance
    + b.profitShares
    - b.lossShares
    - b.drawings
    + b.injections
    - b.reductions
  );
}
```

---

## 8. تسويات الأرباح / توزيع الدخل

### 8.1 دورة الحياة

```
draft ──► confirmed → capital_transactions لكل وارث → قيد موحَّد
```

### 8.2 حساب حصة كل وارث

```typescript
const amount = total_profit * (share_numerator / share_denominator);
// Σ amounts = total_profit ← يُتحقق قبل التأكيد
```

### 8.3 قيد التسوية — قيد واحد مُركَّب

```
source_type = 'profit_settlement' · source_id = profit_settlements.id
```

**شرط التوازن:**
```
total_profit = Σ partnerAmount_i
```

---

## 9. الأستاذ العام — General Ledger ← **محدَّث v1.4**

### 9.1 تعريف VIEW الحالي (19 عموداً)

```sql
CREATE VIEW general_ledger AS
SELECT
  c.id                      AS company_id,
  a.code                    AS account_code,
  a.name                    AS account_name,
  a.account_class,
  a.normal_balance,
  ap.fiscal_year,
  ap.period_number,
  ap.name                   AS period_name,
  je.entry_date,
  je.reference_no,
  je.description            AS entry_description,
  jel.description           AS line_description,
  jel.debit_amount,
  jel.credit_amount,
  jel.currency,
  jel.exchange_rate,
  je.source_type,
  je.source_id,
  je.status                 AS entry_status
FROM journal_entry_lines     jel
JOIN journal_entries         je  ON je.id  = jel.journal_entry_id
JOIN accounts                a   ON a.id   = jel.account_id
JOIN accounting_periods      ap  ON ap.id  = je.period_id
JOIN company                 c   ON c.id   = a.company_id
WHERE je.status = 'posted'
ORDER BY a.code, je.entry_date, je.id;
```

> **تغيير v1.4 (S-095):** إضافة `company_id` (أول عمود) و`entry_status` (آخر عمود) وJOIN مع جدول `company`.

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
  AND gl.entry_date  <= :asOfDate;
```

---

## 10. قواعد التكامل مع مصادر البيانات

### 10.1 تسلسل العمليات عند الترحيل

```
1. التحقق من journal_entry_id IS NULL (منع الترحيل المزدوج)
2. إنشاء journal_entries (status='draft')
3. إنشاء journal_entry_lines
4. التحقق من التوازن: Σ debit = Σ credit
5. التحقق من فتح الفترة
6. تحديث status → 'posted'
7. تحديث source_table.journal_entry_id = journal_entry.id
```

جميع الخطوات في **transaction واحدة** (RPC).

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

### 10.3 RPCs المعتمدة

| الدالة | الغرض |
|--------|-------|
| `post_journal_entry(source_type, source_id)` | ترحيل قيد من مصدر |
| `post_settlement_entry(settlement_id)` | ترحيل قيد تسوية مُركَّب |
| `delete_partner_accounts(person_id)` | حذف حسابات وارث (مشروط) |

---

## 11. قيود خاصة بالسياق

### 11.1 خصائص إدارة الثروة العائلية ← **محدَّث v1.4**

- حصص الورثة ثابتة بالميراث — لا تتغير بالضخ المالي.
- الأموال التي يضعها الوارث هي **قروض** (23XX) لا مساهمات رأسمالية (31XX).
- الهدف: صافي قيمة أصول (NAV) متنامٍ — لا ربح تجاري.
- التوزيعات دورية حسب توافر السيولة — لا إقفال سنوي إلزامي.
- USD هي العملة المرجعية في جميع التقارير.

### 11.2 بنية القيود

معظم القيود = سطران (مدين + دائن).
الاستثناء الوحيد: قيد تسوية الأرباح = N+1 سطر.

### 11.3 حدود MVP

| الميزة | الحالة |
|--------|--------|
| ترحيل transactions | ✅ |
| ترحيل lease_payments | ✅ |
| ترحيل property_expenses | ✅ |
| ترحيل capital_transactions | ✅ |
| قيود يدوية | ✅ |
| عكس القيود | ✅ |
| إنشاء حسابات الورثة تلقائياً (3 حسابات) | ✅ |
| قيد تسوية موحَّد (N+1) | ✅ |
| draft → review → post workflow | ✅ S-098 |
| general_ledger drill-down | ✅ S-10009 |
| ترحيل project_transactions | ⏸️ |
| إقفال فترات تلقائي | ⏸️ |

---

## 12. المعايير المحاسبية المرجعية ← **محدَّث v1.4**

| المعيار | الموضوع | الأثر |
|---------|---------|-------|
| IFRS 18 | عرض القوائم المالية | تصنيف الدخل: تشغيل · استثمار · تمويل |
| IFRS 9 | الأدوات المالية | تصنيف الأصول الاستثمارية وقياسها |
| IFRS 13 | القياس بالقيمة العادلة | تقييم الأصول الاستثمارية (ذهب · أوراق مالية) |
| IAS 16 | العقارات والمنشآت | الاهتلاك + المراجعة الدورية (STR-007) |
| IAS 8 | التقديرات المحاسبية | معالجة تغييرات الاهتلاك (STR-007) |
| IFRS 15 | الإيرادات | الاعتراف بإيرادات بيع السكراب (STR-007) |

---

## 13. ربط القصص بالمحرك

| القصة | العنوان |
|--------|---------|
| S-048–S-055 | منظومة رأس المال والتسويات |
| S-083 | صفحة دليل الحسابات |
| S-085 | post_journal_entry RPC |
| S-091 | post_settlement_entry RPC |
| S-097 | واجهة دفتر اليومية |
| S-098 | draft mode |
| S-099/S-100 | صفحة مراجعة القيود |
| S-10002 | حسابات قروض الورثة 23XX |
| S-10009 | drill-down دفتر الأستاذ |

---

## 14. قائمة التحقق قبل كل قيد

```
[ ] 1.  source_type و source_id محددان (أو manual)
[ ] 2.  journal_entry_id IS NULL في المصدر
[ ] 3.  entry_date ضمن فترة مفتوحة
[ ] 4.  القالب الصحيح مُطبَّق (§5)
[ ] 5.  حساب النقدية صحيح (1110 USD · 1120 SYP)
[ ] 6.  Σ debit = Σ credit
[ ] 7.  جميع الحسابات is_postable = true
[ ] 8.  عدد السطور >= 2
[ ] 9.  تحديث journal_entry_id في جدول المصدر بعد الترحيل
[ ] 10. العملية في transaction واحدة (RPC)
[ ] 11. [تسوية فقط] Σ partnerAmount = total_profit
```

---

## 15. سجل التغييرات

| التاريخ | الإصدار | التغيير |
|---------|---------|---------|
| 2026-06-08 | 1.0 | إنشاء الوثيقة |
| 2026-06-08 | 1.1 | تحديث COA وفق IFRS 18 |
| 2026-06-11 | 1.2 | تحسينات trigger + قيد تسوية موحَّد |
| 2026-06-14 | 1.3 | إضافة حسابات قروض الورثة 23XX |
| 2026-06-15 | 1.4 | **تحديث شامل للاتساق مع STR-002 v1.5 وSTR-007:** إضافة company_id للـ trigger · تحديث general_ledger VIEW إلى 19 عموداً · توسيع source_type (profit_settlement/settlement/reversal/closing) · تحويل مصطلح "شركة محاصة" إلى "إدارة ثروة عائلية" · تحويل شركاء إلى ورثة · إضافة IFRS 9/13 للمعايير · توثيق draft→review→post workflow · ملاحظة نادر استخدام capital_injection |