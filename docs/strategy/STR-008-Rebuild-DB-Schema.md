STR-008 — مخطط قاعدة البيانات الجديد (إعادة البناء)
Rebuild Database Schema — Family Wealth Management
Version : 1.1
Status  : 🔲 Draft
Date    : 2026-06-17
Author  : BaraKaat (Family CFO — Sprint 100 Session)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§1. سياق إعادة البناء
━━━━━━━━━━━━━━━━━━━━━

هذه الوثيقة تُحدِّد مخطط قاعدة البيانات الجديد الكامل لإعادة بناء
تطبيق Family CFO بناءً على القرارات المعمارية الجوهرية التي أُقِرَّت
في جلسة Sprint 100 (2026-06-15).

المخطط الحالي (ما قبل إعادة البناء):
  - موثق في STR-002 v1.5
  - يعتمد على نموذج "شركة المحاصة" (شراكة واحدة)
  - جداول الملكية مكررة: portfolio_members + property_owners + project_members
  - مصدر الحقيقة المحاسبي: الجداول التشغيلية (خطأ معماري)

المخطط الجديد (هذه الوثيقة):
  - يعتمد على نموذج "إدارة الثروة العائلية" (Family Wealth Management)
  - هيكل هرمي ثلاثي: مكتب العائلة → كيانات → أصول
  - مصدر الحقيقة المحاسبي: journal_entry_lines (القيد المزدوج)
  - جدول ملكية موحد: entity_members بدلاً من ثلاثة جداول

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§2. القرارات المعمارية الجوهرية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§2.1 التطبيق إدارة ثروة لا إدارة شركة

  المطبيق: Family Wealth Management Platform
  المستفيدون: ورثة بحصص ثابتة بالميراث
  الكيان الأعلى: مكتب العائلة (إشرافي — لا يملك الكيانات)
  المؤشر الرئيسي: صافي قيمة الأصول (NAV) لكل وارث

§2.2 الكيان = وعاء استثماري بحصص موحدة

  الكيان هو الوحدة الاستثمارية الأساسية في النظام.
  قاعدة صارمة: جميع الأصول داخل الكيان تحمل نفس حصص الورثة.
  أي أصل بحصص مختلفة = كيان مستقل جديد.
  كل كيان يُعامَل كشركة مستقلة محاسبياً:
    - شجرة حسابات (COA) خاصة به
    - قيود يومية خاصة به
    - تقارير مالية خاصة به

§2.3 مكتب العائلة = إشراف + تجميع

  مكتب العائلة لا يملك الكيانات — يُشرف عليها وينظمها.
  دوره في التقارير: تجميع نسبي (Aggregation) لا توحيد (Consolidation).
  صافي ثروة الوارث =
    Σ (قيمة الكيان × حصة الوارث في ذلك الكيان) عبر جميع الكيانات.

§2.4 الفترات المحاسبية مشتركة

  accounting_periods: جدول واحد مشترك بين جميع الكيانات.
  السبب: تبسيط إقفال الفترات — منطق واحد يُطبَّق على الجميع.
  لا entity_id في الجدول.

§2.5 capital_transactions تبقى كـ Convenience Layer

  مصدر الحقيقة: journal_entry_lines على حسابات الكيان.
  capital_transactions: طبقة مساعدة للواجهة لتسجيل حركات الورثة.
  تُعاد هيكلتها: entity_id + person_id مباشرةً (لا capital_account_id).

§2.6 التمويل البيني = قيدان مستقلان

  عند تمويل كيان من آخر:
    الكيان المُقرِض: Dr ذمم بينية مدينة / Cr النقدية
    الكيان المُقتَرض: Dr النقدية / Cr ذمم بينية دائنة
  يُوثَّق في inter_entity_transactions الذي يربط قيدَي الكيانين.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§3. الهيكل الهرمي للتطبيق
━━━━━━━━━━━━━━━━━━━━━━━━━━

  مكتب العائلة (Family Office)
  │   إشرافي · سجل الورثة · تجميع التقارير
  │
  ├── كيان أ  [3 ورثة · حصص: 1/3 لكل]
  │     ├── عقار 1     (حصة موروثة: 1/3)
  │     ├── عقار 2     (حصة موروثة: 1/3)
  │     └── محفظة نقدية (حصة موروثة: 1/3)
  │
  ├── كيان ب  [2 ورثة · حصص مختلفة]
  │     └── أوراق مالية (حصص خاصة)
  │
  └── كيان ج  [وارث واحد — 1/1]
        └── عقار خاص (ملكية كاملة)

  المكتب يرى:
    → إجمالي ثروة كل وارث (NAV) عبر كل الكيانات
    → أداء كل كيان بشكل مستقل
    → التدفق النقدي الموحد للعائلة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§4. مخطط قاعدة البيانات الكامل
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 1 — مكتب العائلة
جداول: 4
━━━━━━━━━━━━━━━━━━━━━━━━━

family_office
  id              uuid        PK · DEFAULT gen_random_uuid()
  name            text        NOT NULL
  established_date date       —
  base_currency   text        NOT NULL · DEFAULT 'USD' · CHECK IN ('USD','SYP')
  notes           text        —
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz NOT NULL · DEFAULT now() · Trigger

  قاعدة: صف واحد فقط · RLS: SELECT + UPDATE لا INSERT

────────────────────────────────────────────────────────────────────────

people
  id              uuid        PK · DEFAULT gen_random_uuid()
  name            text        NOT NULL
  relation        text        — (علاقة القرابة)
  notes           text        —
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

  سجل الورثة المركزي لمكتب العائلة كاملاً

────────────────────────────────────────────────────────────────────────

exchange_rates
  id              uuid        PK · DEFAULT gen_random_uuid()
  rate            numeric     NOT NULL · CHECK > 0 (SYP per 1 USD)
  date            date        NOT NULL · UNIQUE
  notes           text        —
  created_at      timestamptz DEFAULT now()

  مشترك بين جميع الكيانات · قيد واحد يومياً

────────────────────────────────────────────────────────────────────────

accounting_periods
  id              uuid        PK · DEFAULT gen_random_uuid()
  fiscal_year     integer     NOT NULL
  period_number   integer     NOT NULL · CHECK BETWEEN 1 AND 12
  name            text        NOT NULL
  start_date      date        NOT NULL
  end_date        date        NOT NULL
  status          text        NOT NULL · DEFAULT 'open'
                              CHECK IN ('open','closed','locked')
  closed_at       timestamptz —
  locked_at       timestamptz —
  closing_entry_id uuid       FK → journal_entries.id
  created_at      timestamptz DEFAULT now()
  UNIQUE (fiscal_year, period_number)

  مشترك بين جميع الكيانات · لا entity_id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 2 — الكيانات والمحاسبة
جداول: 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

entities
  id              uuid        PK · DEFAULT gen_random_uuid()
  family_office_id uuid       NOT NULL · FK → family_office.id
  name            text        NOT NULL
  type            text        NOT NULL
                              CHECK IN ('investment','real_estate',
                                        'project','mixed','single_asset')
  description     text        —
  established_date date       —
  base_currency   text        NOT NULL · DEFAULT 'USD'
                              CHECK IN ('USD','SYP')
  status          text        NOT NULL · DEFAULT 'active'
                              CHECK IN ('active','dissolved','suspended')
  notes           text        —
  created_at      timestamptz DEFAULT now()

  كل كيان = شركة مستقلة محاسبياً
  Trigger: auto_create_entity_coa() — ينشئ شجرة حسابات افتراضية عند الإنشاء

────────────────────────────────────────────────────────────────────────

entity_members
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  person_id       uuid        NOT NULL · FK → people.id ON DELETE RESTRICT
  share_numerator integer     NOT NULL · CHECK > 0
  share_denominator integer   NOT NULL · CHECK > 0
  notes           text        —
  created_at      timestamptz DEFAULT now()
  UNIQUE (entity_id, person_id)

  قاعدة صارمة: Σ (share_numerator / share_denominator) = 1
               لجميع أعضاء نفس الكيان
  يحل محل: portfolio_members + property_owners + project_members
  Trigger: auto_create_member_accounts() — ينشئ 31XX + 32XX + 23XX
           في COA الكيان لكل عضو جديد

────────────────────────────────────────────────────────────────────────

accounts
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  parent_id       uuid        FK → accounts.id (self-ref)
  code            text        NOT NULL · UNIQUE (entity_id, code)
  name            text        NOT NULL
  account_class   text        NOT NULL
                              CHECK IN ('asset','liability','equity',
                                        'revenue','expense')
  normal_balance  text        NOT NULL · CHECK IN ('debit','credit')
  level           integer     NOT NULL · CHECK > 0
  is_postable     boolean     NOT NULL · DEFAULT false
  is_active       boolean     NOT NULL · DEFAULT true
  metadata        jsonb       NOT NULL · DEFAULT '{}'
                              (يُخزَّن partner_id للحسابات التلقائية)
  created_at      timestamptz DEFAULT now()
  INDEX idx_accounts_entity_id ON accounts(entity_id)

  مستقلة لكل كيان · entity_id بدلاً من company_id

────────────────────────────────────────────────────────────────────────

journal_entries
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  period_id       uuid        NOT NULL · FK → accounting_periods.id
  entry_date      date        NOT NULL
  reference_no    text        —
  description     text        NOT NULL
  source_type     text        NOT NULL
                              CHECK IN ('manual','transaction',
                                        'project_transaction','lease_payment',
                                        'property_expense','capital_transaction',
                                        'profit_settlement','settlement',
                                        'reversal','closing',
                                        'inter_entity','depreciation')
  source_id       uuid        — (NULL للقيود اليدوية)
  status          text        NOT NULL · DEFAULT 'draft'
                              CHECK IN ('draft','posted','reversed')
  reversal_of     uuid        FK → journal_entries.id (self-ref)
  created_at      timestamptz DEFAULT now()

  جديد في source_type: 'inter_entity' + 'depreciation'

────────────────────────────────────────────────────────────────────────

journal_entry_lines
  id              uuid        PK · DEFAULT gen_random_uuid()
  journal_entry_id uuid       NOT NULL · FK → journal_entries.id CASCADE
  account_id      uuid        NOT NULL · FK → accounts.id ON DELETE RESTRICT
  debit_amount    numeric     NOT NULL · DEFAULT 0 · CHECK >= 0
  credit_amount   numeric     NOT NULL · DEFAULT 0 · CHECK >= 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  description     text        —
  CHECK (debit_amount > 0 AND credit_amount = 0)
     OR (credit_amount > 0 AND debit_amount = 0)

────────────────────────────────────────────────────────────────────────

capital_transactions
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  person_id       uuid        NOT NULL · FK → people.id ON DELETE RESTRICT
  type            text        NOT NULL
                              CHECK IN ('capital_injection','capital_reduction',
                                        'drawing','profit_share','loss_share')
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  date            date        NOT NULL · DEFAULT CURRENT_DATE
  reference_no    text        —
  journal_entry_id uuid       FK → journal_entries.id
  notes           text        —
  created_at      timestamptz DEFAULT now()

  يحل محل: capital_account_id → partner_capital_accounts (محذوف)
  الربط الآن: entity_id + person_id مباشرةً

────────────────────────────────────────────────────────────────────────

profit_settlements
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  period_start    date        NOT NULL
  period_end      date        NOT NULL
  total_profit    numeric     NOT NULL
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  settlement_date date        NOT NULL · DEFAULT CURRENT_DATE
  status          text        NOT NULL · DEFAULT 'draft'
                              CHECK IN ('draft','confirmed')
  journal_entry_id uuid       FK → journal_entries.id
  notes           text        —
  created_at      timestamptz DEFAULT now()

  يحل محل: entity_type (بوليمورفيك) → entity_id مباشرة

────────────────────────────────────────────────────────────────────────

settlement_shares
  id                   uuid   PK · DEFAULT gen_random_uuid()
  settlement_id        uuid   NOT NULL · FK → profit_settlements.id CASCADE
  person_id            uuid   NOT NULL · FK → people.id ON DELETE RESTRICT
  share_numerator      integer NOT NULL · CHECK > 0
  share_denominator    integer NOT NULL · CHECK > 0
  amount               numeric NOT NULL · CHECK >= 0
  capital_transaction_id uuid FK → capital_transactions.id

────────────────────────────────────────────────────────────────────────

inter_entity_transactions
  id                   uuid   PK · DEFAULT gen_random_uuid()
  from_entity_id       uuid   NOT NULL · FK → entities.id ON DELETE RESTRICT
  to_entity_id         uuid   NOT NULL · FK → entities.id ON DELETE RESTRICT
  amount               numeric NOT NULL · CHECK > 0
  currency             text   NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate        numeric —
  date                 date   NOT NULL · DEFAULT CURRENT_DATE
  type                 text   NOT NULL
                              CHECK IN ('loan','transfer','dividend')
  from_journal_entry_id uuid  FK → journal_entries.id
  to_journal_entry_id  uuid   FK → journal_entries.id
  notes                text   —
  created_at           timestamptz DEFAULT now()
  CHECK from_entity_id <> to_entity_id

  قيدان مستقلان: قيد في الكيان المُقرِض + قيد في الكيان المُقتَرض

────────────────────────────────────────────────────────────────────────

distributions
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  person_id       uuid        NOT NULL · FK → people.id ON DELETE RESTRICT
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  date            date        NOT NULL · DEFAULT CURRENT_DATE
  notes           text        —
  journal_entry_id uuid       FK → journal_entries.id
  created_at      timestamptz DEFAULT now()

  التوزيعات على مستوى الكيان (لا entity_type بوليمورفيك)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 3 — الأصول (كل أصل يحمل entity_id)
جداول: 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

properties
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  name            text        NOT NULL
  type            text        NOT NULL
                              CHECK IN ('residential','commercial','land')
  location        text        —
  purchase_date   date        —
  estimated_value numeric     —
  status          text        NOT NULL · DEFAULT 'vacant'
                              CHECK IN ('rented','vacant')
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

  لا property_owners — الملكية عبر entity_members

────────────────────────────────────────────────────────────────────────

leases
  id              uuid        PK · DEFAULT gen_random_uuid()
  property_id     uuid        NOT NULL · FK → properties.id ON DELETE RESTRICT
  tenant_name     text        NOT NULL
  rent_amount     numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  frequency       text        NOT NULL · CHECK IN ('monthly','annual')
  start_date      date        NOT NULL
  end_date        date        —
  created_at      timestamptz DEFAULT now()

────────────────────────────────────────────────────────────────────────

lease_payments
  id              uuid        PK · DEFAULT gen_random_uuid()
  lease_id        uuid        NOT NULL · FK → leases.id ON DELETE RESTRICT
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  paid_date       date        NOT NULL
  journal_entry_id uuid       FK → journal_entries.id
  notes           text        —
  created_at      timestamptz DEFAULT now()

  حُذف: portfolio_id (الكيان هو الوعاء المالي)

────────────────────────────────────────────────────────────────────────

property_expenses
  id              uuid        PK · DEFAULT gen_random_uuid()
  property_id     uuid        NOT NULL · FK → properties.id ON DELETE RESTRICT
  type            text        NOT NULL
                              CHECK IN ('tax','maintenance','utilities','fees')
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  due_date        date        NOT NULL
  paid_date       date        —
  is_recurring    boolean     DEFAULT false
  frequency       text        CHECK IN ('monthly','annual','once')
  journal_entry_id uuid       FK → journal_entries.id
  notes           text        —
  created_at      timestamptz DEFAULT now()

  حُذف: portfolio_id (الكيان هو الوعاء المالي)

────────────────────────────────────────────────────────────────────────

portfolios
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  name            text        NOT NULL
  type            text        NOT NULL
                              CHECK IN ('cash_usd','cash_syp','gold',
                                        'securities','other')
  description     text        —
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

  لا portfolio_members — الملكية عبر entity_members

────────────────────────────────────────────────────────────────────────

transactions
  id              uuid        PK · DEFAULT gen_random_uuid()
  portfolio_id    uuid        NOT NULL · FK → portfolios.id ON DELETE RESTRICT
  type            text        NOT NULL
                              CHECK IN ('income','expense','transfer')
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  category        text        —
  date            date        NOT NULL · DEFAULT CURRENT_DATE
  notes           text        —
  journal_entry_id uuid       FK → journal_entries.id
  created_at      timestamptz DEFAULT now()

────────────────────────────────────────────────────────────────────────

projects
  id              uuid        PK · DEFAULT gen_random_uuid()
  entity_id       uuid        NOT NULL · FK → entities.id ON DELETE RESTRICT
  name            text        NOT NULL
  description     text        —
  status          text        NOT NULL · DEFAULT 'planning'
                              CHECK IN ('planning','active','on_hold',
                                        'completed','cancelled')
  start_date      date        —
  end_date        date        —
  budget_amount   numeric     —
  budget_currency text        CHECK IN ('USD','SYP')
  notes           text        —
  created_at      timestamptz DEFAULT now()

  لا project_members — الملكية عبر entity_members

────────────────────────────────────────────────────────────────────────

wbs_items
  id              uuid        PK · DEFAULT gen_random_uuid()
  project_id      uuid        NOT NULL · FK → projects.id CASCADE
  parent_id       uuid        FK → wbs_items.id (self-ref)
  code            text        NOT NULL
  name            text        NOT NULL
  level           integer     NOT NULL · CHECK > 0
  description     text        —
  budget_amount   numeric     —
  budget_currency text        CHECK IN ('USD','SYP')
  status          text        NOT NULL · DEFAULT 'planned'
                              CHECK IN ('planned','in_progress',
                                        'completed','cancelled')
  order_index     integer     NOT NULL · DEFAULT 0
  created_at      timestamptz DEFAULT now()
  UNIQUE (project_id, code)

────────────────────────────────────────────────────────────────────────

project_transactions
  id              uuid        PK · DEFAULT gen_random_uuid()
  project_id      uuid        NOT NULL · FK → projects.id ON DELETE RESTRICT
  wbs_item_id     uuid        FK → wbs_items.id ON DELETE RESTRICT
  type            text        NOT NULL
                              CHECK IN ('income','expense','transfer')
  amount          numeric     NOT NULL · CHECK > 0
  currency        text        NOT NULL · CHECK IN ('USD','SYP')
  exchange_rate   numeric     —
  category        text        —
  date            date        NOT NULL
  journal_entry_id uuid       FK → journal_entries.id
  notes           text        —
  created_at      timestamptz DEFAULT now()

────────────────────────────────────────────────────────────────────────

asset_depreciation
  id                uuid      PK · DEFAULT gen_random_uuid()
  asset_type        text      NOT NULL
                              CHECK IN ('property','portfolio',
                                        'project','equipment','vehicle')
  asset_id          uuid      NOT NULL (مرجع بالاتفاق — لا FK مباشر)
  method            text      NOT NULL
                              CHECK IN ('straight_line','declining_balance')
  cost              numeric   NOT NULL · CHECK > 0
  residual_value    numeric   NOT NULL · DEFAULT 0
  useful_life_years integer   — (للقسط الثابت)
  depreciation_rate numeric   — (للرصيد المتناقص — نسبة مئوية)
  start_date        date      NOT NULL
  review_frequency  text      NOT NULL · DEFAULT 'annual'
                              CHECK IN ('annual','semi_annual','quarterly')
  next_review_date  date      —
  notes             text      —
  created_at        timestamptz DEFAULT now()

  جديد من STR-007 — IAS 16
  الحسابات التلقائية: 17XX مجمع الاهتلاك + 82XX مصروف الاهتلاك

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§5. ملخص الجداول
━━━━━━━━━━━━━━━━

  الطبقة                    الجداول                            العدد
  ─────────────────────     ─────────────────────────────────  ─────
  مكتب العائلة              family_office · people              4
                            exchange_rates · accounting_periods
  الكيانات والمحاسبة        entities · entity_members           8
                            accounts · journal_entries
                            journal_entry_lines
                            capital_transactions
                            profit_settlements · settlement_shares
  معاملات الكيان            inter_entity_transactions           2
                            distributions
  الأصول                    properties · leases                 10
                            lease_payments · property_expenses
                            portfolios · transactions
                            projects · wbs_items
                            project_transactions
                            asset_depreciation
  ────────────────────────  ─────────────────────────────────  ─────
  المجموع                                                       24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§6. الجداول المحذوفة مقارنةً بـ STR-002 v1.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  الجدول المحذوف              السبب               يحل محله
  ──────────────────────────  ──────────────────  ─────────────────────────
  company                     تعويض معماري        family_office
  company_members             تعويض معماري        entity_members
  portfolio_members           دمج الملكية         entity_members
  property_owners             دمج الملكية         entity_members
  project_members             دمج الملكية         entity_members
  partner_capital_accounts    لا كيانات رأسمالية  entities + accounts (COA)

  الجداول المُعاد هيكلتها:
  ─────────────────────────────────────────────────────────────────────
  capital_transactions   : capital_account_id → entity_id + person_id
  profit_settlements     : entity_type+entity_id → entity_id مباشرة
  distributions          : entity_type+entity_id → entity_id مباشرة
  lease_payments         : portfolio_id حُذف
  property_expenses      : portfolio_id حُذف

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§7. خريطة المفاتيح الخارجية (FK Map)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  الجدول                    الحقل                    يشير إلى
  ─────────────────────     ─────────────────────    ─────────────────────────
  entities                  family_office_id          family_office.id
  entity_members            entity_id                 entities.id
  entity_members            person_id                 people.id
  accounts                  entity_id                 entities.id
  accounts                  parent_id                 accounts.id (self-ref)
  accounting_periods        closing_entry_id          journal_entries.id
  journal_entries           entity_id                 entities.id
  journal_entries           period_id                 accounting_periods.id
  journal_entries           reversal_of               journal_entries.id (self-ref)
  journal_entry_lines       journal_entry_id          journal_entries.id CASCADE
  journal_entry_lines       account_id                accounts.id RESTRICT
  capital_transactions      entity_id                 entities.id
  capital_transactions      person_id                 people.id
  capital_transactions      journal_entry_id          journal_entries.id
  profit_settlements        entity_id                 entities.id
  profit_settlements        journal_entry_id          journal_entries.id
  settlement_shares         settlement_id             profit_settlements.id CASCADE
  settlement_shares         person_id                 people.id
  settlement_shares         capital_transaction_id    capital_transactions.id
  inter_entity_transactions from_entity_id            entities.id
  inter_entity_transactions to_entity_id              entities.id
  inter_entity_transactions from_journal_entry_id     journal_entries.id
  inter_entity_transactions to_journal_entry_id       journal_entries.id
  distributions             entity_id                 entities.id
  distributions             person_id                 people.id
  distributions             journal_entry_id          journal_entries.id
  properties                entity_id                 entities.id
  leases                    property_id               properties.id
  lease_payments            lease_id                  leases.id
  lease_payments            journal_entry_id          journal_entries.id
  property_expenses         property_id               properties.id
  property_expenses         journal_entry_id          journal_entries.id
  portfolios                entity_id                 entities.id
  transactions              portfolio_id              portfolios.id
  transactions              journal_entry_id          journal_entries.id
  projects                  entity_id                 entities.id
  wbs_items                 project_id                projects.id CASCADE
  wbs_items                 parent_id                 wbs_items.id (self-ref)
  project_transactions      project_id                projects.id
  project_transactions      wbs_item_id               wbs_items.id
  project_transactions      journal_entry_id          journal_entries.id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§8. ترتيب الإنشاء (Creation Order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1.  family_office
  2.  people
  3.  exchange_rates
  4.  entities                  ← يعتمد على family_office
  5.  entity_members            ← يعتمد على entities + people
  6.  accounting_periods        ← مستقل (لا entity_id)
  7.  accounts                  ← بدون parent_id FK ثم ALTER TABLE
                                   يعتمد على entities
  8.  journal_entries           ← بدون reversal_of FK ثم ALTER TABLE
                                   يعتمد على entities + accounting_periods
  9.  journal_entry_lines       ← يعتمد على journal_entries + accounts
  10. capital_transactions      ← يعتمد على entities + people + journal_entries
  11. profit_settlements        ← يعتمد على entities + journal_entries
  12. settlement_shares         ← يعتمد على profit_settlements + people
                                   + capital_transactions
  13. inter_entity_transactions ← يعتمد على entities + journal_entries
  14. distributions             ← يعتمد على entities + people + journal_entries
  15. properties                ← يعتمد على entities
  16. leases                    ← يعتمد على properties
  17. lease_payments            ← يعتمد على leases + journal_entries
  18. property_expenses         ← يعتمد على properties + journal_entries
  19. portfolios                ← يعتمد على entities
  20. transactions              ← يعتمد على portfolios + journal_entries
  21. projects                  ← يعتمد على entities
  22. wbs_items                 ← بدون parent_id FK ثم ALTER TABLE
                                   يعتمد على projects
  23. project_transactions      ← يعتمد على projects + wbs_items
                                   + journal_entries
  24. asset_depreciation        ← مستقل (مرجع بالاتفاق لا FK)

  ثلاثة جداول تحتاج self-reference بعد الإنشاء:
    accounts.parent_id · wbs_items.parent_id · journal_entries.reversal_of
  يُضاف قيد الـ FK بعد إنشاء الجدول بـ ALTER TABLE ADD CONSTRAINT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§9. Triggers الأساسية
━━━━━━━━━━━━━━━━━━━━━

§9.1 auto_create_entity_coa()
  يُطلَق: AFTER INSERT ON entities
  يُنشئ: شجرة الحسابات الافتراضية للكيان (1000..9000)
  يتضمن: حسابات الكيان الأساسية + 2300 قروض الورثة + 3100/3200 حصص/توزيعات
  يستخدم: entity_id في كل حساب

§9.2 auto_create_member_accounts()
  يُطلَق: AFTER INSERT ON entity_members
  يُنشئ: ثلاثة حسابات لكل عضو في COA الكيان:
    31XX حصة الاستحقاق  (equity · credit-normal)
    32XX التوزيعات المسحوبة (equity · debit-normal)
    23XX قرض الوارث (liability · credit-normal)
  metadata: {"partner_id": person_id}
  يتضمن: entity_id + company_id بالمعنى الجديد

§9.3 validate_entity_shares()
  يُطلَق: AFTER INSERT OR UPDATE ON entity_members
  يتحقق: Σ (share_numerator::float / share_denominator) = 1.000
          لجميع أعضاء نفس entity_id
  يرفض: إذا كان المجموع خارج نطاق (0.9999..1.0001)

§9.4 set_updated_at()
  يُطلَق: BEFORE UPDATE ON family_office, people, portfolios, properties
  يضبط: updated_at = now()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§10. شجرة الحسابات الافتراضية لكل كيان
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1000  الأصول
    1100  النقدية
      1110  النقدية USD
      1120  النقدية SYP
    1130  ذمم بينية مدينة        ← حسابات المعاملات البينية
    1200  الاستثمارات
    1300  العقارات
    1400  المشاريع
    1500  المعدات
    1550  مخزون السكراب
    1600  مركبات وآليات
    17XX  مجمع اهتلاك [الأصل]    ← يُنشأ تلقائياً عند إضافة أصل
  2000  الخصوم
    2100  الخصوم المتداولة
      2110  الذمم الدائنة
      2120  مصروفات مستحقة
    2150  ذمم بينية دائنة        ← حسابات المعاملات البينية
    2300  قروض الورثة
      23XX  قرض [الوارث]          ← يُنشأ تلقائياً لكل عضو
  3000  حقوق الاستحقاق
    3100  حصص الاستحقاق
      31XX  حصة [الوارث]          ← يُنشأ تلقائياً لكل عضو
    3200  التوزيعات المسحوبة
      32XX  توزيعات [الوارث]      ← يُنشأ تلقائياً لكل عضو
    3300  الأرباح المحتجزة
  4000  الإيرادات التشغيلية
    4100  إيرادات الإيجار
    4300  إيرادات المحافظ
    4510  إيرادات بيع السكراب
  5000  الإيرادات الاستثمارية
  6000  إيرادات التمويل
  7000  المصروفات التشغيلية
    7100  مصروفات العقارات
    7300  مصروفات المحافظ
  8000  المصروفات الاستثمارية
    82XX  مصروف اهتلاك [الأصل]   ← يُنشأ تلقائياً عند إضافة أصل
    8510  خسارة التخلص من الأصول
    8520  خسارة بيع السكراب
  9000  مصروفات التمويل

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§11. نموذج التقارير المجمَّعة على مستوى مكتب العائلة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§11.1 صافي ثروة الوارث (NAV)

  لكل وارث p:
    NAV(p) = Σ_e [ NAV(entity_e) × (share_numerator / share_denominator) ]
             حيث e = جميع الكيانات التي p عضو فيها

  NAV(entity_e) = مجموع الأصول − مجموع الخصوم
                = من journal_entry_lines على حسابات entity_e

§11.2 تقرير كشف الوارث

  يعرض لكل وارث عبر كل الكيانات:
    - حصة الاستحقاق (31XX) لكل كيان
    - التوزيعات المسحوبة (32XX) لكل كيان
    - قروضه للصندوق (23XX) لكل كيان
    - صافي استحقاقه الإجمالي

§11.3 لا توحيد محاسبي (No Consolidation)

  مكتب العائلة لا يُنتج قيود إقفال موحدة.
  التقارير المجمَّعة محسوبة في طبقة التطبيق (TypeScript) لا في DB.
  المعاملات البينية تظهر في كلا الكيانين دون إلغاء.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§12. العلاقة بالوثائق الأخرى
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  الوثيقة    الإصدار   العلاقة
  ─────────  ────────  ──────────────────────────────────────────────────
  STR-002    v1.5      المخطط القديم (قبل إعادة البناء) — مرجع للمقارنة
  STR-006    v1.4      المحرك المحاسبي — يُطبَّق على كل كيان مستقل
  STR-007    v1.1      إدارة أصول الثروة — الاهتلاك والسكراب
  POL-001    v1.1      سياسة تسجيل القيود — draft→review→post
  POL-002    v1.1      سياسة التدقيق المحاسبي
  STR-004    v1.0      Brand & Design Guidelines (لا تغيير)
  STR-008    v1.0      هذه الوثيقة — المخطط الجديد

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§13. سياسات RLS للجداول الجديدة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

مستخلص من: RLS-POLICY-MATRIX v1.1 (مؤرشف)
المبدأ: تطبيق أحادي المستخدم — جميع السياسات تمنح الوصول الكامل للمستخدم
        المُوثَّق (authenticated) وتحجب أي وصول غير مُوثَّق.

§13.1 النمط أ — Wildcard (سياسة واحدة لكل العمليات)

  يُستخدم مع: الجداول التي تُعدَّل كثيراً وبأنماط موحدة.

  ```sql
  ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "authenticated_full_access"
  ON public.<table_name>
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
  ```

§13.2 النمط ب — منفصلة (4 سياسات مستقلة)

  يُستخدم مع: الجداول ذات الحساسية الأعلى أو التي قد تحتاج تقييداً مستقبلاً.

  ```sql
  ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "auth_select_<table>"
    ON public.<table> FOR SELECT TO authenticated USING (true);
  CREATE POLICY "auth_insert_<table>"
    ON public.<table> FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "auth_update_<table>"
    ON public.<table> FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "auth_delete_<table>"
    ON public.<table> FOR DELETE TO authenticated USING (true);
  ```

  > ملاحظة: كلا النمطين متكافئان وظيفياً لتطبيق أحادي المستخدم.
  > التمييز بينهما هو للتهيؤ لأي تقييد مستقبلي لا للأداء.

§13.3 حالة خاصة — family_office (صف واحد · لا INSERT · لا DELETE)

  ```sql
  ALTER TABLE public.family_office ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "auth_select_family_office"
    ON public.family_office FOR SELECT TO authenticated USING (true);
  CREATE POLICY "auth_update_family_office"
    ON public.family_office FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
  ```

  السبب: family_office جدول أحادي الصف (single-row).
  INSERT يحدث مرة واحدة عبر seed migration مباشرةً.
  DELETE محظور نهائياً — لا واجهة لحذف مكتب العائلة.

§13.4 مصفوفة تطبيق النمط على الجداول الـ 24

  #    الجدول                      النمط   ملاحظة
  ──   ────────────────────────    ─────   ──────────────────────────────────
  1    family_office               خاص     SELECT + UPDATE فقط — راجع §13.3
  2    people                      ب       —
  3    exchange_rates              ب       —
  4    accounting_periods          أ       —
  5    entities                    ب       —
  6    entity_members              ب       —
  7    accounts                    أ       —
  8    journal_entries             أ       —
  9    journal_entry_lines         أ       —
  10   capital_transactions        ب       —
  11   profit_settlements          ب       —
  12   settlement_shares           ب       —
  13   inter_entity_transactions   ب       —
  14   distributions               ب       —
  15   properties                  ب       —
  16   leases                      ب       —
  17   lease_payments              ب       —
  18   property_expenses           ب       —
  19   portfolios                  ب       —
  20   transactions                ب       —
  21   projects                    أ       —
  22   wbs_items                   أ       —
  23   project_transactions        أ       —
  24   asset_depreciation          أ       —

§13.5 استعلام التدقيق

  لإعادة التحقق من تغطية RLS في أي وقت من Supabase SQL Editor:

  ```sql
  SELECT
    c.relname        AS table_name,
    c.relrowsecurity AS rls_enabled,
    p.polname        AS policy_name,
    p.polcmd         AS command
  FROM pg_class c
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND c.relkind = 'r'
  ORDER BY c.relname, p.polcmd;
  ```

  النتيجة الصحيحة: لا يوجد صف يجمع بين
    rls_enabled = true  و  policy_name = null
  في نفس الوقت.

§13.6 قاعدة الصيانة

  عند إضافة جدول جديد في أي sprint لاحق:
    1. فعّل RLS في نفس ملف الـ migration مباشرةً
    2. طبّق النمط المناسب (أ أو ب) وفق §13.4
    3. أضف صفاً جديداً للجدول في مصفوفة §13.4
    4. شغّل استعلام §13.5 للتحقق قبل الـ commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§14. سجل التغييرات
━━━━━━━━━━━━━━━━━━━

  التاريخ      الإصدار   الوصف
  ──────────   ────────  ──────────────────────────────────────────────────────
  2026-06-15   1.0       الإصدار الأول — مستخلص من جلسة Sprint 100
                         المخطط الجديد لإعادة بناء Family CFO
                         24 جدولاً · هيكل ثلاثي · entity_members موحد

  2026-06-17   1.1       إضافة §13 سياسات RLS — منقولة من RLS-POLICY-MATRIX
                         v1.1 (مؤرشف). يشمل: نمطَي A/B · حالة خاصة
                         family_office · مصفوفة الـ 24 جدول ·
                         استعلام التدقيق · قاعدة الصيانة.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF DOCUMENT — STR-008 v1.1