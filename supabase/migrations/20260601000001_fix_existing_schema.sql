-- ============================================================
-- Migration: fix_existing_schema
-- Description: Corrects the 15 v1.0 tables already applied:
--   NUMERIC precision (12→18), ON DELETE behaviors,
--   entity_type CHECK values, journal_entry_id columns,
--   and share-sum triggers for portfolio_members / property_owners.
-- Depends on: 001_initial_schema, 002_rls_policies
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1a. Fix NUMERIC precision: 12,4 → 18,4
--     STR-002 §1.3, §6.2 — all exchange_rate/rate columns
--     must use NUMERIC(18,4)
-- ────────────────────────────────────────────────────────────

ALTER TABLE exchange_rates       ALTER COLUMN rate          TYPE NUMERIC(18,4);
ALTER TABLE transactions         ALTER COLUMN exchange_rate TYPE NUMERIC(18,4);
ALTER TABLE lease_payments       ALTER COLUMN exchange_rate TYPE NUMERIC(18,4);
ALTER TABLE property_expenses    ALTER COLUMN exchange_rate TYPE NUMERIC(18,4);
ALTER TABLE capital_transactions ALTER COLUMN exchange_rate TYPE NUMERIC(18,4);

-- ────────────────────────────────────────────────────────────
-- 1b. Fix ON DELETE CASCADE → RESTRICT
--     STR-002 §3.2 — financial source tables must prevent
--     silent parent deletion.
--     Dynamic constraint-name discovery handles any auto-naming
--     from the original migration.
-- ────────────────────────────────────────────────────────────

-- transactions.portfolio_id
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'transactions'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%portfolio_id%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_portfolio_id_fkey
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT;

-- lease_payments.lease_id
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'lease_payments'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%lease_id%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE lease_payments DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
ALTER TABLE lease_payments
  ADD CONSTRAINT lease_payments_lease_id_fkey
    FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE RESTRICT;

-- property_expenses.property_id
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'property_expenses'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%property_id%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE property_expenses DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
ALTER TABLE property_expenses
  ADD CONSTRAINT property_expenses_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT;

-- capital_transactions.capital_account_id
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'capital_transactions'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%capital_account_id%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE capital_transactions DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
ALTER TABLE capital_transactions
  ADD CONSTRAINT capital_transactions_capital_account_id_fkey
    FOREIGN KEY (capital_account_id)
    REFERENCES partner_capital_accounts(id) ON DELETE RESTRICT;

-- settlement_shares.partner_id
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'settlement_shares'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%partner_id%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE settlement_shares DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;
ALTER TABLE settlement_shares
  ADD CONSTRAINT settlement_shares_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES people(id) ON DELETE RESTRICT;

-- ────────────────────────────────────────────────────────────
-- 1c. Fix entity_type CHECK — add 'project'
--     STR-002 §1.5, v1.1 — polymorphic entity_type must
--     include 'project' across all three tables
-- ────────────────────────────────────────────────────────────

-- partner_capital_accounts
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'partner_capital_accounts'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%entity_type%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE partner_capital_accounts DROP CONSTRAINT %I',
                   v_constraint);
  END IF;
END $$;
ALTER TABLE partner_capital_accounts
  ADD CONSTRAINT partner_capital_accounts_entity_type_check
    CHECK (entity_type IN ('portfolio','property','project'));

-- profit_settlements
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'profit_settlements'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%entity_type%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE profit_settlements DROP CONSTRAINT %I',
                   v_constraint);
  END IF;
END $$;
ALTER TABLE profit_settlements
  ADD CONSTRAINT profit_settlements_entity_type_check
    CHECK (entity_type IN ('portfolio','property','project'));

-- distributions
DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name    = 'distributions'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%entity_type%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE distributions DROP CONSTRAINT %I',
                   v_constraint);
  END IF;
END $$;
ALTER TABLE distributions
  ADD CONSTRAINT distributions_entity_type_check
    CHECK (entity_type IN ('portfolio','property','project'));

-- ────────────────────────────────────────────────────────────
-- 1d. Add journal_entry_id columns (bare UUID, no FK yet)
--     FK constraints are added in M-03 after journal_entries
--     table is created.
--     STR-002 §2.2, §2.3, §2.4 — source tables point to GL
-- ────────────────────────────────────────────────────────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid;

ALTER TABLE lease_payments
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid;

ALTER TABLE property_expenses
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid;

ALTER TABLE capital_transactions
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid;

-- ────────────────────────────────────────────────────────────
-- 1e. Share-sum validation functions and triggers
--     STR-002 §2.2 (portfolio_members) and §2.3 (property_owners)
--     Uses PostgreSQL 13+ built-in gcd() for LCM calculation —
--     integer arithmetic only, no floating-point comparison.
--     DEFERRABLE INITIALLY DEFERRED allows multi-row INSERT
--     within a single transaction before validation fires.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_share_sum_portfolio()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  lcm_val   bigint;
  total_num bigint := 0;
  r         RECORD;
BEGIN
  lcm_val := 1;
  FOR r IN
    SELECT share_denominator
    FROM portfolio_members
    WHERE portfolio_id = NEW.portfolio_id
  LOOP
    lcm_val := (lcm_val / gcd(lcm_val, r.share_denominator::bigint))
               * r.share_denominator::bigint;
  END LOOP;

  FOR r IN
    SELECT share_numerator, share_denominator
    FROM portfolio_members
    WHERE portfolio_id = NEW.portfolio_id
  LOOP
    total_num := total_num
               + r.share_numerator::bigint * (lcm_val / r.share_denominator::bigint);
  END LOOP;

  IF total_num <> lcm_val THEN
    RAISE EXCEPTION 'Portfolio % share sum != 1 (got %/%)',
      NEW.portfolio_id, total_num, lcm_val;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION check_share_sum_property()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  lcm_val   bigint;
  total_num bigint := 0;
  r         RECORD;
BEGIN
  lcm_val := 1;
  FOR r IN
    SELECT share_denominator
    FROM property_owners
    WHERE property_id = NEW.property_id
  LOOP
    lcm_val := (lcm_val / gcd(lcm_val, r.share_denominator::bigint))
               * r.share_denominator::bigint;
  END LOOP;

  FOR r IN
    SELECT share_numerator, share_denominator
    FROM property_owners
    WHERE property_id = NEW.property_id
  LOOP
    total_num := total_num
               + r.share_numerator::bigint * (lcm_val / r.share_denominator::bigint);
  END LOOP;

  IF total_num <> lcm_val THEN
    RAISE EXCEPTION 'Property % share sum != 1 (got %/%)',
      NEW.property_id, total_num, lcm_val;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_portfolio_share_sum ON portfolio_members;
CREATE CONSTRAINT TRIGGER trg_portfolio_share_sum
  AFTER INSERT OR UPDATE ON portfolio_members
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_share_sum_portfolio();

DROP TRIGGER IF EXISTS trg_property_share_sum ON property_owners;
CREATE CONSTRAINT TRIGGER trg_property_share_sum
  AFTER INSERT OR UPDATE ON property_owners
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_share_sum_property();

COMMIT;
