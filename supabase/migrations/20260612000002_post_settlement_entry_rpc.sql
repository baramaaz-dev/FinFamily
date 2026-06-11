-- ============================================================
-- Migration: post_settlement_entry_rpc
-- Description: Adds journal_entry_id to profit_settlements,
--   extends journal_entries.source_type CHECK to include
--   'profit_settlement', and creates the post_settlement_entry
--   RPC function. Posts a confirmed profit settlement as a
--   single compound journal entry (N+1 lines). (S-086)
-- Depends on: 20260612000000_post_journal_entry_rpc
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- Task 1a — Add journal_entry_id to profit_settlements
-- ────────────────────────────────────────────────────────────

ALTER TABLE profit_settlements
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid
  REFERENCES journal_entries(id);

-- ────────────────────────────────────────────────────────────
-- Task 1b — Extend source_type CHECK to include profit_settlement
--   The original CHECK in 20260601000003 did not include it.
--   Dynamic constraint-name discovery handles any auto-naming.
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
    'profit_settlement'
  ));

-- ────────────────────────────────────────────────────────────
-- Task 2 — RPC function: post_settlement_entry
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION post_settlement_entry(
  p_settlement_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journal_entry_id    uuid;
  v_period_id           uuid;
  v_entity_type         text;
  v_entity_id           uuid;
  v_total_profit        numeric(18,4);
  v_currency            text;
  v_exchange_rate       numeric;
  v_settlement_date     date;
  v_settlement_status   text;
  v_revenue_account_id  uuid;
  v_revenue_code        text;
  v_reference_no        text;
  v_sum_shares          numeric(18,4);
  v_total_debit         numeric(18,4);
  v_total_credit        numeric(18,4);
  v_share               RECORD;
  v_partner_account_id  uuid;
BEGIN

  -- ── STEP 1: Fetch settlement record ─────────────────────────
  SELECT entity_type, entity_id, total_profit, currency,
         settlement_date, status
  INTO   v_entity_type, v_entity_id, v_total_profit, v_currency,
         v_settlement_date, v_settlement_status
  FROM   profit_settlements
  WHERE  id = p_settlement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SETTLEMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- ── STEP 2: Validate status = 'confirmed' ───────────────────
  IF v_settlement_status != 'confirmed' THEN
    RAISE EXCEPTION 'SETTLEMENT_NOT_CONFIRMED' USING ERRCODE = 'P0002';
  END IF;

  -- ── STEP 3: Prevent double posting ──────────────────────────
  IF EXISTS (
    SELECT 1 FROM profit_settlements
    WHERE id = p_settlement_id
      AND journal_entry_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'ALREADY_POSTED' USING ERRCODE = 'P0003';
  END IF;

  -- ── STEP 4: Validate shares sum = total_profit ──────────────
  SELECT COALESCE(SUM(amount), 0)
  INTO   v_sum_shares
  FROM   settlement_shares
  WHERE  settlement_id = p_settlement_id;

  IF ROUND(v_sum_shares, 2) != ROUND(v_total_profit, 2) THEN
    RAISE EXCEPTION 'SHARES_DO_NOT_BALANCE (shares=% total=%)',
      v_sum_shares, v_total_profit USING ERRCODE = 'P0004';
  END IF;

  -- ── STEP 5: Find open accounting period ─────────────────────
  SELECT id INTO v_period_id
  FROM   accounting_periods
  WHERE  start_date <= v_settlement_date
    AND  end_date   >= v_settlement_date
    AND  status = 'open'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_OPEN_PERIOD' USING ERRCODE = 'P0005';
  END IF;

  -- ── STEP 6: Resolve revenue account by entity_type ──────────
  -- STR-006 §8.4: property → 4100, portfolio/project → 4300
  IF v_entity_type = 'property' THEN
    v_revenue_code := '4100';
  ELSE
    v_revenue_code := '4300';
  END IF;

  SELECT id INTO v_revenue_account_id
  FROM   accounts
  WHERE  code = v_revenue_code
  LIMIT  1;

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'REVENUE_ACCOUNT_NOT_FOUND for code %',
      v_revenue_code USING ERRCODE = 'P0006';
  END IF;

  -- ── STEP 7: Generate reference_no ───────────────────────────
  v_reference_no := 'JE-SETL-' || LEFT(p_settlement_id::text, 8);

  -- ── STEP 8: Insert journal_entry header (draft) ─────────────
  -- Description: U&'\062A\0633\0648\064A\0629\0020\0623\0631\0628\0627\062D'
  --   = 'تسوية أرباح'
  INSERT INTO journal_entries (
    entry_date,         period_id,    reference_no,
    description,        status,       source_type,
    source_id
  ) VALUES (
    v_settlement_date,
    v_period_id,
    v_reference_no,
    U&'\062A\0633\0648\064A\0629\0020\0623\0631\0628\0627\062D',
    'draft',
    'profit_settlement',
    p_settlement_id
  )
  RETURNING id INTO v_journal_entry_id;

  -- ── STEP 9: Insert debit line (revenue account, full profit) ─
  INSERT INTO journal_entry_lines (
    journal_entry_id,   account_id,
    debit_amount,       credit_amount,
    currency,           exchange_rate
  ) VALUES (
    v_journal_entry_id,
    v_revenue_account_id,
    v_total_profit,
    0,
    v_currency,
    NULL
  );

  -- ── STEP 10: Insert one credit line per partner ──────────────
  -- STR-006 §8.4: N credit lines, one per settlement_share row
  FOR v_share IN
    SELECT ss.partner_id, ss.amount
    FROM   settlement_shares ss
    WHERE  ss.settlement_id = p_settlement_id
    ORDER  BY ss.partner_id
  LOOP
    SELECT a.id INTO v_partner_account_id
    FROM   accounts a
    WHERE  a.metadata->>'partner_id' = v_share.partner_id::text
      AND  a.code LIKE '31%'
      AND  a.is_postable = true
    LIMIT 1;

    IF v_partner_account_id IS NULL THEN
      RAISE EXCEPTION 'PARTNER_ACCOUNT_NOT_FOUND for partner %',
        v_share.partner_id USING ERRCODE = 'P0006';
    END IF;

    INSERT INTO journal_entry_lines (
      journal_entry_id,   account_id,
      debit_amount,       credit_amount,
      currency,           exchange_rate
    ) VALUES (
      v_journal_entry_id,
      v_partner_account_id,
      0,
      v_share.amount,
      v_currency,
      NULL
    );
  END LOOP;

  -- ── STEP 11: Verify balance ──────────────────────────────────
  SELECT COALESCE(SUM(debit_amount), 0),
         COALESCE(SUM(credit_amount), 0)
  INTO   v_total_debit, v_total_credit
  FROM   journal_entry_lines
  WHERE  journal_entry_id = v_journal_entry_id;

  IF ROUND(v_total_debit, 2) != ROUND(v_total_credit, 2) THEN
    RAISE EXCEPTION 'SETTLEMENT_ENTRY_NOT_BALANCED (debit=% credit=%)',
      v_total_debit, v_total_credit USING ERRCODE = 'P0007';
  END IF;

  -- ── STEP 12: Mark as posted ──────────────────────────────────
  UPDATE journal_entries
  SET    status = 'posted'
  WHERE  id = v_journal_entry_id;

  -- ── STEP 13: Update profit_settlements FK ────────────────────
  UPDATE profit_settlements
  SET    journal_entry_id = v_journal_entry_id
  WHERE  id = p_settlement_id;

  RETURN v_journal_entry_id;

END;
$$;

-- ────────────────────────────────────────────────────────────
-- Task 3 — Grant
-- ────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION post_settlement_entry(uuid) TO authenticated;

COMMIT;

-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually in Supabase SQL editor)
-- ════════════════════════════════════════════════════════════

-- Step A: confirm journal_entry_id column exists
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'profit_settlements'
--   AND column_name = 'journal_entry_id';

-- Step B: find a confirmed settlement to test with
-- SELECT id, entity_type, total_profit, currency, status
-- FROM profit_settlements
-- WHERE status = 'confirmed'
-- LIMIT 5;

-- Step C: call the function (replace with real ID from Step B)
-- SELECT post_settlement_entry('<settlement_uuid>');

-- Step D: verify entry structure — 1 debit + N credit lines
-- SELECT a.code, a.name, jel.debit_amount, jel.credit_amount
-- FROM journal_entry_lines jel
-- JOIN journal_entries je ON je.id = jel.journal_entry_id
-- JOIN accounts a ON a.id = jel.account_id
-- WHERE je.source_type = 'profit_settlement'
-- ORDER BY jel.debit_amount DESC;

-- Step E: verify balance (must return 0 rows)
-- SELECT je.reference_no,
--        SUM(jel.debit_amount)  AS total_debit,
--        SUM(jel.credit_amount) AS total_credit
-- FROM journal_entry_lines jel
-- JOIN journal_entries je ON je.id = jel.journal_entry_id
-- WHERE je.source_type = 'profit_settlement'
-- GROUP BY je.id, je.reference_no
-- HAVING SUM(jel.debit_amount) != SUM(jel.credit_amount);

-- Step F: verify ALREADY_POSTED guard
-- SELECT post_settlement_entry('<same_settlement_uuid>');
-- (must raise: ALREADY_POSTED)

-- Step G: verify profit_settlements FK updated
-- SELECT id, journal_entry_id
-- FROM profit_settlements
-- WHERE journal_entry_id IS NOT NULL;
