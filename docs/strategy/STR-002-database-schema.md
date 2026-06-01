# FinFamily — Database Schema Reference
**Version:** 1.3
**Status:** ✅ Adopted
**Last updated:** 2026-06-01

> **قاعدة إلزامية:** أي جدول جديد يُضاف للتطبيق يجب أن يراجع هذا الملف أولاً لضمان اتساق أسماء الحقول والمفاتيح مع بقية المخطط.

---

## 1. القواعد العامة — Global Conventions

### 1.1 المفاتيح الأساسية — Primary Keys
كل جدول يملك مفتاحاً أساسياً بالاسم `id` من نوع UUID يُولَّد تلقائياً:

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**استثناء واحد:** جداول الربط (Join Tables) التي تجمع كيانَين تستخدم مفتاحاً مركباً:
```sql
PRIMARY KEY (entity_a_id, entity_b_id)
```

---

### 1.2 حقل التوقيت — Timestamps
كل جدول يحتوي على حقل `created_at` في نهاية تعريفه:

```sql
created_at timestamptz DEFAULT now()
```

---

### 1.3 العملات — Currency Fields
أي جدول يحتوي على مبلغ مالي يجب أن يتبع هذا النمط دون استثناء:

```sql
amount        numeric(18,4) NOT NULL CHECK (amount > 0)
currency      text NOT NULL CHECK (currency IN ('USD','SYP'))
exchange_rate numeric(18,4)   -- NULL يعني USD أصلي، لا تحويل مطلوب
```

---

### 1.4 الحصص — Share Fields
أي جدول يمثل حصة شريك يجب أن يستخدم هذين الحقلين بهذه الأسماء بالضبط:

```sql
share_numerator    integer NOT NULL CHECK (share_numerator > 0)
share_denominator  integer NOT NULL CHECK (share_denominator > 0)
```

---

### 1.5 الكيانات المزدوجة — Polymorphic Entity References
عند الإشارة إلى كيان قد يكون محفظة أو عقاراً أو مشروعاً، يُستخدم هذا النمط دائماً:

```sql
entity_type text NOT NULL CHECK (entity_type IN ('portfolio','property','project'))
entity_id   uuid NOT NULL
```

> ملاحظة: لا يوجد FOREIGN KEY مباشر على `entity_id` بسبب الطبيعة متعددة الأنواع — التحقق يتم على مستوى التطبيق.

---

### 1.6 تاريخ الحصص — Share History Pattern
عند الحاجة إلى تعديل حصص الشركاء مع الاحتفاظ بالتاريخ، يُستخدم نمط **Effective Dates** بهذين الحقلين:

```sql
effective_from date NOT NULL            -- تاريخ بدء سريان الحصة
effective_to   date                     -- NULL = الحصة الحالية السارية
```

**قاعدة التعديل:** عند تغيير حصة شريك لا يُحدَّث الصف القائم، بل:
1. يُغلق الصف القديم بتحديد `effective_to = today`
2. يُدرج صف جديد بـ `effective_from = today` و `effective_to = NULL`

**استعلام الحصص الحالية:**
```sql
WHERE effective_to IS NULL
```

**استعلام الحصص في تاريخ محدد:**
```sql
WHERE effective_from <= :date AND (effective_to IS NULL OR effective_to > :date)
```

> هذا النمط مطبَّق على `project_members` فقط. جداول الحصص الأخرى (`portfolio_members`, `property_owners`) لا تحتاجه لأن حصصها لا تتغير بعد التأسيس.

---

### 1.7 القيد المزدوج — Double-Entry Convention

كل حركة مالية في النظام تُسجَّل كقيد يومية مكوَّن من سطرين على الأقل: **مدين (Debit)** و**دائن (Credit)**، ومجموعهما يجب أن يتساوى دائماً.

```
مجموع المدين = مجموع الدائن  ← شرط التوازن الإلزامي
```

#### الأرصدة الطبيعية — Normal Balances

| نوع الحساب | الرصيد الطبيعي | يزيد بـ | يقل بـ |
|------------|----------------|---------|--------|
| أصول (Asset) | مدين | قيد مدين | قيد دائن |
| خصوم (Liability) | دائن | قيد دائن | قيد مدين |
| حقوق ملكية (Equity) | دائن | قيد دائن | قيد مدين |
| إيرادات (Revenue) | دائن | قيد دائن | قيد مدين |
| مصروفات (Expense) | مدين | قيد مدين | قيد دائن |

#### بنية سطر القيد في قاعدة البيانات

```sql
-- سطر واحد = إما مدين أو دائن، ليس الاثنين معاً
debit_amount  numeric(18,4) NOT NULL DEFAULT 0 CHECK (debit_amount  >= 0)
credit_amount numeric(18,4) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0)
-- قيد: أحدهما > 0 والآخر = 0
CHECK (
  (debit_amount > 0 AND credit_amount = 0) OR
  (credit_amount > 0 AND debit_amount = 0)
)
```

#### مصادر القيود — Source Types

كل قيد يومية مرتبط بمصدر واحد يُعرَّف بـ `source_type`:

| source_type | المصدر |
|-------------|--------|
| `manual` | قيد يدوي مباشر |
| `transaction` | معاملة من `transactions` |
| `project_transaction` | معاملة من `project_transactions` |
| `lease_payment` | دفعة إيجار من `lease_payments` |
| `property_expense` | مصروف عقار من `property_expenses` |
| `capital_transaction` | حركة رأسمالية من `capital_transactions` |

> القيود اليدوية: `source_id = NULL`. كل مصادر أخرى: `source_id = id` الصف المُولِّد للقيد.

#### دورة الحياة — Entry Lifecycle

```
draft → posted → reversed
         ↑
    (الوحيدة التي تؤثر في الأرصدة)
```

لا يجوز تعديل قيد بعد ترحيله (`posted`) — يُعكس بقيد عكسي جديد.

---

## 2. جداول التطبيق — Tables

### 2.1 مجموعة الأشخاص — People

#### `people`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `relation` | text | — |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.2 مجموعة المحافظ — Portfolios

#### `portfolios`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `type` | text | NOT NULL · CHECK IN ('cash_usd','cash_syp','gold','project') |
| `description` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `portfolio_members`
جدول ربط — الشركاء في محفظة مع حصصهم

| الحقل | النوع | القيود |
|-------|-------|--------|
| `portfolio_id` | uuid | PK (مركب) · FK → portfolios.id |
| `person_id` | uuid | PK (مركب) · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `joined_date` | date | NOT NULL |

---

#### `transactions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `portfolio_id` | uuid | NOT NULL · FK → portfolios.id |
| `type` | text | NOT NULL · CHECK IN ('income','expense','transfer') |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `category` | text | — |
| `date` | date | NOT NULL |
| `notes` | text | — |
| `journal_entry_id` | uuid | FK → journal_entries.id · NULL قبل الترحيل |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.3 مجموعة العقارات — Properties

#### `properties`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `type` | text | NOT NULL · CHECK IN ('residential','commercial','land') |
| `location` | text | — |
| `purchase_date` | date | — |
| `estimated_value` | numeric(18,4) | — |
| `status` | text | NOT NULL · DEFAULT 'vacant' · CHECK IN ('rented','vacant') |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `property_owners`
جدول ربط — ملاك العقار مع حصصهم وعلة التملك

| الحقل | النوع | القيود |
|-------|-------|--------|
| `property_id` | uuid | PK (مركب) · FK → properties.id |
| `person_id` | uuid | PK (مركب) · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `ownership_basis` | text | NOT NULL · CHECK IN ('إرث','شراء','هبة','وصية','شراكة') |

---

#### `leases`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `property_id` | uuid | NOT NULL · FK → properties.id |
| `tenant_name` | text | NOT NULL |
| `rent_amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `frequency` | text | NOT NULL · CHECK IN ('monthly','annual') |
| `start_date` | date | NOT NULL |
| `end_date` | date | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `lease_payments`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `lease_id` | uuid | NOT NULL · FK → leases.id |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `paid_date` | date | NOT NULL |
| `portfolio_id` | uuid | FK → portfolios.id |
| `journal_entry_id` | uuid | FK → journal_entries.id · NULL قبل الترحيل |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `property_expenses`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `property_id` | uuid | NOT NULL · FK → properties.id |
| `type` | text | NOT NULL · CHECK IN ('tax','maintenance','utilities','fees') |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `due_date` | date | — |
| `paid_date` | date | — |
| `is_recurring` | boolean | NOT NULL · DEFAULT false |
| `frequency` | text | CHECK IN ('monthly','annual','once') |
| `portfolio_id` | uuid | FK → portfolios.id |
| `journal_entry_id` | uuid | FK → journal_entries.id · NULL قبل الترحيل |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.4 مجموعة رأس المال — Capital

#### `partner_capital_accounts`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project') |
| `entity_id` | uuid | NOT NULL |
| `opening_balance` | numeric(18,4) | NOT NULL · DEFAULT 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `opening_date` | date | NOT NULL |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (partner_id, entity_type, entity_id) |

---

#### `capital_transactions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `capital_account_id` | uuid | NOT NULL · FK → partner_capital_accounts.id |
| `type` | text | NOT NULL · CHECK IN ('capital_injection','capital_reduction','drawing','profit_share','loss_share') |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `date` | date | NOT NULL |
| `reference_no` | text | — |
| `journal_entry_id` | uuid | FK → journal_entries.id · NULL قبل الترحيل |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `profit_settlements`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project') |
| `entity_id` | uuid | NOT NULL |
| `period_start` | date | NOT NULL |
| `period_end` | date | NOT NULL |
| `total_profit` | numeric(18,4) | NOT NULL |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `settlement_date` | date | NOT NULL |
| `status` | text | NOT NULL · DEFAULT 'draft' · CHECK IN ('draft','confirmed') |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `settlement_shares`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `settlement_id` | uuid | NOT NULL · FK → profit_settlements.id |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `amount` | numeric(18,4) | NOT NULL · CHECK >= 0 |
| `capital_transaction_id` | uuid | FK → capital_transactions.id |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.5 مجموعة الأسعار والتوزيعات — Rates & Distributions

#### `exchange_rates`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `rate` | numeric(18,4) | NOT NULL · CHECK > 0 — SYP مقابل 1 USD |
| `date` | date | NOT NULL |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `distributions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project') |
| `entity_id` | uuid | NOT NULL |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `date` | date | NOT NULL |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.6 مجموعة المشاريع — Projects

#### `projects`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `description` | text | — |
| `status` | text | NOT NULL · DEFAULT 'planning' · CHECK IN ('planning','active','on_hold','completed','cancelled') |
| `start_date` | date | — |
| `end_date` | date | — |
| `budget_amount` | numeric(18,4) | — |
| `budget_currency` | text | CHECK IN ('USD','SYP') |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `project_members`
جدول شركاء المشروع — يحتفظ بتاريخ الحصص كاملاً (Effective Dates Pattern — راجع القسم 1.6)

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `person_id` | uuid | NOT NULL · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `effective_from` | date | NOT NULL |
| `effective_to` | date | — · NULL = الحصة الحالية السارية |
| `notes` | text | — · سبب التعديل إن وُجد |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (project_id, person_id, effective_from) |

> قاعدة صارمة: مجموع الحصص للصفوف ذات `effective_to IS NULL` لكل مشروع يجب أن يساوي 1. يُتحقق منها بـ Trigger مماثل لـ `portfolio_members`.

---

#### `wbs_items`
هيكل WBS الهرمي — كل صف يمثل بنداً في الـ Work Breakdown Structure

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `parent_id` | uuid | FK → wbs_items.id · NULL = مستوى جذر |
| `code` | text | NOT NULL · مثال: "1" أو "1.2" أو "1.2.3" |
| `name` | text | NOT NULL |
| `level` | integer | NOT NULL · CHECK > 0 · 1 = المستوى الأعلى |
| `description` | text | — |
| `budget_amount` | numeric(18,4) | — |
| `budget_currency` | text | CHECK IN ('USD','SYP') |
| `status` | text | NOT NULL · DEFAULT 'planned' · CHECK IN ('planned','in_progress','completed','cancelled') |
| `order_index` | integer | NOT NULL · DEFAULT 0 · ترتيب العرض بين الأشقاء |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (project_id, code) |

> البنود الجذرية (المستوى الأول) لها `parent_id = NULL`.
> `code` يُدار يدوياً أو يُولَّد تلقائياً من التطبيق — ليس مُحسَّباً في قاعدة البيانات.

---

#### `project_transactions`
الحركات المالية مرتبطة بمشروع وبند WBS

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `wbs_item_id` | uuid | FK → wbs_items.id · NULL = على مستوى المشروع |
| `type` | text | NOT NULL · CHECK IN ('income','expense','transfer') |
| `amount` | numeric(18,4) | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `category` | text | — |
| `date` | date | NOT NULL |
| `journal_entry_id` | uuid | FK → journal_entries.id · NULL قبل الترحيل |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.7 منظومة المحاسبة — Accounting Core

> هذه المجموعة هي العمود الفقري المحاسبي للتطبيق. كل حركة مالية تُولِّد قيد يومية يمر عبر هذه الجداول قبل أن ينعكس في أي قائمة مالية.

---

#### `accounting_periods`
الفترات المحاسبية — تُحدد النوافذ الزمنية المسموح بالترحيل فيها

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `fiscal_year` | integer | NOT NULL · مثال: 2026 |
| `period_number` | integer | NOT NULL · CHECK BETWEEN 1 AND 12 |
| `name` | text | NOT NULL · مثال: "يناير 2026" |
| `start_date` | date | NOT NULL |
| `end_date` | date | NOT NULL |
| `status` | text | NOT NULL · DEFAULT 'open' · CHECK IN ('open','closed','locked') |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (fiscal_year, period_number) |

> **open** = مفتوح للترحيل · **closed** = مُقفَّل مؤقتاً (قابل للفتح) · **locked** = مُقفَّل نهائياً بعد إعداد القوائم المالية

---

#### `accounts`
دليل الحسابات COA — الهيكل الهرمي لجميع الحسابات

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `parent_id` | uuid | FK → accounts.id · NULL = حساب جذري |
| `code` | text | NOT NULL · UNIQUE · مثال: "1100" أو "1110" |
| `name` | text | NOT NULL |
| `account_class` | text | NOT NULL · CHECK IN ('asset','liability','equity','revenue','expense') |
| `normal_balance` | text | NOT NULL · CHECK IN ('debit','credit') |
| `level` | integer | NOT NULL · CHECK > 0 · 1 = مستوى رئيسي |
| `is_postable` | boolean | NOT NULL · DEFAULT false · true = حساب تفصيلي يقبل قيوداً |
| `is_active` | boolean | NOT NULL · DEFAULT true |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (code) |

> الحسابات غير الورقية (لها أبناء) لها `is_postable = false` — لا تقبل سطور قيد مباشرة.
> `normal_balance` مشتق منطقياً من `account_class` لكنه مخزَّن صراحةً لتسريع الاستعلامات.

**الهيكل الافتراضي لشركات الأشخاص:**
```
1000  الأصول              (asset   · debit  · is_postable=false)
  1100  الأصول المتداولة  (asset   · debit  · is_postable=false)
    1110  النقدية USD      (asset   · debit  · is_postable=true)
    1120  النقدية SYP      (asset   · debit  · is_postable=true)
    1130  الذمم المدينة    (asset   · debit  · is_postable=true)
  1200  الأصول الثابتة    (asset   · debit  · is_postable=false)
    1210  العقارات         (asset   · debit  · is_postable=true)
    1220  الاستثمارات      (asset   · debit  · is_postable=true)
2000  الخصوم              (liability · credit · is_postable=false)
  2100  الخصوم المتداولة  (liability · credit · is_postable=false)
    2110  الذمم الدائنة   (liability · credit · is_postable=true)
    2120  مصروفات مستحقة  (liability · credit · is_postable=true)
3000  حقوق الشركاء        (equity  · credit · is_postable=false)
  3100  رأس المال         (equity  · credit · is_postable=false)
    3110  رأس مال شريك أ  (equity  · credit · is_postable=true)
    3120  رأس مال شريك ب  (equity  · credit · is_postable=true)
  3200  المسحوبات          (equity  · debit  · is_postable=false)
    3210  مسحوبات شريك أ  (equity  · debit  · is_postable=true)
4000  الإيرادات            (revenue · credit · is_postable=false)
  4100  إيرادات الإيجار   (revenue · credit · is_postable=true)
  4200  إيرادات المشاريع  (revenue · credit · is_postable=true)
  4300  إيرادات المحافظ   (revenue · credit · is_postable=true)
5000  المصروفات            (expense · debit  · is_postable=false)
  5100  مصروفات التشغيل   (expense · debit  · is_postable=true)
  5200  مصروفات العقارات  (expense · debit  · is_postable=true)
  5300  مصروفات المشاريع  (expense · debit  · is_postable=true)
```

---

#### `journal_entries`
رأس قيود اليومية — سجل كل قيد مع مصدره وحالته

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `period_id` | uuid | NOT NULL · FK → accounting_periods.id |
| `entry_date` | date | NOT NULL |
| `reference_no` | text | — · رقم مرجعي للطباعة |
| `description` | text | NOT NULL |
| `source_type` | text | NOT NULL · CHECK IN ('manual','transaction','project_transaction','lease_payment','property_expense','capital_transaction') |
| `source_id` | uuid | — · NULL للقيود اليدوية |
| `status` | text | NOT NULL · DEFAULT 'draft' · CHECK IN ('draft','posted','reversed') |
| `reversal_of` | uuid | FK → journal_entries.id · NULL إذا لم يكن قيداً عكسياً |
| `created_at` | timestamptz | DEFAULT now() |

> **قيد صارم:** لا يُقبل ترحيل قيد (`status = 'posted'`) إذا كانت الفترة المحاسبية `closed` أو `locked`.
> **قيد التوازن:** Trigger يرفض الترحيل إذا كان مجموع المدين ≠ مجموع الدائن.

---

#### `journal_entry_lines`
سطور القيد — المدين والدائن لكل حساب

| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `journal_entry_id` | uuid | NOT NULL · FK → journal_entries.id |
| `account_id` | uuid | NOT NULL · FK → accounts.id |
| `debit_amount` | numeric(18,4) | NOT NULL · DEFAULT 0 · CHECK >= 0 |
| `credit_amount` | numeric(18,4) | NOT NULL · DEFAULT 0 · CHECK >= 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric(18,4) | — |
| `description` | text | — · وصف اختياري للسطر |
| `created_at` | timestamptz | DEFAULT now() |
| CHECK | — | (debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0) |

> الحساب المستخدم يجب أن يكون `is_postable = true` — يُتحقق على مستوى التطبيق.

---

#### `general_ledger` — VIEW لا جدول

الأستاذ العام ليس جدولاً مستقلاً بل VIEW مشتقة من `journal_entry_lines`:

```sql
CREATE VIEW general_ledger AS
SELECT
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
  je.source_id
FROM journal_entry_lines     jel
JOIN journal_entries         je  ON je.id        = jel.journal_entry_id
JOIN accounts                a   ON a.id         = jel.account_id
JOIN accounting_periods      ap  ON ap.id        = je.period_id
WHERE je.status = 'posted'
ORDER BY a.code, je.entry_date, je.id;
```

---

## 3. خريطة المفاتيح الخارجية — Foreign Key Map

هذا القسم هو المرجع الإلزامي عند إنشاء أي جدول جديد للتأكد من صحة الروابط.

```
accounting_periods
  │
  └──(period_id)──► journal_entries ◄──────────────────────────────────────────┐
                         │                                                       │
                (reversal_of, self-ref)                                         │
                         │                                                       │
                         ▼                                                       │
                  journal_entry_lines                                            │
                  (account_id)▼                                                  │
                         accounts (self-ref: parent_id)                          │
                                                                                 │
people ──────────────────────────────────────────────────────────────────────┐  │
  │                                                                           │  │
  ├──(person_id)──► portfolio_members ◄──(portfolio_id)── portfolios         │  │
  │                                                            │              │  │
  │                                              (portfolio_id)▼              │  │
  │                                                      transactions ────────┼──┘
  │                                                                           │
  ├──(person_id)──► property_owners ◄──(property_id)── properties            │
  │                                                            │              │
  │                                              (property_id) ├──► leases   │
  │                                                            │       │      │
  │                                                            ▼       ▼      │
  │                                              property_expenses  lease_payments
  │                                              (journal_entry_id)▼  (journal_entry_id)▼
  │                                               journal_entries    journal_entries     │
  │                                                                                      │
  ├──(person_id)──► project_members ◄──(project_id)── projects                          │
  │                                                        │                             │
  │                                          (project_id)  ▼                             │
  │                                              wbs_items (self-ref)                    │
  │                                                  │                                   │
  │                                    (wbs_item_id) ▼                                   │
  │                                       project_transactions ──(journal_entry_id)──────┘
  │
  ├──(partner_id)─► partner_capital_accounts ──► capital_transactions ──(journal_entry_id)──► journal_entries
  │                 (entity_id → polymorphic)        ▲
  │                                                  │
  ├──(partner_id)─► settlement_shares ──(capital_transaction_id)────────────┘
  │                       │
  │              (settlement_id)▼
  │              profit_settlements
  │              (entity_id → polymorphic)
  │
  └──(partner_id)─► distributions
                    (entity_id → polymorphic)
```

---

### 3.1 جدول المفاتيح الخارجية — FK Reference Table

| الجدول | الحقل | يشير إلى |
|--------|-------|----------|
| `portfolio_members` | `portfolio_id` | `portfolios.id` |
| `portfolio_members` | `person_id` | `people.id` |
| `transactions` | `portfolio_id` | `portfolios.id` |
| `property_owners` | `property_id` | `properties.id` |
| `property_owners` | `person_id` | `people.id` |
| `leases` | `property_id` | `properties.id` |
| `lease_payments` | `lease_id` | `leases.id` |
| `lease_payments` | `portfolio_id` | `portfolios.id` (nullable) |
| `property_expenses` | `property_id` | `properties.id` |
| `property_expenses` | `portfolio_id` | `portfolios.id` (nullable) |
| `partner_capital_accounts` | `partner_id` | `people.id` |
| `partner_capital_accounts` | `entity_id` | polymorphic — بلا FK |
| `capital_transactions` | `capital_account_id` | `partner_capital_accounts.id` |
| `profit_settlements` | `entity_id` | polymorphic — بلا FK |
| `settlement_shares` | `settlement_id` | `profit_settlements.id` |
| `settlement_shares` | `partner_id` | `people.id` |
| `settlement_shares` | `capital_transaction_id` | `capital_transactions.id` (nullable) |
| `distributions` | `partner_id` | `people.id` |
| `distributions` | `entity_id` | polymorphic — بلا FK |
| `project_members` | `project_id` | `projects.id` |
| `project_members` | `person_id` | `people.id` |
| `wbs_items` | `project_id` | `projects.id` |
| `wbs_items` | `parent_id` | `wbs_items.id` (self-ref, nullable) |
| `project_transactions` | `project_id` | `projects.id` |
| `project_transactions` | `wbs_item_id` | `wbs_items.id` (nullable) |
| `project_transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `lease_payments` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `property_expenses` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `capital_transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `journal_entries` | `period_id` | `accounting_periods.id` |
| `journal_entries` | `reversal_of` | `journal_entries.id` (self-ref, nullable) |
| `journal_entry_lines` | `journal_entry_id` | `journal_entries.id` |
| `journal_entry_lines` | `account_id` | `accounts.id` |
| `accounts` | `parent_id` | `accounts.id` (self-ref, nullable) |

---

### 3.2 سلوك الحذف — ON DELETE Behavior

| العلاقة | السلوك | السبب |
|---------|--------|-------|
| `portfolio_members → portfolios` | CASCADE | حذف المحفظة يحذف أعضاءها |
| `portfolio_members → people` | RESTRICT | لا يُحذف شخص له حصة في محفظة |
| `transactions → portfolios` | RESTRICT | لا تُحذف محفظة فيها معاملات |
| `property_owners → properties` | CASCADE | حذف العقار يحذف بيانات ملكيته |
| `property_owners → people` | RESTRICT | لا يُحذف شخص يملك عقاراً |
| `leases → properties` | RESTRICT | لا يُحذف عقار عليه عقود إيجار |
| `lease_payments → leases` | RESTRICT | لا يُحذف عقد له دفعات مسجّلة |
| `property_expenses → properties` | RESTRICT | لا يُحذف عقار له مصروفات |
| `partner_capital_accounts → people` | RESTRICT | لا يُحذف شريك له حسابات رأسمالية |
| `capital_transactions → partner_capital_accounts` | RESTRICT | لا يُحذف حساب له حركات |
| `settlement_shares → profit_settlements` | CASCADE | حذف التسوية يحذف حصصها |
| `settlement_shares → people` | RESTRICT | لا يُحذف شريك له حصص في تسوية |
| `project_members → projects` | CASCADE | حذف المشروع يحذف سجل الشركاء كاملاً |
| `project_members → people` | RESTRICT | لا يُحذف شخص له حصة في مشروع |
| `wbs_items → projects` | CASCADE | حذف المشروع يحذف كل بنوده |
| `wbs_items → wbs_items (parent)` | RESTRICT | لا يُحذف بند له بنود فرعية |
| `project_transactions → projects` | RESTRICT | لا يُحذف مشروع له معاملات |
| `project_transactions → wbs_items` | RESTRICT | لا يُحذف بند WBS له معاملات مرتبطة |
| `journal_entries → accounting_periods` | RESTRICT | لا تُحذف فترة محاسبية لها قيود |
| `journal_entries → journal_entries (reversal)` | RESTRICT | لا يُحذف القيد الأصلي قبل العكسي |
| `journal_entry_lines → journal_entries` | CASCADE | حذف القيد يحذف سطوره كاملاً |
| `journal_entry_lines → accounts` | RESTRICT | لا يُحذف حساب له سطور قيد |
| `accounts → accounts (parent)` | RESTRICT | لا يُحذف حساب له حسابات فرعية |

---

## 4. ترتيب الإنشاء — Creation Order

يجب إنشاء الجداول بهذا الترتيب لتجنب أخطاء الـ Foreign Key:

```
1.  people
2.  portfolios
3.  portfolio_members
4.  exchange_rates
5.  properties
6.  property_owners
7.  leases
8.  projects
9.  project_members
10. wbs_items              ← يُنشأ بدون FK على parent_id ثم يُضاف بـ ALTER TABLE
11. accounting_periods
12. accounts               ← يُنشأ بدون FK على parent_id ثم يُضاف بـ ALTER TABLE
13. journal_entries        ← يُنشأ بدون FK على reversal_of ثم يُضاف بـ ALTER TABLE
14. journal_entry_lines
15. transactions           ← يحتوي FK على journal_entries
16. project_transactions   ← يحتوي FK على journal_entries و wbs_items
17. lease_payments         ← يحتوي FK على journal_entries
18. property_expenses      ← يحتوي FK على journal_entries
19. partner_capital_accounts
20. capital_transactions   ← يحتوي FK على journal_entries
21. profit_settlements
22. settlement_shares
23. distributions
```

> ثلاثة جداول تحتوي على self-reference: `wbs_items`, `accounts`, `journal_entries` — تُنشأ أولاً بدون قيد الـ FK الذاتي، ثم يُضاف القيد بـ `ALTER TABLE ADD CONSTRAINT` بعد الإنشاء.

---

## 6. قاموس الأعمدة الموحَّد — Canonical Column Dictionary

> **الغرض:** قبل تسمية أي عمود في جدول جديد، ابحث هنا أولاً. إذا وجدت الاسم موجوداً استخدمه كما هو. إذا لم تجده أضفه هنا قبل كتابة الـ migration.

---

### 6.1 قاعدة تسمية المفاتيح الخارجية

```
اسم الجدول المُشار إليه (مفرد، snake_case) + _id
```

| الجدول المُشار إليه | اسم العمود الصحيح | ❌ أسماء خاطئة شائعة |
|---------------------|-------------------|----------------------|
| `people` | `person_id` | `people_id`, `user_id`, `member_id` |
| `people` (في سياق الشراكة) | `partner_id` | `shareholder_id`, `owner_id` |
| `portfolios` | `portfolio_id` | `portfolio`, `wallet_id` |
| `properties` | `property_id` | `asset_id`, `real_estate_id` |
| `projects` | `project_id` | `proj_id` |
| `leases` | `lease_id` | `contract_id`, `rental_id` |
| `wbs_items` | `wbs_item_id` | `wbs_id`, `task_id` |
| `accounts` (COA) | `account_id` | `coa_id`, `gl_account_id` |
| `journal_entries` | `journal_entry_id` | `entry_id`, `journal_id` |
| `accounting_periods` | `period_id` | `fiscal_period_id`, `month_id` |
| `partner_capital_accounts` | `capital_account_id` | `account_id` ← تعارض مع COA |
| `profit_settlements` | `settlement_id` | `profit_id` |
| `exchange_rates` | `exchange_rate_id` | `rate_id`, `fx_id` |

**استثناء الـ Self-Reference:** الجداول التي تشير لنفسها تستخدم `parent_id` دائماً:
```sql
parent_id uuid FK → <نفس الجدول>.id  -- accounts, wbs_items
reversal_of uuid FK → journal_entries.id  -- استثناء واحد بسبب الدلالة
```

---

### 6.2 الأعمدة المالية — Financial Columns

| الاسم الموحَّد | النوع | القاعدة |
|----------------|-------|---------|
| `amount` | numeric(18,4) | المبلغ الأساسي في أي جدول — CHECK > 0 |
| `debit_amount` | numeric(18,4) | المدين في سطر القيد فقط — DEFAULT 0 |
| `credit_amount` | numeric(18,4) | الدائن في سطر القيد فقط — DEFAULT 0 |
| `opening_balance` | numeric(18,4) | الرصيد الافتتاحي — DEFAULT 0 |
| `budget_amount` | numeric(18,4) | الميزانية التقديرية — nullable |
| `rent_amount` | numeric(18,4) | قيمة الإيجار في `leases` — CHECK > 0 |
| `estimated_value` | numeric(18,4) | القيمة التقديرية في `properties` — nullable |
| `total_profit` | numeric(18,4) | إجمالي الربح في `profit_settlements` |
| `rate` | numeric(18,4) | سعر الصرف في `exchange_rates` — CHECK > 0 |
| `exchange_rate` | numeric(18,4) | سعر الصرف لحظة المعاملة — nullable |
| `currency` | text | CHECK IN ('USD','SYP') — دائماً مع `amount` |
| `budget_currency` | text | CHECK IN ('USD','SYP') — مع `budget_amount` فقط |

> ❌ ممنوع: `value`, `price`, `cost`, `sum`, `total` كأسماء أعمدة مستقلة — استخدم الأسماء الموحَّدة أعلاه.

---

### 6.3 أعمدة الحصص — Share Columns

هذان الاسمان لا يتغيران في أي جدول يمثل حصة شريك:

| الاسم الموحَّد | النوع | القيود |
|----------------|-------|--------|
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |

> ❌ ممنوع: `share_percent`, `ownership_ratio`, `stake`, `portion`, `numerator`, `denominator`

---

### 6.4 أعمدة الحالة — Status & Type Columns

| الاسم الموحَّد | الجدول | القيم المسموحة |
|----------------|--------|----------------|
| `status` | `accounting_periods` | open · closed · locked |
| `status` | `journal_entries` | draft · posted · reversed |
| `status` | `profit_settlements` | draft · confirmed |
| `status` | `projects` | planning · active · on_hold · completed · cancelled |
| `status` | `wbs_items` | planned · in_progress · completed · cancelled |
| `status` | `properties` | rented · vacant |
| `type` | `portfolios` | cash_usd · cash_syp · gold · project |
| `type` | `transactions` | income · expense · transfer |
| `type` | `project_transactions` | income · expense · transfer |
| `type` | `capital_transactions` | capital_injection · capital_reduction · drawing · profit_share · loss_share |
| `type` | `properties` | residential · commercial · land |
| `type` | `property_expenses` | tax · maintenance · utilities · fees |
| `account_class` | `accounts` | asset · liability · equity · revenue · expense |
| `normal_balance` | `accounts` | debit · credit |
| `source_type` | `journal_entries` | manual · transaction · project_transaction · lease_payment · property_expense · capital_transaction |
| `entity_type` | متعدد | portfolio · property · project |
| `ownership_basis` | `property_owners` | إرث · شراء · هبة · وصية · شراكة |
| `frequency` | `leases` | monthly · annual |
| `frequency` | `property_expenses` | monthly · annual · once |

> عند إضافة قيمة جديدة لأي CHECK constraint، يجب تحديث هذا الجدول أولاً ثم كتابة الـ migration.

---

### 6.5 أعمدة التواريخ — Date Columns

| الاسم الموحَّد | النوع | الاستخدام |
|----------------|-------|-----------|
| `created_at` | timestamptz | في كل جدول — DEFAULT now() |
| `entry_date` | date | تاريخ القيد المحاسبي في `journal_entries` |
| `paid_date` | date | تاريخ الدفع الفعلي في `lease_payments` |
| `due_date` | date | تاريخ الاستحقاق في `property_expenses` |
| `start_date` | date | تاريخ البداية: `leases`, `projects`, `accounting_periods` |
| `end_date` | date | تاريخ النهاية: `leases`, `projects`, `accounting_periods` |
| `opening_date` | date | تاريخ الافتتاح في `partner_capital_accounts` |
| `settlement_date` | date | تاريخ التسوية في `profit_settlements` |
| `purchase_date` | date | تاريخ الشراء في `properties` |
| `joined_date` | date | تاريخ الانضمام في `portfolio_members` |
| `effective_from` | date | بداية سريان الحصة في `project_members` |
| `effective_to` | date | نهاية سريان الحصة في `project_members` — NULL = سارية |
| `period_start` | date | بداية فترة التسوية في `profit_settlements` |
| `period_end` | date | نهاية فترة التسوية في `profit_settlements` |
| `date` | date | تاريخ عام في: `transactions`, `capital_transactions`, `distributions`, `exchange_rates` |

> ❌ ممنوع: `created`, `timestamp`, `time`, `datetime`, `when`

---

### 6.6 الأعمدة البوليانية — Boolean Columns

| الاسم الموحَّد | الجدول | DEFAULT |
|----------------|--------|---------|
| `is_recurring` | `property_expenses` | false |
| `is_postable` | `accounts` | false |
| `is_active` | `accounts` | true |

**قاعدة التسمية:** الأعمدة البوليانية تبدأ بـ `is_` دائماً.

> ❌ ممنوع: `active`, `postable`, `recurring` بدون البادئة `is_`

---

### 6.7 الأعمدة النصية العامة — Text Columns

| الاسم الموحَّد | الاستخدام |
|----------------|-----------|
| `name` | اسم الكيان الرئيسي في أي جدول |
| `description` | وصف تفصيلي — nullable دائماً |
| `notes` | ملاحظات حرة — nullable دائماً |
| `code` | رمز/رقم مرجعي: `accounts`, `wbs_items` |
| `reference_no` | رقم مرجعي للطباعة: `journal_entries`, `capital_transactions` |
| `relation` | صلة القرابة في `people` |
| `tenant_name` | اسم المستأجر في `leases` |
| `location` | الموقع الجغرافي في `properties` |

---

### 6.8 الأعمدة الرقمية — Numeric Non-Financial Columns

| الاسم الموحَّد | النوع | الاستخدام |
|----------------|-------|-----------|
| `level` | integer | المستوى الهرمي: `accounts`, `wbs_items` — CHECK > 0 |
| `order_index` | integer | ترتيب العرض في `wbs_items` — DEFAULT 0 |
| `period_number` | integer | رقم الشهر 1-12 في `accounting_periods` |
| `fiscal_year` | integer | السنة المالية في `accounting_periods` |

---

### 6.9 قائمة التحقق عند إنشاء جدول جديد

قبل كتابة أي `CREATE TABLE` راجع هذه النقاط بالترتيب:

```
[ ] 1. هل اسم الجدول يعبّر عن الكيان بدقة؟ (مفرد، snake_case)
[ ] 2. هل المفتاح الأساسي هو id uuid DEFAULT gen_random_uuid()؟
[ ] 3. هل كل FK يتبع قاعدة 6.1؟ (table_name_id)
[ ] 4. هل الأعمدة المالية تتبع نمط القسم 6.2؟ (amount + currency + exchange_rate)
[ ] 5. هل أعمدة الحصص تستخدم share_numerator / share_denominator بالضبط؟
[ ] 6. هل أعمدة status / type قيمها موثقة في القسم 6.4؟
[ ] 7. هل أعمدة التواريخ تستخدم الأسماء من القسم 6.5؟
[ ] 8. هل الأعمدة البوليانية تبدأ بـ is_؟
[ ] 9. هل آخر عمود هو created_at timestamptz DEFAULT now()؟
[ ] 10. هل الجدول الجديد أُضيف لجدول FK Reference في القسم 3.1؟
[ ] 11. هل ترتيب الإنشاء في القسم 4 حُدِّث إذا لزم؟
[ ] 12. هل هذا الملف (Changelog) حُدِّث بالإصدار الجديد؟
```

---

## 7. استراتيجية ملفات الـ Migration — Migration Strategy

> **الهدف:** أقل عدد ممكن من ملفات الـ migration مع الحفاظ على وضوح التاريخ وإمكانية التراجع.

---

### 7.1 المبدأ الأساسي — One Logical Change Per File

```
وحدة الـ migration = تغيير منطقي واحد، لا جدول واحد
```

| الموقف | عدد الملفات |
|--------|-------------|
| إنشاء جميع الجداول الأولية | **1 ملف** |
| إضافة مجموعة جداول مترابطة (مثل كل جداول المشاريع) | **1 ملف** |
| إضافة منظومة محاسبية كاملة | **1 ملف** |
| إضافة عمود واحد أو عدة أعمدة ذات صلة لجداول مختلفة | **1 ملف** |
| إضافة index أو constraint جديد | **1 ملف** يجمع كل التغييرات المتشابهة |
| إصلاح بيانات (data fix) | **1 ملف** مستقل دائماً |

---

### 7.2 تسمية الملفات — File Naming

```
YYYYMMDDHHMMSS_<slug>.sql
```

| المرحلة | اسم الملف المقترح |
|---------|-------------------|
| الإنشاء الأولي | `20260601000001_initial_schema.sql` |
| إضافة جداول المشاريع | `20260601000002_add_projects_wbs.sql` |
| إضافة منظومة المحاسبة | `20260601000003_add_accounting_core.sql` |
| إضافة عمود | `20260615000001_add_journal_entry_id_to_source_tables.sql` |
| إصلاح constraint | `20260615000002_fix_property_expense_frequency_check.sql` |

> الـ slug يصف **ما يفعله** الملف، لا **ما يحتويه**. `add_accounting_core` أوضح من `add_accounts_journal_entries_lines`.

---

### 7.3 هيكل كل ملف Migration

كل ملف يلتزم بهذا الهيكل الثابت:

```sql
-- ============================================================
-- Migration: <slug>
-- Description: <وصف قصير لما يفعله هذا الملف>
-- Depends on: <اسم الملف السابق إن وجد>
-- ============================================================

BEGIN;

-- 1. CREATE TABLES (بالترتيب الصحيح)
-- ...

-- 2. ALTER TABLE (إضافة FKs الذاتية بعد الإنشاء)
-- ...

-- 3. ENABLE RLS
-- ...

-- 4. CREATE POLICIES
-- ...

-- 5. CREATE TRIGGERS / FUNCTIONS
-- ...

-- 6. CREATE VIEWS
-- ...

COMMIT;
```

> كل migration يُلفّ بـ `BEGIN / COMMIT` — إذا فشل أي سطر يُتراجع عن الكل.

---

### 7.4 قواعد لا تُكسر — Hard Rules

**① لا تعدّل ملفاً سبق نشره**
بمجرد تطبيق migration على أي بيئة (dev/prod) يصبح ملفاً للقراءة فقط. أي تصحيح = ملف جديد.

**② لا ترقام متسلسل بدون timestamp**
اسم الملف يبدأ بـ timestamp دائماً. الأرقام التسلسلية (001, 002) وحدها تتعارض عند العمل بفروع متوازية.

**③ كل migration يعمل مستقلاً**
لا تفترض أن بيانات معينة موجودة — استخدم `IF NOT EXISTS` و`IF EXISTS` حيثما أمكن:

```sql
CREATE TABLE IF NOT EXISTS people (...);
ALTER TABLE wbs_items
  ADD CONSTRAINT IF NOT EXISTS fk_wbs_parent
  FOREIGN KEY (parent_id) REFERENCES wbs_items(id);
```

**④ الـ RLS مع الجدول، لا بعده**
كل جدول جديد يُفعَّل عليه RLS في نفس الملف الذي أُنشئ فيه — لا ملف RLS منفصل.

**⑤ seed data في ملف منفصل دائماً**
البيانات الأولية (دليل الحسابات الافتراضي، الفترات المحاسبية...) تذهب في ملف `_seed` مستقل:

```
20260601000001_initial_schema.sql   ← هيكل فقط
20260601000002_seed_chart_of_accounts.sql  ← بيانات فقط
```

---

### 7.5 متى تُنشئ ملفاً جديداً؟

```
هل التغيير يمس جداول موجودة بالفعل في بيئة الإنتاج؟
│
├── نعم ──► ملف جديد (ALTER TABLE)
│
└── لا ──► هل هو مجموعة جداول جديدة مترابطة؟
           │
           ├── نعم ──► ملف واحد يجمعها
           │
           └── لا ──► أضفه لآخر migration في نفس الـ sprint
                       ما لم يكن قد نُشر مسبقاً
```

---

### 7.6 ملفات الـ Migration المخططة للمشروع

| # | الملف | المحتوى | يعتمد على |
|---|-------|---------|-----------|
| M-01 | `20260601000001_initial_schema.sql` | الجداول 1-15 + RLS + Triggers الحصص | — |
| M-02 | `20260601000002_add_projects_wbs.sql` | جداول المشاريع + WBS + RLS | M-01 |
| M-03 | `20260601000003_add_accounting_core.sql` | accounting_periods + accounts + journal_entries + journal_entry_lines + general_ledger VIEW + journal_entry_id على 5 جداول | M-02 |
| M-04 | `20260601000004_seed_chart_of_accounts.sql` | دليل الحسابات الافتراضي (بيانات) | M-03 |
| M-05 | `20260601000005_seed_accounting_periods.sql` | الفترات المحاسبية للسنة الحالية | M-03 |

> أي جدول يُضاف بعد هذه المرحلة يحصل على ملف migration جديد بـ timestamp يوم الإضافة.

---

## 5. سجل التغييرات — Changelog

| التاريخ | الإصدار | التغيير |
|---------|---------|---------|
| 2026-06-01 | 1.0 | إنشاء الملف — 15 جدولاً محددة كاملاً |
| 2026-06-01 | 1.1 | إضافة مجموعة المشاريع: `projects`, `project_members`, `wbs_items`, `project_transactions` · تحديث `entity_type` ليشمل `'project'` في ثلاثة جداول · إضافة نمط Effective Dates في القسم 1.6 |
| 2026-06-01 | 1.2 | إضافة منظومة القيد المزدوج: `accounting_periods`, `accounts`, `journal_entries`, `journal_entry_lines` · إضافة `general_ledger` كـ VIEW · إضافة `journal_entry_id` لخمسة جداول مصدرية · إضافة القسم 1.7 لقواعد القيد المزدوج |
| 2026-06-01 | 1.3 | إضافة القسم 6: قاموس الأعمدة الموحَّد (أسماء FKs + أعمدة مالية + حصص + حالات + تواريخ + بوليانية + قائمة تحقق) · إضافة القسم 7: استراتيجية ملفات الـ Migration (مبادئ + تسمية + هيكل + قواعد + خطة الملفات) |