-- ============================================================
-- Migration: add_partner_loan_accounts
-- Description: S-10002 — Adds قروض الشركاء (2300) as a level-2
--   parent account under الخصوم (2000), replaces
--   auto_create_partner_accounts() to also emit a 23XX loan
--   account for each new partner, and backfills 23XX for all
--   existing partners.
--   Pure database story: no frontend changes.
-- Depends on: 20260612000004_fix_partner_account_code_generation
-- ============================================================

-- NOTE on POL-003: All Arabic string literals in migrations MUST
-- use Unicode escape syntax: U&'\XXXX' where XXXX is the Unicode
-- code point. Inline Arabic characters are forbidden in .sql files.
-- Code-point reference used in this file:
--   قروض الشركاء → U&'\0642\0631\0648\0636\0020\0627\0644\0634\0631\0643\0627\0621'
--   قرض (+ space)  → U&'\0642\0631\0636\0020'
--   رأس مال (+ sp) → U&'\0631\0623\0633\0020\0645\0627\0644\0020'
--   مسحوبات (+ sp) → U&'\0645\0633\062D\0648\0628\0627\062A\0020'

-- =========================================================================
-- A. Parent account 2300 قروض الشركاء
--    Level 2 · child of 2000 الخصوم · non-postable header
-- =========================================================================

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT
  p.id,
  '2300',
  U&'\0642\0631\0648\0636\0020\0627\0644\0634\0631\0643\0627\0621',
  'liability',
  'credit',
  2,
  false
FROM accounts p
WHERE p.code = '2000'
ON CONFLICT (code) DO NOTHING;

-- =========================================================================
-- B. Replace auto_create_partner_accounts() — add 23XX loan account
--    Uses MAX(code)+1 formula (same as 31XX/32XX) to avoid overflow.
--    SECURITY DEFINER retained from prior version.
-- =========================================================================

DROP TRIGGER  IF EXISTS trg_auto_create_partner_accounts ON people;
DROP FUNCTION IF EXISTS auto_create_partner_accounts();

CREATE OR REPLACE FUNCTION auto_create_partner_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_capital_parent_id   uuid;
  v_drawings_parent_id  uuid;
  v_loan_parent_id      uuid;
  v_next_capital_code   text;
  v_next_drawings_code  text;
  v_next_loan_code      text;
  v_max_capital_code    integer;
  v_max_drawings_code   integer;
  v_max_loan_code       integer;
BEGIN
  -- Guard: accounts already exist for this person → skip
  IF EXISTS (
    SELECT 1 FROM accounts
    WHERE metadata->>'partner_id' = NEW.id::text
  ) THEN
    RETURN NEW;
  END IF;

  -- Fetch parent account IDs
  SELECT id INTO v_capital_parent_id  FROM accounts WHERE code = '3100' LIMIT 1;
  SELECT id INTO v_drawings_parent_id FROM accounts WHERE code = '3200' LIMIT 1;
  SELECT id INTO v_loan_parent_id     FROM accounts WHERE code = '2300' LIMIT 1;

  -- MAX+1 code generation — monotonic, handles any partner count
  SELECT COALESCE(MAX(code::integer), 3100)
  INTO   v_max_capital_code
  FROM   accounts
  WHERE  code LIKE '31%' AND is_postable = true;

  SELECT COALESCE(MAX(code::integer), 3200)
  INTO   v_max_drawings_code
  FROM   accounts
  WHERE  code LIKE '32%' AND is_postable = true;

  SELECT COALESCE(MAX(code::integer), 2300)
  INTO   v_max_loan_code
  FROM   accounts
  WHERE  code LIKE '23%' AND is_postable = true;

  v_next_capital_code  := (v_max_capital_code  + 1)::text;
  v_next_drawings_code := (v_max_drawings_code + 1)::text;
  v_next_loan_code     := (v_max_loan_code     + 1)::text;

  -- U&'\0631\0623\0633\0020\0645\0627\0644\0020' = 'رأس مال '
  INSERT INTO accounts (
    code, name, account_class, normal_balance,
    level, is_postable, parent_id, metadata
  ) VALUES (
    v_next_capital_code,
    U&'\0631\0623\0633\0020\0645\0627\0644\0020' || NEW.name,
    'equity', 'credit', 3, true,
    v_capital_parent_id,
    jsonb_build_object('partner_id', NEW.id::text)
  );

  -- U&'\0645\0633\062D\0648\0628\0627\062A\0020' = 'مسحوبات '
  INSERT INTO accounts (
    code, name, account_class, normal_balance,
    level, is_postable, parent_id, metadata
  ) VALUES (
    v_next_drawings_code,
    U&'\0645\0633\062D\0648\0628\0627\062A\0020' || NEW.name,
    'equity', 'debit', 3, true,
    v_drawings_parent_id,
    jsonb_build_object('partner_id', NEW.id::text)
  );

  -- U&'\0642\0631\0636\0020' = 'قرض '
  INSERT INTO accounts (
    code, name, account_class, normal_balance,
    level, is_postable, parent_id, metadata
  ) VALUES (
    v_next_loan_code,
    U&'\0642\0631\0636\0020' || NEW.name,
    'liability', 'credit', 3, true,
    v_loan_parent_id,
    jsonb_build_object('partner_id', NEW.id::text)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_create_partner_accounts
  AFTER INSERT ON people
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_accounts();

-- =========================================================================
-- C. Backfill 23XX accounts for existing partners
--    Iterates one partner at a time so each iteration sees the updated
--    MAX(code) and avoids duplicate-code collisions.
-- =========================================================================

DO $$
DECLARE
  rec              RECORD;
  v_loan_parent_id uuid;
  v_max_loan_code  integer;
  v_next_loan_code text;
BEGIN
  SELECT id INTO v_loan_parent_id FROM accounts WHERE code = '2300' LIMIT 1;

  FOR rec IN
    SELECT p.id, p.name
    FROM people p
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.metadata->>'partner_id' = p.id::text
        AND a.code LIKE '23%'
    )
    ORDER BY p.created_at
  LOOP
    SELECT COALESCE(MAX(code::integer), 2300)
    INTO   v_max_loan_code
    FROM   accounts
    WHERE  code LIKE '23%' AND is_postable = true;

    v_next_loan_code := (v_max_loan_code + 1)::text;

    -- U&'\0642\0631\0636\0020' = 'قرض '
    INSERT INTO accounts (
      code, name, account_class, normal_balance,
      level, is_postable, parent_id, metadata
    ) VALUES (
      v_next_loan_code,
      U&'\0642\0631\0636\0020' || rec.name,
      'liability',
      'credit',
      3,
      true,
      v_loan_parent_id,
      jsonb_build_object('partner_id', rec.id::text)
    );
  END LOOP;
END $$;

-- =========================================================================
-- D. delete_partner_accounts scope — no change required
--    The existing RPC deletes: WHERE metadata->>'partner_id' = p_person_id::text
--    This already covers 23XX accounts. No code-range filter to update.
-- =========================================================================

-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually in Supabase SQL editor)
-- ════════════════════════════════════════════════════════════

-- V1: Confirm 2300 parent account
-- SELECT code, name, account_class, is_postable
-- FROM accounts WHERE code = '2300';

-- V2: Confirm 23XX backfill — one row per partner
-- SELECT p.name, a.code, a.name AS account_name, a.account_class
-- FROM people p
-- JOIN accounts a ON a.metadata->>'partner_id' = p.id::text
--   AND a.code LIKE '23%'
-- ORDER BY a.code;

-- V3: Confirm trigger creates all 3 accounts for a new partner
-- (Add test person via UI, then:)
-- SELECT code, name FROM accounts
-- WHERE metadata->>'partner_id' = (
--   SELECT id FROM people WHERE name = 'Test Partner'
-- )
-- ORDER BY code;
-- → Must return 3 rows: 31XX + 32XX + 23XX
