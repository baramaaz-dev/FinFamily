-- ============================================================
-- Migration: fix_reversed_arabic_account_names
-- Description: Corrects account names stored in reversed
--   character order due to Arabic text typed in an LTR SQL
--   editor during seed migrations. No Arabic string literals
--   used — corrections are REVERSE(name) or Unicode escapes.
-- Idempotent: guarded by ascii() check on account 1110.
--   Guard fires when 1110 already starts with U+0627 ('ا').
-- ============================================================

BEGIN;

DO $$
BEGIN

  -- ── Idempotency guard ──────────────────────────────────────
  -- On a correctly-seeded DB, 1110 starts with U+0627 ('ا') = 1575.
  -- On a DB seeded via the Supabase SQL editor, 1110 was stored
  -- reversed and starts with 'D' (ascii 68).
  -- Skip if the fix has already been applied.
  IF (SELECT ascii(LEFT(name, 1)) FROM accounts WHERE code = '1110') = 1575 THEN
    RAISE NOTICE 'fix_reversed_arabic_account_names: already applied, skipping.';
    RETURN;
  END IF;

  -- ── PART A: REVERSE all seed account names ─────────────────
  -- Names were entered via LTR SQL editor → stored character-reversed.
  -- REVERSE(reversed_name) restores the correct logical order.
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1110';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1120';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1130';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1140';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1210';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1220';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '1230';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2110';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2120';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2130';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '2210';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '3000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '3100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '3200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '3300';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '4000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '4100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '4200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '4300';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '4400';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '5000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '5100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '5200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '5300';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '6000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '6100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7110';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7120';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7130';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7140';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7300';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7400';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '7500';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '8000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '8100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '8200';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '9000';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '9100';
  UPDATE accounts SET name = REVERSE(name) WHERE code = '9200';

  -- ── PART B: Fix partner capital accounts (31XX / 32XX) ─────
  -- people.name is correct (entered via Arabic React UI).
  -- Unicode escapes for prefixes avoid SQL editor reversal:
  --   U&'\0631\0623\0633\0020\0645\0627\0644\0020' = 'رأس مال '
  --   U&'\0645\0633\062D\0648\0628\0627\062A\0020' = 'مسحوبات '

  UPDATE accounts a
  SET    name = U&'\0631\0623\0633\0020\0645\0627\0644\0020' || p.name
  FROM   people p
  WHERE  a.metadata->>'partner_id' = p.id::text
    AND  a.code LIKE '31%'
    AND  a.is_postable = true;

  UPDATE accounts a
  SET    name = U&'\0645\0633\062D\0648\0628\0627\062A\0020' || p.name
  FROM   people p
  WHERE  a.metadata->>'partner_id' = p.id::text
    AND  a.code LIKE '32%'
    AND  a.is_postable = true;

END $$;

-- ── PART C: Rewrite trigger with Unicode-escaped prefixes ─────
-- Prevents reversed names on all future people inserts.

DROP TRIGGER  IF EXISTS trg_auto_create_partner_accounts ON people;
DROP FUNCTION IF EXISTS auto_create_partner_accounts();

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
  IF EXISTS (
    SELECT 1 FROM accounts
    WHERE metadata->>'partner_id' = NEW.id::text
  ) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_capital_parent_id  FROM accounts WHERE code = '3100' LIMIT 1;
  SELECT id INTO v_drawings_parent_id FROM accounts WHERE code = '3200' LIMIT 1;

  SELECT COUNT(*) INTO v_capital_count
  FROM accounts WHERE code LIKE '31%' AND is_postable = true;

  SELECT COUNT(*) INTO v_drawings_count
  FROM accounts WHERE code LIKE '32%' AND is_postable = true;

  v_next_capital_code  := '31' || LPAD(((v_capital_count  + 1) * 10)::text, 2, '0');
  v_next_drawings_code := '32' || LPAD(((v_drawings_count + 1) * 10)::text, 2, '0');

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

COMMIT;
