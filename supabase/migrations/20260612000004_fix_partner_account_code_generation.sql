-- ============================================================
-- Migration: fix_partner_account_code_generation
-- Description: Fixes auto_create_partner_accounts trigger to use
--   MAX(code)+1 instead of COUNT-based formula. The old formula
--   overflowed past 9 partners: LPAD((9+1)*10, 2, '0') = '100'
--   → code '31100', which violated a length constraint and was
--   truncated to '3110' (already exists). MAX+1 is monotonic
--   and handles any number of partners within the 31XX/32XX range.
-- ============================================================

-- NOTE: Run CREATE FUNCTION as a standalone statement in the
--   Supabase SQL editor (mandatory per project convention).

DROP TRIGGER  IF EXISTS trg_auto_create_partner_accounts ON people;
DROP FUNCTION IF EXISTS auto_create_partner_accounts();

CREATE OR REPLACE FUNCTION auto_create_partner_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_capital_parent_id   uuid;
  v_drawings_parent_id  uuid;
  v_next_capital_code   text;
  v_next_drawings_code  text;
  v_max_capital_code    integer;
  v_max_drawings_code   integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM accounts
    WHERE metadata->>'partner_id' = NEW.id::text
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_capital_parent_id  FROM accounts WHERE code = '3100' LIMIT 1;
  SELECT id INTO v_drawings_parent_id FROM accounts WHERE code = '3200' LIMIT 1;

  -- Use MAX code + 1 to avoid overflow past 9 partners with the old LPAD formula.
  -- Falls back to parent code (3100/3200) when no postable accounts exist yet,
  -- which produces the first codes 3101/3201 → still well within range.
  SELECT COALESCE(MAX(code::integer), 3100)
  INTO   v_max_capital_code
  FROM   accounts
  WHERE  code LIKE '31%' AND is_postable = true;

  SELECT COALESCE(MAX(code::integer), 3200)
  INTO   v_max_drawings_code
  FROM   accounts
  WHERE  code LIKE '32%' AND is_postable = true;

  v_next_capital_code  := (v_max_capital_code  + 1)::text;
  v_next_drawings_code := (v_max_drawings_code + 1)::text;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_create_partner_accounts
  AFTER INSERT ON people
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_accounts();

-- ════════════════════════════════════════════════════════════
-- VERIFICATION (run after applying)
-- ════════════════════════════════════════════════════════════
-- SELECT MAX(code) FROM accounts WHERE code LIKE '31%' AND is_postable = true;
-- → currently 3190; next INSERT will use 3191
