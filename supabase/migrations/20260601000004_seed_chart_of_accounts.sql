-- ============================================================
-- Migration: seed_chart_of_accounts
-- Description: Seeds the default Chart of Accounts for a
--   family partnership (شركة أشخاص) as defined in
--   STR-002 §2.7. Inserts parent-before-child using
--   subquery JOINs on parent code. Idempotent via
--   ON CONFLICT (code) DO NOTHING.
-- Depends on: 20260601000003_add_accounting_core
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- Level 1 — Root accounts (parent_id = NULL)
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (code, name, account_class, normal_balance, level, is_postable)
VALUES
  ('1000', 'الأصول',         'asset',     'debit',  1, false),
  ('2000', 'الخصوم',         'liability', 'credit', 1, false),
  ('3000', 'حقوق الشركاء',   'equity',    'credit', 1, false),
  ('4000', 'الإيرادات',       'revenue',   'credit', 1, false),
  ('5000', 'المصروفات',       'expense',   'debit',  1, false)
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 2 — Non-postable grouping accounts
--           (under الأصول, الخصوم, حقوق الشركاء)
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, v.cls, v.bal, 2, false
FROM (VALUES
  ('1000', '1100', 'الأصول المتداولة',  'asset',     'debit'),
  ('1000', '1200', 'الأصول الثابتة',   'asset',     'debit'),
  ('2000', '2100', 'الخصوم المتداولة', 'liability', 'credit'),
  ('3000', '3100', 'رأس المال',         'equity',    'credit'),
  ('3000', '3200', 'المسحوبات',         'equity',    'debit')
) AS v(pcode, code, name, cls, bal)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 2 — Postable revenue accounts (direct children of 4000)
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, 'revenue', 'credit', 2, true
FROM (VALUES
  ('4000', '4100', 'إيرادات الإيجار'),
  ('4000', '4200', 'إيرادات المشاريع'),
  ('4000', '4300', 'إيرادات المحافظ')
) AS v(pcode, code, name)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 2 — Postable expense accounts (direct children of 5000)
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, 'expense', 'debit', 2, true
FROM (VALUES
  ('5000', '5100', 'مصروفات التشغيل'),
  ('5000', '5200', 'مصروفات العقارات'),
  ('5000', '5300', 'مصروفات المشاريع')
) AS v(pcode, code, name)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 3 — Postable detail accounts under assets
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, v.cls, v.bal, 3, true
FROM (VALUES
  ('1100', '1110', 'النقدية USD',        'asset', 'debit'),
  ('1100', '1120', 'النقدية SYP',        'asset', 'debit'),
  ('1100', '1130', 'الذمم المدينة',      'asset', 'debit'),
  ('1200', '1210', 'العقارات',           'asset', 'debit'),
  ('1200', '1220', 'الاستثمارات',        'asset', 'debit')
) AS v(pcode, code, name, cls, bal)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 3 — Postable detail accounts under liabilities
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, 'liability', 'credit', 3, true
FROM (VALUES
  ('2100', '2110', 'الذمم الدائنة'),
  ('2100', '2120', 'مصروفات مستحقة')
) AS v(pcode, code, name)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Level 3 — Postable detail accounts under equity
-- ────────────────────────────────────────────────────────────

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, v.code, v.name, 'equity', v.bal, 3, true
FROM (VALUES
  ('3100', '3110', 'رأس مال — شريك أ',  'credit'),
  ('3100', '3120', 'رأس مال — شريك ب',  'credit'),
  ('3200', '3210', 'مسحوبات — شريك أ',  'debit'),
  ('3200', '3220', 'مسحوبات — شريك ب',  'debit')
) AS v(pcode, code, name, bal)
JOIN accounts p ON p.code = v.pcode
ON CONFLICT (code) DO NOTHING;

COMMIT;
