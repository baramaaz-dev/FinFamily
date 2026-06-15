# FinFamily / Family CFO — Database Schema Reference
**Version:** 1.5
**Status:** ✅ Adopted
**Last updated:** 2026-06-15

> **قاعدة إلزامية:** أي جدول جديد يُضاف للتطبيق يجب أن يراجع هذا الملف أولاً لضمان اتساق أسماء الحقول والمفاتيح مع بقية المخطط.

> **ملاحظة v1.5:** هذا الإصدار يعكس الحالة الفعلية لقاعدة البيانات في Supabase كما تحققنا منها بتاريخ 2026-06-15. الانحرافات عن المعيار موثقة في §8.

---

## 1. القواعد العامة — Global Conventions

### 1.1 المفاتيح الأساسية — Primary Keys
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

> ⚠️ **انحراف معروف:** 13 جدولاً تستخدم `uuid_generate_v4()` بدلاً من `gen_random_uuid()`.
> الناتج متطابق وظيفياً. يُصحَّح في migration مستقبلي.
> الجداول المتأثرة: capital_transactions · distributions · exchange_rates · lease_payments · leases · partner_capital_accounts · people · portfolios · profit_settlements · properties · property_expenses · settlement_shares · transactions

---

### 1.2 حقل التوقيت — Timestamps
```sql
created_at timestamptz DEFAULT now()
```

> ⚠️ **انحرافات معروفة:**
> - `journal_entry_lines` و`settlement_shares`: غياب `created_at` رغم وجوده في المواصفة
> - `portfolio_members` و`property_owners`: غياب `created_at` في المواصفة والـ DB معاً

---

### 1.3 العملات — Currency Fields
```sql
amount        numeric NOT NULL CHECK (amount > 0)
currency      text NOT NULL CHECK (currency IN ('USD','SYP'))
exchange_rate numeric          -- NULL = USD أصلي
```

> ⚠️ **انحراف معروف:** المعيار المستهدف هو `numeric(18,4)` لكن الـ DB الفعلي يستخدم `numeric` غير محدد الدقة في 15 جدولاً. يُصحَّح في migration مستقبلي.

---

### 1.4 الحصص — Share Fields
```sql
share_numerator    integer NOT NULL CHECK (share_numerator > 0)
share_denominator  integer NOT NULL CHECK (share_denominator > 0)
```

---

### 1.5 الكيانات المزدوجة — Polymorphic Entity References
```sql
entity_type text NOT NULL CHECK (entity_type IN ('portfolio','property','project'))
entity_id   uuid NOT NULL
```

> **استثناء `distributions`:** يقبل `'cash'` إضافةً للقيم أعلاه — راجع §2.6.

---

### 1.6 تاريخ الحصص — Share History Pattern (project_members فقط)
```sql
effective_from date NOT NULL
effective_to   date   -- NULL = سارية
```

---

### 1.7 القيد المزدوج — Double-Entry Convention

| نوع الحساب | الرصيد الطبيعي |
|------------|----------------|
| أصول | مدين |
| خصوم | دائن |
| حقوق ملكية | دائن |
| إيرادات | دائن |
| مصروفات | مدين |

**دورة الحياة:** `draft → posted → reversed`

---

### 1.8 البيانات الوصفية — Metadata Pattern
```sql
metadata jsonb NOT NULL DEFAULT '{}'
-- مثال: {"partner_id": "uuid"}
```

---

## 2. جداول التطبيق — Tables

### 2.1 مجموعة الشركة — Company

#### `company`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `founded_date` | date | — |
| `base_currency` | text | NOT NULL · DEFAULT 'USD' · CHECK IN ('USD','SYP') |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL · DEFAULT now() · يُحدَّث بـ Trigger |

> Trigger: `trg_company_updated_at` · RLS: SELECT + UPDATE فقط · لا INSERT.

---

#### `company_members`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `company_id` | uuid | NOT NULL · FK → company.id ON DELETE CASCADE |
| `person_id` | uuid | NOT NULL · FK → people.id ON DELETE RESTRICT |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (company_id, person_id) |

---

### 2.2 مجموعة الأشخاص — People

#### `people`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `name` | text | NOT NULL |
| `relation` | text | — |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

---

### 2.3 مجموعة المحافظ — Portfolios

#### `portfolios`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `name` | text | NOT NULL |
| `type` | text | NOT NULL · CHECK IN ('cash_usd','cash_syp','gold','project') |
| `description` | text | — |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

---

#### `portfolio_members`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `portfolio_id` | uuid | PK (مركب) · FK → portfolios.id |
| `person_id` | uuid | PK (مركب) · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `joined_date` | date | — (nullable في DB) |

> ⚠️ `joined_date` قابل للـ NULL في Supabase رغم تعريفه NOT NULL في المواصفة.
> ⚠️ `created_at` غائب في DB والمواصفة معاً.

---

#### `transactions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `portfolio_id` | uuid | NOT NULL · FK → portfolios.id |
| `type` | text | NOT NULL · CHECK IN ('income','expense','transfer') |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `category` | text | — |
| `date` | date | NOT NULL · DEFAULT CURRENT_DATE |
| `notes` | text | — |
| `journal_entry_id` | uuid | FK → journal_entries.id |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.4 مجموعة العقارات — Properties

#### `properties`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `name` | text | NOT NULL |
| `type` | text | NOT NULL · CHECK IN ('residential','commercial','land') |
| `location` | text | — |
| `purchase_date` | date | — |
| `estimated_value` | numeric | — |
| `status` | text | NOT NULL · DEFAULT 'vacant' · CHECK IN ('rented','vacant') |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

---

#### `property_owners`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `property_id` | uuid | PK (مركب) · FK → properties.id |
| `person_id` | uuid | PK (مركب) · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `ownership_basis` | text | NOT NULL · CHECK IN ('إرث','شراء','هبة','وصية','شراكة') |

> ⚠️ `created_at` غائب في DB والمواصفة معاً.

---

#### `leases`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `property_id` | uuid | NOT NULL · FK → properties.id |
| `tenant_name` | text | NOT NULL |
| `rent_amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `frequency` | text | NOT NULL · CHECK IN ('monthly','annual') |
| `start_date` | date | NOT NULL |
| `end_date` | date | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `lease_payments`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `lease_id` | uuid | NOT NULL · FK → leases.id |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `paid_date` | date | NOT NULL |
| `portfolio_id` | uuid | FK → portfolios.id |
| `journal_entry_id` | uuid | FK → journal_entries.id |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `property_expenses`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `property_id` | uuid | NOT NULL · FK → properties.id |
| `type` | text | NOT NULL · CHECK IN ('tax','maintenance','utilities','fees') |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `due_date` | date | NOT NULL ⚠️ (الـ DB يُلزم بالقيمة) |
| `paid_date` | date | — |
| `is_recurring` | boolean | DEFAULT false ⚠️ (nullable في DB) |
| `frequency` | text | CHECK IN ('monthly','annual','once') |
| `portfolio_id` | uuid | FK → portfolios.id |
| `journal_entry_id` | uuid | FK → journal_entries.id |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.5 مجموعة رأس المال — Capital

#### `partner_capital_accounts`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project') |
| `entity_id` | uuid | NOT NULL |
| `opening_balance` | numeric | NOT NULL · DEFAULT 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — ⚠️ (عمود إضافي غير موثق في v1.4) |
| `opening_date` | date | NOT NULL |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (partner_id, entity_type, entity_id) |

---

#### `capital_transactions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `capital_account_id` | uuid | NOT NULL · FK → partner_capital_accounts.id |
| `type` | text | NOT NULL · CHECK IN ('capital_injection','capital_reduction','drawing','profit_share','loss_share') |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `date` | date | NOT NULL · DEFAULT CURRENT_DATE |
| `reference_no` | text | — |
| `journal_entry_id` | uuid | FK → journal_entries.id |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `profit_settlements`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project') |
| `entity_id` | uuid | NOT NULL |
| `period_start` | date | NOT NULL |
| `period_end` | date | NOT NULL |
| `total_profit` | numeric | NOT NULL |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `settlement_date` | date | NOT NULL · DEFAULT CURRENT_DATE |
| `status` | text | NOT NULL · DEFAULT 'draft' · CHECK IN ('draft','confirmed') |
| `journal_entry_id` | uuid | FK → journal_entries.id ⚠️ (عمود إضافي) |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `settlement_shares`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `settlement_id` | uuid | NOT NULL · FK → profit_settlements.id |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `share_numerator` | integer | NOT NULL ⚠️ (بدون CHECK > 0 في DB) |
| `share_denominator` | integer | NOT NULL ⚠️ (بدون CHECK > 0 في DB) |
| `amount` | numeric | NOT NULL ⚠️ (بدون CHECK >= 0 في DB) |
| `capital_transaction_id` | uuid | FK → capital_transactions.id |

> ⚠️ `created_at` غائب في DB.
> ⚠️ ثلاثة CHECK constraints غائبة: share_numerator > 0 · share_denominator > 0 · amount >= 0.

---

### 2.6 مجموعة الأسعار والتوزيعات — Rates & Distributions

#### `exchange_rates`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `rate` | numeric | NOT NULL · CHECK > 0 |
| `date` | date | NOT NULL · UNIQUE ⚠️ (قيد إضافي) |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `distributions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT uuid_generate_v4() |
| `partner_id` | uuid | NOT NULL · FK → people.id |
| `entity_type` | text | NOT NULL · CHECK IN ('portfolio','property','project','cash') |
| `entity_id` | uuid | NOT NULL |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — ⚠️ (عمود إضافي) |
| `date` | date | NOT NULL · DEFAULT CURRENT_DATE |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

> عند `entity_type = 'cash'`: `entity_id` يشير إلى `accounts.id`.

---

### 2.7 مجموعة المشاريع — Projects

#### `projects`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `name` | text | NOT NULL |
| `description` | text | — |
| `status` | text | NOT NULL · DEFAULT 'planning' · CHECK IN ('planning','active','on_hold','completed','cancelled') |
| `start_date` | date | — |
| `end_date` | date | — |
| `budget_amount` | numeric | — |
| `budget_currency` | text | CHECK IN ('USD','SYP') |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `project_members`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `person_id` | uuid | NOT NULL · FK → people.id |
| `share_numerator` | integer | NOT NULL · CHECK > 0 |
| `share_denominator` | integer | NOT NULL · CHECK > 0 |
| `effective_from` | date | NOT NULL |
| `effective_to` | date | — |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (project_id, person_id, effective_from) |

---

#### `wbs_items`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `parent_id` | uuid | FK → wbs_items.id |
| `code` | text | NOT NULL |
| `name` | text | NOT NULL |
| `level` | integer | NOT NULL · CHECK > 0 |
| `description` | text | — |
| `budget_amount` | numeric | — |
| `budget_currency` | text | CHECK IN ('USD','SYP') |
| `status` | text | NOT NULL · DEFAULT 'planned' · CHECK IN ('planned','in_progress','completed','cancelled') |
| `order_index` | integer | NOT NULL · DEFAULT 0 |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (project_id, code) |

---

#### `project_transactions`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `project_id` | uuid | NOT NULL · FK → projects.id |
| `wbs_item_id` | uuid | FK → wbs_items.id |
| `type` | text | NOT NULL · CHECK IN ('income','expense','transfer') |
| `amount` | numeric | NOT NULL · CHECK > 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `category` | text | — |
| `date` | date | NOT NULL |
| `journal_entry_id` | uuid | FK → journal_entries.id |
| `notes` | text | — |
| `created_at` | timestamptz | DEFAULT now() |

---

### 2.8 منظومة المحاسبة — Accounting Core

#### `accounting_periods`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `fiscal_year` | integer | NOT NULL |
| `period_number` | integer | NOT NULL · CHECK BETWEEN 1 AND 12 |
| `name` | text | NOT NULL |
| `start_date` | date | NOT NULL |
| `end_date` | date | NOT NULL |
| `status` | text | NOT NULL · DEFAULT 'open' · CHECK IN ('open','closed','locked') |
| `closed_at` | timestamptz | — ⚠️ (عمود إضافي — وقت الإقفال) |
| `locked_at` | timestamptz | — ⚠️ (عمود إضافي — وقت القفل النهائي) |
| `closing_entry_id` | uuid | FK → journal_entries.id ⚠️ (عمود إضافي) |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | — | (fiscal_year, period_number) |

---

#### `accounts`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `company_id` | uuid | NOT NULL · FK → company.id ON DELETE RESTRICT |
| `parent_id` | uuid | FK → accounts.id |
| `code` | text | NOT NULL · UNIQUE |
| `name` | text | NOT NULL |
| `account_class` | text | NOT NULL · CHECK IN ('asset','liability','equity','revenue','expense') |
| `normal_balance` | text | NOT NULL · CHECK IN ('debit','credit') |
| `level` | integer | NOT NULL · CHECK > 0 |
| `is_postable` | boolean | NOT NULL · DEFAULT false |
| `is_active` | boolean | NOT NULL · DEFAULT true |
| `metadata` | jsonb | NULL · يُخزَّن partner_id للحسابات التلقائية |
| `created_at` | timestamptz | DEFAULT now() |
| Index | — | idx_accounts_company_id |

---

#### `journal_entries`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `period_id` | uuid | NOT NULL · FK → accounting_periods.id |
| `entry_date` | date | NOT NULL |
| `reference_no` | text | — |
| `description` | text | NOT NULL |
| `source_type` | text | NOT NULL · CHECK IN ('manual','transaction','project_transaction','lease_payment','property_expense','capital_transaction','profit_settlement','settlement','reversal','closing') |
| `source_id` | uuid | — |
| `status` | text | NOT NULL · DEFAULT 'draft' · CHECK IN ('draft','posted','reversed') |
| `reversal_of` | uuid | FK → journal_entries.id |
| `created_at` | timestamptz | DEFAULT now() |

> ⚠️ **تحديث v1.5:** `source_type` يشمل أربع قيم إضافية عن v1.4:
> `'profit_settlement'` · `'settlement'` · `'reversal'` · `'closing'`

---

#### `journal_entry_lines`
| الحقل | النوع | القيود |
|-------|-------|--------|
| `id` | uuid | PK · DEFAULT gen_random_uuid() |
| `journal_entry_id` | uuid | NOT NULL · FK → journal_entries.id |
| `account_id` | uuid | NOT NULL · FK → accounts.id |
| `debit_amount` | numeric | NOT NULL · DEFAULT 0 · CHECK >= 0 |
| `credit_amount` | numeric | NOT NULL · DEFAULT 0 · CHECK >= 0 |
| `currency` | text | NOT NULL · CHECK IN ('USD','SYP') |
| `exchange_rate` | numeric | — |
| `description` | text | — |
| CHECK | — | (debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0) |

> ⚠️ `created_at` **غائب** في Supabase.

---

#### `general_ledger` — VIEW (19 عموداً)

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

---

## 3. خريطة المفاتيح الخارجية

### 3.1 FK Reference Table

| الجدول | الحقل | يشير إلى |
|--------|-------|----------|
| `company_members` | `company_id` | `company.id` |
| `company_members` | `person_id` | `people.id` |
| `accounts` | `company_id` | `company.id` |
| `accounts` | `parent_id` | `accounts.id` (self-ref) |
| `accounting_periods` | `closing_entry_id` | `journal_entries.id` (nullable) |
| `portfolio_members` | `portfolio_id` | `portfolios.id` |
| `portfolio_members` | `person_id` | `people.id` |
| `transactions` | `portfolio_id` | `portfolios.id` |
| `transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `property_owners` | `property_id` | `properties.id` |
| `property_owners` | `person_id` | `people.id` |
| `leases` | `property_id` | `properties.id` |
| `lease_payments` | `lease_id` | `leases.id` |
| `lease_payments` | `portfolio_id` | `portfolios.id` (nullable) |
| `lease_payments` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `property_expenses` | `property_id` | `properties.id` |
| `property_expenses` | `portfolio_id` | `portfolios.id` (nullable) |
| `property_expenses` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `partner_capital_accounts` | `partner_id` | `people.id` |
| `partner_capital_accounts` | `entity_id` | polymorphic |
| `capital_transactions` | `capital_account_id` | `partner_capital_accounts.id` |
| `capital_transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `profit_settlements` | `entity_id` | polymorphic |
| `profit_settlements` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `settlement_shares` | `settlement_id` | `profit_settlements.id` |
| `settlement_shares` | `partner_id` | `people.id` |
| `settlement_shares` | `capital_transaction_id` | `capital_transactions.id` (nullable) |
| `distributions` | `partner_id` | `people.id` |
| `distributions` | `entity_id` | polymorphic |
| `project_members` | `project_id` | `projects.id` |
| `project_members` | `person_id` | `people.id` |
| `wbs_items` | `project_id` | `projects.id` |
| `wbs_items` | `parent_id` | `wbs_items.id` (self-ref, nullable) |
| `project_transactions` | `project_id` | `projects.id` |
| `project_transactions` | `wbs_item_id` | `wbs_items.id` (nullable) |
| `project_transactions` | `journal_entry_id` | `journal_entries.id` (nullable) |
| `journal_entries` | `period_id` | `accounting_periods.id` |
| `journal_entries` | `reversal_of` | `journal_entries.id` (self-ref, nullable) |
| `journal_entry_lines` | `journal_entry_id` | `journal_entries.id` |
| `journal_entry_lines` | `account_id` | `accounts.id` |

---

### 3.2 سلوك الحذف — ON DELETE Behavior

| العلاقة | السلوك |
|---------|--------|
| `company_members → company` | CASCADE |
| `company_members → people` | RESTRICT |
| `accounts → company` | RESTRICT |
| `accounts → accounts (parent)` | RESTRICT |
| `portfolio_members → portfolios` | CASCADE |
| `portfolio_members → people` | RESTRICT |
| `transactions → portfolios` | RESTRICT |
| `property_owners → properties` | CASCADE |
| `property_owners → people` | RESTRICT |
| `leases → properties` | RESTRICT |
| `lease_payments → leases` | RESTRICT |
| `property_expenses → properties` | RESTRICT |
| `partner_capital_accounts → people` | RESTRICT |
| `capital_transactions → partner_capital_accounts` | RESTRICT |
| `settlement_shares → profit_settlements` | CASCADE |
| `settlement_shares → people` | RESTRICT |
| `project_members → projects` | CASCADE |
| `project_members → people` | RESTRICT |
| `wbs_items → projects` | CASCADE |
| `wbs_items → wbs_items (parent)` | RESTRICT |
| `project_transactions → projects` | RESTRICT |
| `project_transactions → wbs_items` | RESTRICT |
| `journal_entries → accounting_periods` | RESTRICT |
| `journal_entries → journal_entries (reversal)` | RESTRICT |
| `journal_entry_lines → journal_entries` | CASCADE |
| `journal_entry_lines → accounts` | RESTRICT |

---

## 4. ترتيب الإنشاء — Creation Order

```
1.  company
2.  people
3.  company_members
4.  portfolios
5.  portfolio_members
6.  exchange_rates
7.  properties
8.  property_owners
9.  leases
10. projects
11. project_members
12. wbs_items              ← بدون parent_id FK ثم ALTER TABLE
13. accounting_periods
14. accounts               ← بدون parent_id FK ثم ALTER TABLE · يعتمد على company
15. journal_entries        ← بدون reversal_of FK ثم ALTER TABLE
16. journal_entry_lines
17. transactions
18. project_transactions
19. lease_payments
20. property_expenses
21. partner_capital_accounts
22. capital_transactions
23. profit_settlements
24. settlement_shares
25. distributions
```

---

## 5. قاموس الأعمدة الموحَّد

### 5.1 قاعدة تسمية FKs

| الجدول المُشار إليه | اسم العمود |
|---------------------|-----------|
| `company` | `company_id` |
| `people` | `person_id` / `partner_id` |
| `portfolios` | `portfolio_id` |
| `properties` | `property_id` |
| `projects` | `project_id` |
| `leases` | `lease_id` |
| `wbs_items` | `wbs_item_id` |
| `accounts` | `account_id` |
| `journal_entries` | `journal_entry_id` |
| `accounting_periods` | `period_id` |
| `partner_capital_accounts` | `capital_account_id` |
| `profit_settlements` | `settlement_id` |
| `exchange_rates` | `exchange_rate_id` |

### 5.2 أعمدة الحالة — Status & Type

| الحقل | الجدول | القيم الفعلية |
|-------|--------|--------------|
| `status` | `accounting_periods` | open · closed · locked |
| `status` | `journal_entries` | draft · posted · reversed |
| `status` | `profit_settlements` | draft · confirmed |
| `status` | `projects` | planning · active · on_hold · completed · cancelled |
| `status` | `wbs_items` | planned · in_progress · completed · cancelled |
| `status` | `properties` | rented · vacant |
| `entity_type` | `distributions` | portfolio · property · project · **cash** |
| `entity_type` | others | portfolio · property · project |
| `source_type` | `journal_entries` | manual · transaction · project_transaction · lease_payment · property_expense · capital_transaction · **profit_settlement** · **settlement** · **reversal** · **closing** |
| `account_class` | `accounts` | asset · liability · equity · revenue · expense |
| `normal_balance` | `accounts` | debit · credit |

### 5.3 قائمة التحقق عند إنشاء جدول جديد

```
[ ] 1. اسم الجدول مفرد، snake_case
[ ] 2. id uuid DEFAULT gen_random_uuid()
[ ] 3. كل FK يتبع قاعدة §5.1
[ ] 4. الأعمدة المالية: amount · currency · exchange_rate
[ ] 5. الحصص: share_numerator / share_denominator بالضبط
[ ] 6. قيم status / type موثقة في §5.2
[ ] 7. آخر عمود هو created_at timestamptz DEFAULT now()
[ ] 8. الجدول أُضيف لـ FK Reference Table §3.1
[ ] 9. ترتيب الإنشاء §4 حُدِّث
[ ] 10. هذا الملف Changelog حُدِّث
```

---

## 6. استراتيجية ملفات Migration (راجع v1.3 للتفاصيل الكاملة)

المبدأ: تغيير منطقي واحد لكل ملف · `BEGIN/COMMIT` إلزامي.
تسمية: `YYYYMMDDHHMMSS_<slug>.sql`

---

## 7. الانحرافات المعروفة — Known Deviations

هذه الانحرافات موثقة ومقبولة مؤقتاً — تُصحَّح في Migration مستقبلي.

| # | الانحراف | الجداول المتأثرة | الأولوية |
|---|---------|-----------------|---------|
| D-01 | `numeric` بدلاً من `numeric(18,4)` | 15 جدولاً | متوسطة |
| D-02 | `uuid_generate_v4()` بدلاً من `gen_random_uuid()` | 13 جدولاً | منخفضة |
| D-03 | غياب `created_at` في DB رغم وجوده في المواصفة | journal_entry_lines · settlement_shares | عالية |
| D-04 | غياب `created_at` في المواصفة والـ DB معاً | portfolio_members · property_owners | متوسطة |
| D-05 | غياب CHECKs في `settlement_shares` | settlement_shares | عالية |
| D-06 | `joined_date` nullable بدلاً من NOT NULL | portfolio_members | متوسطة |
| D-07 | `is_recurring` nullable بدلاً من NOT NULL | property_expenses | منخفضة |

---

## 8. سجل التغييرات — Changelog

| التاريخ | الإصدار | التغيير |
|---------|---------|---------|
| 2026-06-01 | 1.0 | إنشاء الملف — 15 جدولاً |
| 2026-06-01 | 1.1 | إضافة مجموعة المشاريع |
| 2026-06-01 | 1.2 | إضافة منظومة القيد المزدوج |
| 2026-06-01 | 1.3 | قاموس الأعمدة + استراتيجية Migration |
| 2026-06-15 | 1.4 | company · company_members · accounts.company_id · accounts.metadata · distributions entity_type='cash' · general_ledger VIEW محدّث |
| 2026-06-15 | 1.5 | **مطابقة كاملة مع Supabase الفعلي** بعد تحقق Claude Code: accounting_periods (closed_at · locked_at · closing_entry_id) · journal_entries source_type موسَّع · journal_entry_lines بدون created_at · partner_capital_accounts.exchange_rate · profit_settlements.journal_entry_id · people/portfolios/properties.updated_at · distributions.exchange_rate · exchange_rates UNIQUE(date) · تصحيح nullability في portfolio_members وproperty_expenses وsettlement_shares · توثيق §7 للانحرافات المعروفة |