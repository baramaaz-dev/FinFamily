-- ============================================================
-- Migration: auto_partner_accounts_trigger
-- Description: Adds metadata column to accounts, creates a
--   trigger that auto-creates capital + drawings ledger
--   accounts for every new person, and backfills existing
--   people who lack these accounts. (S-084)
-- Depends on: 20260601000004_seed_chart_of_accounts
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- Step 0 — Add metadata column to accounts (idempotent)
-- ────────────────────────────────────────────────────────────
-- The metadata JSONB column stores { "partner_id": "<uuid>" }
-- and is the only reliable link between an account and a person.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ────────────────────────────────────────────────────────────
-- Step 1 — Drop existing objects (idempotent)
-- ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_auto_create_partner_accounts ON people;
DROP FUNCTION IF EXISTS auto_create_partner_accounts();

-- ────────────────────────────────────────────────────────────
-- Step 2 — Trigger function
-- ────────────────────────────────────────────────────────────
-- SECURITY DEFINER allows the function to INSERT into accounts
-- regardless of the calling user's RLS context.

CREATE OR REPLACE FUNCTION auto_create_partner_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_capital_parent_id   uuid;
  v_drawings_parent_id  uuid;
  v_next_capital_code   text;
  v_next_drawings_code  text;
  v_capital_count       integer;
  v_drawings_count      integer;
BEGIN
  -- Guard: accounts already exist for this person → skip
  IF EXISTS (
    SELECT 1 FROM accounts
    WHERE metadata->>'partner_id' = NEW.id::text
  ) THEN
    RETURN NEW;
  END IF;

  -- Fetch parent account IDs
  SELECT id INTO v_capital_parent_id
  FROM accounts WHERE code = '3100' LIMIT 1;

  SELECT id INTO v_drawings_parent_id
  FROM accounts WHERE code = '3200' LIMIT 1;

  -- Count existing postable partner accounts to derive next code
  SELECT COUNT(*) INTO v_capital_count
  FROM accounts
  WHERE code LIKE '31%' AND is_postable = true;

  SELECT COUNT(*) INTO v_drawings_count
  FROM accounts
  WHERE code LIKE '32%' AND is_postable = true;

  -- Codes increment by 10: first=3110, second=3120, third=3130 ...
  v_next_capital_code  := '31' || LPAD(((v_capital_count  + 1) * 10)::text, 2, '0');
  v_next_drawings_code := '32' || LPAD(((v_drawings_count + 1) * 10)::text, 2, '0');

  -- Insert capital account (level 3 = child of level-2 parent 3100)
  INSERT INTO accounts (
    code, name, account_class, normal_balance,
    level, is_postable, parent_id, metadata
  ) VALUES (
    v_next_capital_code,
    'رأس مال ' || NEW.name,
    'equity',
    'credit',
    3,
    true,
    v_capital_parent_id,
    jsonb_build_object('partner_id', NEW.id::text)
  );

  -- Insert drawings account (level 3 = child of level-2 parent 3200)
  INSERT INTO accounts (
    code, name, account_class, normal_balance,
    level, is_postable, parent_id, metadata
  ) VALUES (
    v_next_drawings_code,
    'مسحوبات ' || NEW.name,
    'equity',
    'debit',
    3,
    true,
    v_drawings_parent_id,
    jsonb_build_object('partner_id', NEW.id::text)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- Step 3 — Attach trigger to people table
-- ────────────────────────────────────────────────────────────

CREATE TRIGGER trg_auto_create_partner_accounts
  AFTER INSERT ON people
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_accounts();

-- ────────────────────────────────────────────────────────────
-- Step 4 — Backfill existing people who lack accounts
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_person           RECORD;
  v_capital_parent   uuid;
  v_drawings_parent  uuid;
  v_capital_code     text;
  v_drawings_code    text;
  v_cap_count        integer;
  v_draw_count       integer;
BEGIN
  SELECT id INTO v_capital_parent  FROM accounts WHERE code = '3100' LIMIT 1;
  SELECT id INTO v_drawings_parent FROM accounts WHERE code = '3200' LIMIT 1;

  FOR v_person IN
    SELECT id, name FROM people
    WHERE id NOT IN (
      SELECT (metadata->>'partner_id')::uuid
      FROM accounts
      WHERE metadata ? 'partner_id'
        AND metadata->>'partner_id' IS NOT NULL
    )
  LOOP
    SELECT COUNT(*) INTO v_cap_count
    FROM accounts WHERE code LIKE '31%' AND is_postable = true;

    SELECT COUNT(*) INTO v_draw_count
    FROM accounts WHERE code LIKE '32%' AND is_postable = true;

    v_capital_code  := '31' || LPAD(((v_cap_count  + 1) * 10)::text, 2, '0');
    v_drawings_code := '32' || LPAD(((v_draw_count + 1) * 10)::text, 2, '0');

    INSERT INTO accounts (
      code, name, account_class, normal_balance,
      level, is_postable, parent_id, metadata
    ) VALUES (
      v_capital_code,
      'رأس مال ' || v_person.name,
      'equity', 'credit', 3, true,
      v_capital_parent,
      jsonb_build_object('partner_id', v_person.id::text)
    );

    INSERT INTO accounts (
      code, name, account_class, normal_balance,
      level, is_postable, parent_id, metadata
    ) VALUES (
      v_drawings_code,
      'مسحوبات ' || v_person.name,
      'equity', 'debit', 3, true,
      v_drawings_parent,
      jsonb_build_object('partner_id', v_person.id::text)
    );

  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Step 5 — RLS confirmation
-- ────────────────────────────────────────────────────────────
-- The accounts table already has an open FOR ALL policy for
-- authenticated users (defined in 20260601000003_add_accounting_core):
--
--   CREATE POLICY "authenticated_full_access" ON accounts
--     FOR ALL TO authenticated
--     USING     (auth.uid() IS NOT NULL)
--     WITH CHECK (auth.uid() IS NOT NULL);
--
-- Trigger-created partner accounts are ordinary rows in the
-- accounts table and are therefore covered by this policy.
-- No additional RLS statement is required.

COMMIT;

-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually in Supabase SQL editor)
-- ════════════════════════════════════════════════════════════

-- Verification query 1: confirm trigger exists
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trg_auto_create_partner_accounts';

-- Verification query 2: confirm all people have accounts
-- SELECT p.id, p.name,
--   MAX(CASE WHEN a.code LIKE '31%' THEN a.code END) AS capital_account,
--   MAX(CASE WHEN a.code LIKE '32%' THEN a.code END) AS drawings_account
-- FROM people p
-- LEFT JOIN accounts a ON a.metadata->>'partner_id' = p.id::text
-- GROUP BY p.id, p.name
-- ORDER BY p.name;

-- Verification query 3: confirm no person is missing accounts
-- SELECT p.id, p.name
-- FROM people p
-- WHERE NOT EXISTS (
--   SELECT 1 FROM accounts a
--   WHERE a.metadata->>'partner_id' = p.id::text
-- );
