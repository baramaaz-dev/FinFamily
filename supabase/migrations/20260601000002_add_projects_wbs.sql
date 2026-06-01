-- ============================================================
-- Migration: add_projects_wbs
-- Description: Adds the v1.1 project tables:
--   projects, project_members (Effective Dates pattern),
--   wbs_items (self-ref FK added via ALTER TABLE),
--   project_transactions (includes journal_entry_id column;
--     FK on journal_entry_id added in M-03).
--   Includes RLS, authenticated_full_access policies, and
--   share-sum trigger for project_members (active rows only).
-- Depends on: 20260601000001_fix_existing_schema
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. CREATE TABLES
--    STR-002 §2.6 — creation order: projects → project_members
--    → wbs_items (without parent_id FK) → project_transactions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text          NOT NULL,
  description     text,
  status          text          NOT NULL DEFAULT 'planning'
                                CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  start_date      date,
  end_date        date,
  budget_amount   numeric(18,4),
  budget_currency text          CHECK (budget_currency IN ('USD','SYP')),
  notes           text,
  created_at      timestamptz   DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid        NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  person_id         uuid        NOT NULL REFERENCES people(id)    ON DELETE RESTRICT,
  share_numerator   integer     NOT NULL CHECK (share_numerator > 0),
  share_denominator integer     NOT NULL CHECK (share_denominator > 0),
  effective_from    date        NOT NULL,
  effective_to      date,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (project_id, person_id, effective_from)
);

-- wbs_items created WITHOUT self-referencing parent_id FK;
-- the FK is added via ALTER TABLE below (STR-002 §4 creation order rule)
CREATE TABLE IF NOT EXISTS wbs_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  parent_id       uuid,
  code            text          NOT NULL,
  name            text          NOT NULL,
  level           integer       NOT NULL CHECK (level > 0),
  description     text,
  budget_amount   numeric(18,4),
  budget_currency text          CHECK (budget_currency IN ('USD','SYP')),
  status          text          NOT NULL DEFAULT 'planned'
                                CHECK (status IN ('planned','in_progress','completed','cancelled')),
  order_index     integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   DEFAULT now(),
  UNIQUE (project_id, code)
);

-- project_transactions includes journal_entry_id as a bare UUID column;
-- FK constraint on journal_entry_id is added in M-03 once
-- journal_entries table exists (STR-002 §7.6 M-03 design)
CREATE TABLE IF NOT EXISTS project_transactions (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid          NOT NULL REFERENCES projects(id)  ON DELETE RESTRICT,
  wbs_item_id      uuid          REFERENCES wbs_items(id)          ON DELETE RESTRICT,
  type             text          NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount           numeric(18,4) NOT NULL CHECK (amount > 0),
  currency         text          NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate    numeric(18,4),
  category         text,
  date             date          NOT NULL,
  journal_entry_id uuid,
  notes            text,
  created_at       timestamptz   DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. ALTER TABLE — self-referencing FK on wbs_items
--    STR-002 §4 — wbs_items.parent_id added after table creation
--    Note: ADD CONSTRAINT IF NOT EXISTS is not supported in
--    PostgreSQL — using DO $$ block for idempotent constraint
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'wbs_items'
      AND constraint_name = 'wbs_items_parent_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE wbs_items
      ADD CONSTRAINT wbs_items_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES wbs_items(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. Share-sum function and trigger for project_members
--    STR-002 §2.6 — validates active shares (effective_to IS NULL)
--    only when active members exist; allows 0-member state.
--    Uses same LCM/gcd pattern as portfolio_members trigger.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_share_sum_project()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  lcm_val   bigint;
  total_num bigint := 0;
  r         RECORD;
  v_project_id uuid;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  lcm_val := 1;

  FOR r IN
    SELECT share_denominator
    FROM project_members
    WHERE project_id  = v_project_id
      AND effective_to IS NULL
  LOOP
    lcm_val := (lcm_val / gcd(lcm_val, r.share_denominator::bigint))
               * r.share_denominator::bigint;
  END LOOP;

  FOR r IN
    SELECT share_numerator, share_denominator
    FROM project_members
    WHERE project_id  = v_project_id
      AND effective_to IS NULL
  LOOP
    total_num := total_num
               + r.share_numerator::bigint * (lcm_val / r.share_denominator::bigint);
  END LOOP;

  -- Allow 0 active members (project under construction)
  IF total_num > 0 AND total_num <> lcm_val THEN
    RAISE EXCEPTION 'Project % active share sum != 1 (got %/%)',
      v_project_id, total_num, lcm_val;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_project_share_sum ON project_members;
CREATE CONSTRAINT TRIGGER trg_project_share_sum
  AFTER INSERT OR UPDATE ON project_members
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_share_sum_project();

-- ────────────────────────────────────────────────────────────
-- 4. ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_transactions ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 5. RLS POLICIES — authenticated full access
-- ────────────────────────────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON projects
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON project_members
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON wbs_items
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON project_transactions
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;