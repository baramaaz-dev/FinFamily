-- ============================================================
-- Migration: add_accounting_core
-- Description: Adds the v1.2 double-entry accounting system:
--   accounting_periods, accounts (self-ref FK via ALTER),
--   journal_entries (self-ref reversal_of FK via ALTER),
--   journal_entry_lines.
--   Also: adds journal_entry_id FK constraints on 5 source
--   tables (columns were added in M-01 and M-02), creates
--   balance-check trigger on journal_entry_lines, and creates
--   the general_ledger VIEW (STR-002 §2.7).
-- Depends on: 20260601000002_add_projects_wbs
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. CREATE TABLES
--    STR-002 §4 creation order: accounting_periods → accounts
--    (no parent_id FK yet) → journal_entries (no reversal_of FK
--    yet) → journal_entry_lines
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounting_periods (
  id            uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year   integer   NOT NULL,
  period_number integer   NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  name          text      NOT NULL,
  start_date    date      NOT NULL,
  end_date      date      NOT NULL,
  status        text      NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','closed','locked')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (fiscal_year, period_number)
);

-- accounts created WITHOUT self-referencing parent_id FK
CREATE TABLE IF NOT EXISTS accounts (
  id             uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      uuid,
  code           text      NOT NULL UNIQUE,
  name           text      NOT NULL,
  account_class  text      NOT NULL
                           CHECK (account_class IN ('asset','liability','equity','revenue','expense')),
  normal_balance text      NOT NULL CHECK (normal_balance IN ('debit','credit')),
  level          integer   NOT NULL CHECK (level > 0),
  is_postable    boolean   NOT NULL DEFAULT false,
  is_active      boolean   NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- journal_entries created WITHOUT self-referencing reversal_of FK
CREATE TABLE IF NOT EXISTS journal_entries (
  id           uuid      PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id    uuid      NOT NULL REFERENCES accounting_periods(id) ON DELETE RESTRICT,
  entry_date   date      NOT NULL,
  reference_no text,
  description  text      NOT NULL,
  source_type  text      NOT NULL CHECK (source_type IN (
                 'manual','transaction','project_transaction',
                 'lease_payment','property_expense','capital_transaction'
               )),
  source_id    uuid,
  status       text      NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','posted','reversed')),
  reversal_of  uuid,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid          NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id       uuid          NOT NULL REFERENCES accounts(id)        ON DELETE RESTRICT,
  debit_amount     numeric(18,4) NOT NULL DEFAULT 0 CHECK (debit_amount  >= 0),
  credit_amount    numeric(18,4) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  currency         text          NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate    numeric(18,4),
  description      text,
  created_at       timestamptz   DEFAULT now(),
  CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- ────────────────────────────────────────────────────────────
-- 2. ALTER TABLE — self-referencing FKs
--    STR-002 §4 — added after table creation to avoid circular
--    dependency errors.
--    Note: ADD CONSTRAINT IF NOT EXISTS is not supported in
--    PostgreSQL — using DO $$ blocks for idempotent constraints.
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'accounts'
      AND constraint_name = 'accounts_parent_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'journal_entries'
      AND constraint_name = 'journal_entries_reversal_of_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE journal_entries
      ADD CONSTRAINT journal_entries_reversal_of_fkey
      FOREIGN KEY (reversal_of) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. ALTER TABLE — add FK constraints on journal_entry_id
--    Columns were added as bare UUIDs in M-01 (4 tables) and
--    at CREATE TABLE time in M-02 (project_transactions).
--    All default to ON DELETE RESTRICT — a posted journal entry
--    cannot be deleted while source records reference it.
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'transactions'
      AND constraint_name = 'transactions_journal_entry_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_journal_entry_id_fkey
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'lease_payments'
      AND constraint_name = 'lease_payments_journal_entry_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE lease_payments
      ADD CONSTRAINT lease_payments_journal_entry_id_fkey
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'property_expenses'
      AND constraint_name = 'property_expenses_journal_entry_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE property_expenses
      ADD CONSTRAINT property_expenses_journal_entry_id_fkey
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'capital_transactions'
      AND constraint_name = 'capital_transactions_journal_entry_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE capital_transactions
      ADD CONSTRAINT capital_transactions_journal_entry_id_fkey
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name      = 'project_transactions'
      AND constraint_name = 'project_transactions_journal_entry_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE project_transactions
      ADD CONSTRAINT project_transactions_journal_entry_id_fkey
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. Balance-check trigger on journal_entry_lines
--    STR-002 §1.7 — Σ debit = Σ credit for posted entries.
--    Fires after each line insert/update; only enforces balance
--    when the parent entry is already 'posted'.
--    DEFERRABLE INITIALLY DEFERRED allows building up lines
--    within a transaction before the check fires at COMMIT.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  total_debit  NUMERIC(18,4);
  total_credit NUMERIC(18,4);
  entry_status text;
BEGIN
  SELECT status INTO entry_status
  FROM journal_entries
  WHERE id = NEW.journal_entry_id;

  IF entry_status = 'posted' THEN
    SELECT COALESCE(SUM(debit_amount),  0),
           COALESCE(SUM(credit_amount), 0)
    INTO total_debit, total_credit
    FROM journal_entry_lines
    WHERE journal_entry_id = NEW.journal_entry_id;

    IF total_debit <> total_credit THEN
      RAISE EXCEPTION
        'Journal entry % is unbalanced: debit=% credit=%',
        NEW.journal_entry_id, total_debit, total_credit;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_journal_balance ON journal_entry_lines;
CREATE CONSTRAINT TRIGGER trg_journal_balance
  AFTER INSERT OR UPDATE ON journal_entry_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance();

-- ────────────────────────────────────────────────────────────
-- 5. General Ledger VIEW
--    STR-002 §2.7 — exact SQL from the specification.
--    Read-only projection over posted journal entry lines.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW general_ledger AS
SELECT
  a.code             AS account_code,
  a.name             AS account_name,
  a.account_class,
  a.normal_balance,
  ap.fiscal_year,
  ap.period_number,
  ap.name            AS period_name,
  je.entry_date,
  je.reference_no,
  je.description     AS entry_description,
  jel.description    AS line_description,
  jel.debit_amount,
  jel.credit_amount,
  jel.currency,
  jel.exchange_rate,
  je.source_type,
  je.source_id
FROM journal_entry_lines     jel
JOIN journal_entries         je  ON je.id   = jel.journal_entry_id
JOIN accounts                a   ON a.id    = jel.account_id
JOIN accounting_periods      ap  ON ap.id   = je.period_id
WHERE je.status = 'posted'
ORDER BY a.code, je.entry_date, je.id;

-- ────────────────────────────────────────────────────────────
-- 6. ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE accounting_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines   ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 7. RLS POLICIES — authenticated full access
-- ────────────────────────────────────────────────────────────

CREATE POLICY "authenticated_full_access" ON accounting_periods
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON accounts
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON journal_entries
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_full_access" ON journal_entry_lines
  FOR ALL TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;