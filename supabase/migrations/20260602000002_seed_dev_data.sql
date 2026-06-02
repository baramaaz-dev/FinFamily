-- ============================================================
-- Migration : seed_dev_data
-- Description: DEV ONLY — inserts realistic Arabic test data
--              for UI development and manual testing.
-- Depends on : 20260601000001_fix_existing_schema.sql (M-01)
--              20260601000002_add_projects_wbs.sql     (M-02)
--              20260601000003_add_accounting_core.sql  (M-03)
-- ⚠️  DO NOT apply to production.
-- ============================================================

BEGIN;

DO $$
DECLARE
  -- ── People ──────────────────────────────────────────────
  p_khalid  uuid := gen_random_uuid();
  p_ahmad   uuid := gen_random_uuid();
  p_sara    uuid := gen_random_uuid();
  p_omar    uuid := gen_random_uuid();

  -- ── Portfolios ──────────────────────────────────────────
  pf_usd    uuid := gen_random_uuid();
  pf_syp    uuid := gen_random_uuid();
  pf_gold   uuid := gen_random_uuid();

  -- ── Properties ──────────────────────────────────────────
  pr_res    uuid := gen_random_uuid();   -- residential / rented
  pr_com    uuid := gen_random_uuid();   -- commercial  / vacant

  -- ── Lease ───────────────────────────────────────────────
  l_res     uuid := gen_random_uuid();

BEGIN

  -- ── Guard: skip if seed already applied ─────────────────
  IF EXISTS (SELECT 1 FROM people LIMIT 1) THEN
    RAISE NOTICE '[seed_dev_data] Data already present — skipping.';
    RETURN;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- 1. PEOPLE
  -- ────────────────────────────────────────────────────────
  INSERT INTO people (id, name, relation, notes) VALUES
    (p_khalid, 'خالد العمر',  'شريك مؤسس', NULL),
    (p_ahmad,  'أحمد العمر',  'شريك مؤسس', NULL),
    (p_sara,   'سارة العمر',  'وارثة',      NULL),
    (p_omar,   'عمر العمر',   'وارث',       NULL);

  -- ────────────────────────────────────────────────────────
  -- 2. PORTFOLIOS
  -- ────────────────────────────────────────────────────────
  INSERT INTO portfolios (id, name, type, description) VALUES
    (pf_usd,  'الصندوق النقدي USD', 'cash_usd', 'الاحتياطي النقدي بالدولار الأمريكي'),
    (pf_syp,  'الصندوق النقدي SYP', 'cash_syp', 'الاحتياطي النقدي بالليرة السورية'),
    (pf_gold, 'محفظة الذهب',        'gold',     'احتياطي الذهب العائلي');

  -- ────────────────────────────────────────────────────────
  -- 3. PORTFOLIO MEMBERS
  --    مجموع الحصص = 1 لكل محفظة (يتحقق منه trigger عند COMMIT)
  -- ────────────────────────────────────────────────────────

  -- pf_usd : خالد ½  + أحمد ⅓  + سارة ⅙  = 1
  INSERT INTO portfolio_members
    (portfolio_id, person_id, share_numerator, share_denominator, joined_date)
  VALUES
    (pf_usd, p_khalid, 1, 2, '2024-01-01'),
    (pf_usd, p_ahmad,  1, 3, '2024-01-01'),
    (pf_usd, p_sara,   1, 6, '2024-01-01');

  -- pf_syp : خالد ⅔  + أحمد ⅓  = 1
  INSERT INTO portfolio_members
    (portfolio_id, person_id, share_numerator, share_denominator, joined_date)
  VALUES
    (pf_syp, p_khalid, 2, 3, '2024-01-01'),
    (pf_syp, p_ahmad,  1, 3, '2024-01-01');

  -- pf_gold: أحمد ½  + عمر  ½  = 1
  INSERT INTO portfolio_members
    (portfolio_id, person_id, share_numerator, share_denominator, joined_date)
  VALUES
    (pf_gold, p_ahmad, 1, 2, '2024-01-01'),
    (pf_gold, p_omar,  1, 2, '2024-01-01');

  -- ────────────────────────────────────────────────────────
  -- 4. PROPERTIES
  -- ────────────────────────────────────────────────────────
  INSERT INTO properties
    (id, name, type, location, purchase_date, estimated_value, status)
  VALUES
    (pr_res, 'شقة المزة',    'residential', 'دمشق — المزة',    '2015-06-01', 120000.0000, 'rented'),
    (pr_com, 'محل الميدان',  'commercial',  'دمشق — الميدان',  '2018-03-15',  85000.0000, 'vacant');

  -- ────────────────────────────────────────────────────────
  -- 5. PROPERTY OWNERS
  --    مجموع الحصص = 1 لكل عقار (يتحقق منه trigger عند COMMIT)
  -- ────────────────────────────────────────────────────────

  -- pr_res : خالد ½  + أحمد ½  (إرث)
  INSERT INTO property_owners
    (property_id, person_id, share_numerator, share_denominator, ownership_basis)
  VALUES
    (pr_res, p_khalid, 1, 2, 'إرث'),
    (pr_res, p_ahmad,  1, 2, 'إرث');

  -- pr_com : خالد ⅔  + عمر  ⅓  (شراء)
  INSERT INTO property_owners
    (property_id, person_id, share_numerator, share_denominator, ownership_basis)
  VALUES
    (pr_com, p_khalid, 2, 3, 'شراء'),
    (pr_com, p_omar,   1, 3, 'شراء');

  -- ────────────────────────────────────────────────────────
  -- 6. LEASE (عقد إيجار نشط على شقة المزة)
  -- ────────────────────────────────────────────────────────
  INSERT INTO leases
    (id, property_id, tenant_name, rent_amount, currency, frequency, start_date, end_date)
  VALUES
    (l_res, pr_res, 'محمد الحسن', 500.0000, 'USD', 'monthly', '2025-01-01', '2026-12-31');

  -- ────────────────────────────────────────────────────────
  -- 7. EXCHANGE RATES  (SYP مقابل 1 USD)
  -- ────────────────────────────────────────────────────────
  INSERT INTO exchange_rates (rate, date, notes) VALUES
    (13500.0000, '2026-04-01', 'سعر أبريل 2026'),
    (13750.0000, '2026-05-01', 'سعر مايو 2026'),
    (14000.0000, '2026-06-01', 'سعر يونيو 2026');

  -- ────────────────────────────────────────────────────────
  -- 8. TRANSACTIONS (10 معاملات: دخل / مصروف / تحويل)
  -- ────────────────────────────────────────────────────────
  INSERT INTO transactions
    (portfolio_id, type, amount, currency, exchange_rate, category, date, notes)
  VALUES
    -- دخل — إيجارات شهرية USD
    (pf_usd, 'income',    500.0000,     'USD', NULL,       'إيجار',        '2026-01-15', 'إيجار يناير — شقة المزة'),
    (pf_usd, 'income',    500.0000,     'USD', NULL,       'إيجار',        '2026-02-15', 'إيجار فبراير — شقة المزة'),
    (pf_usd, 'income',    500.0000,     'USD', NULL,       'إيجار',        '2026-03-15', 'إيجار مارس — شقة المزة'),
    -- دخل — إيجار SYP
    (pf_syp, 'income',  2800000.0000,   'SYP', 14000.0000, 'إيجار',        '2026-04-01', 'إيجار أبريل — محل الميدان'),
    -- دخل — أرباح
    (pf_usd, 'income',   1200.0000,     'USD', NULL,       'أرباح مشروع',  '2026-05-10', 'توزيع أرباح المشروع التجاري'),
    -- مصروفات
    (pf_usd, 'expense',   150.0000,     'USD', NULL,       'صيانة',        '2026-02-20', 'أعمال صيانة — شقة المزة'),
    (pf_syp, 'expense',  420000.0000,   'SYP', 14000.0000, 'فواتير',       '2026-03-05', 'فاتورة الكهرباء والماء'),
    (pf_usd, 'expense',    80.0000,     'USD', NULL,       'رسوم',         '2026-04-12', 'رسوم إدارية وقانونية'),
    -- تحويلات
    (pf_usd, 'transfer',  300.0000,     'USD', NULL,       'تحويل',        '2026-03-20', 'تحويل داخلي إلى الصندوق SYP'),
    (pf_syp, 'transfer', 5600000.0000,  'SYP', 14000.0000, 'تحويل',        '2026-05-01', 'تحويل لتغطية مصروفات مستحقة');

  RAISE NOTICE '[seed_dev_data] ✅ Seed data inserted successfully.';

END $$;

COMMIT;

-- ============================================================
-- ⚠️  DEV SEED — WIPE INSTRUCTIONS
-- Run the block below ONLY in development to remove all seed data.
-- Execute in this exact order to respect FK constraints.
-- NEVER run this on production.
-- ============================================================
--
-- TRUNCATE
--   transactions,
--   lease_payments,
--   property_expenses,
--   leases,
--   portfolio_members,
--   property_owners,
--   properties,
--   portfolios,
--   exchange_rates,
--   people
-- RESTART IDENTITY CASCADE;
--
-- ============================================================