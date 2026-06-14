-- ============================================================
-- Migration: period_closing_columns
-- Description: S-103 — adds closed_at, locked_at, closing_entry_id
--   to accounting_periods; extends journal_entries source_type CHECK
--   to include 'reversal', 'settlement', 'closing'.
-- Depends on: 20260613000003_link_accounts_to_company
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Add closing metadata columns to accounting_periods
-- ────────────────────────────────────────────────────────────

ALTER TABLE accounting_periods
  ADD COLUMN IF NOT EXISTS closed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at         timestamptz,
  ADD COLUMN IF NOT EXISTS closing_entry_id  uuid
    REFERENCES journal_entries(id);

-- ────────────────────────────────────────────────────────────
-- 2. Extend journal_entries source_type CHECK to include
--    'reversal', 'settlement', 'closing'.
--    Use dynamic discovery (same pattern as M-20260612000002)
--    to find and drop the existing named/unnamed constraint.
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema    = 'public'
    AND table_name      = 'journal_entries'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%source_type%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE journal_entries DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE journal_entries
  ADD CONSTRAINT journal_entries_source_type_check
  CHECK (source_type IN (
    'manual',
    'transaction',
    'project_transaction',
    'lease_payment',
    'property_expense',
    'capital_transaction',
    'profit_settlement',
    'settlement',
    'reversal',
    'closing'
  ));

COMMIT;
