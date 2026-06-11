-- ============================================================
-- Migration: post_journal_entry_rpc
-- Description: Adds missing IFRS 18 expense accounts (7XXX)
--   and creates the post_journal_entry(source_type, source_id)
--   RPC function. Executes all 10 posting steps atomically for
--   source_types: transaction, lease_payment, property_expense,
--   capital_transaction. (S-085)
-- Depends on: 20260611120000_auto_partner_accounts_trigger
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- Step 0 — Ensure IFRS 18 operating-expense accounts exist
--   STR-006 §2.2 — 7XXX group (operating expenses)
--   The seed (M-04) pre-dates the IFRS 18 update and seeded
--   5XXX codes instead. These accounts are referenced by the
--   post_journal_entry function and must exist before it runs.
-- ────────────────────────────────────────────────────────────

-- Level 1: 7000 root
INSERT INTO accounts (code, name, account_class, normal_balance, level, is_postable)
VALUES ('7000', 'مصروفات التشغيل', 'expense', 'debit', 1, false)
ON CONFLICT (code) DO NOTHING;

-- Level 2a: 7100 property group (non-postable)
INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7100', 'مصروفات العقارات', 'expense', 'debit', 2, false
FROM accounts p WHERE p.code = '7000'
ON CONFLICT (code) DO NOTHING;

-- Level 2b: 7300 portfolio expenses (postable)
INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7300', 'مصروفات المحافظ', 'expense', 'debit', 2, true
FROM accounts p WHERE p.code = '7000'
ON CONFLICT (code) DO NOTHING;

-- Level 3: detailed property expense accounts (one INSERT per row — avoids RTL/VALUES parser issue)
INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7110', 'مصروفات الصيانة', 'expense', 'debit', 3, true
FROM accounts p WHERE p.code = '7100'
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7120', 'مصروفات المرافق', 'expense', 'debit', 3, true
FROM accounts p WHERE p.code = '7100'
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7130', 'الضرائب والرسوم العقارية', 'expense', 'debit', 3, true
FROM accounts p WHERE p.code = '7100'
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (parent_id, code, name, account_class, normal_balance, level, is_postable)
SELECT p.id, '7140', 'مصروفات عقارية أخرى', 'expense', 'debit', 3, true
FROM accounts p WHERE p.code = '7100'
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- Step 1 — RPC function: post_journal_entry
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION post_journal_entry(
  p_source_type  text,
  p_source_id    uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journal_entry_id           uuid;
  v_period_id                  uuid;
  v_entry_date                 date;
  v_amount                     numeric(18,4);
  v_currency                   text;
  v_exchange_rate              numeric(18,4);
  v_debit_account_id           uuid;
  v_credit_account_id          uuid;
  v_description                text;
  v_reference_no               text;
  v_total_debit                numeric(18,4);
  v_total_credit               numeric(18,4);
  -- transaction sub-type
  v_transaction_type           text;
  -- property_expense fields
  v_expense_type               text;
  v_portfolio_id               uuid;
  -- capital_transaction fields
  v_capital_type               text;
  v_partner_id                 uuid;
  v_entity_type                text;
  v_partner_capital_account_id uuid;
  v_capital_ledger_id          uuid;
  v_drawings_ledger_id         uuid;
BEGIN

  -- ── STEP 1: Prevent double-posting ─────────────────────────
  -- STR-006 §10.2 — reject if a non-reversed entry already exists
  IF EXISTS (
    SELECT 1 FROM journal_entries
    WHERE source_type = p_source_type
      AND source_id   = p_source_id
      AND status     != 'reversed'
  ) THEN
    RAISE EXCEPTION 'ALREADY_POSTED' USING ERRCODE = 'P0001';
  END IF;

  -- ── STEP 2: Fetch source record ─────────────────────────────
  IF p_source_type = 'transaction' THEN

    SELECT t.date, t.amount, t.currency, t.exchange_rate, t.notes, t.type
    INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
           v_description, v_transaction_type
    FROM   transactions t
    WHERE  t.id = p_source_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    IF v_transaction_type = 'transfer' THEN
      v_description := 'تحويل: ' || COALESCE(v_description, '');
    ELSE
      v_description := COALESCE(v_description, 'معاملة محفظة');
    END IF;

  ELSIF p_source_type = 'lease_payment' THEN

    SELECT lp.paid_date, lp.amount, lp.currency, lp.exchange_rate, lp.notes
    INTO   v_entry_date, v_amount, v_currency, v_exchange_rate, v_description
    FROM   lease_payments lp
    WHERE  lp.id = p_source_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    v_description := COALESCE(v_description, 'دفعة إيجار');

  ELSIF p_source_type = 'property_expense' THEN

    SELECT COALESCE(pe.paid_date, pe.due_date),
           pe.amount, pe.currency, pe.exchange_rate,
           pe.notes, pe.type, pe.portfolio_id
    INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
           v_description, v_expense_type, v_portfolio_id
    FROM   property_expenses pe
    WHERE  pe.id = p_source_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    v_description := COALESCE(v_description, 'مصروف عقار');

  ELSIF p_source_type = 'capital_transaction' THEN

    SELECT ct.date, ct.amount, ct.currency, ct.exchange_rate,
           ct.notes, ct.type, ct.capital_account_id
    INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
           v_description, v_capital_type, v_partner_capital_account_id
    FROM   capital_transactions ct
    WHERE  ct.id = p_source_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    v_description := COALESCE(v_description, 'حركة رأس مال');

  ELSE
    RAISE EXCEPTION 'UNKNOWN_SOURCE_TYPE: %', p_source_type USING ERRCODE = 'P0001';
  END IF;

  -- ── STEP 3: Find open accounting period ─────────────────────
  -- STR-006 §3.2 — reject if no open period covers entry_date
  SELECT id INTO v_period_id
  FROM   accounting_periods
  WHERE  start_date <= v_entry_date
    AND  end_date   >= v_entry_date
    AND  status = 'open'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_OPEN_PERIOD' USING ERRCODE = 'P0002';
  END IF;

  -- ── STEP 4: Resolve account IDs ─────────────────────────────
  -- STR-006 §5 — apply journal entry template for each source_type

  IF p_source_type = 'transaction' THEN

    IF v_transaction_type = 'income' THEN
      -- DEBIT cash (by currency), CREDIT 4300
      IF v_currency = 'USD' THEN
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
      ELSE
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
      END IF;
      SELECT id INTO v_credit_account_id FROM accounts WHERE code = '4300' LIMIT 1;

    ELSIF v_transaction_type = 'expense' THEN
      -- DEBIT 7300, CREDIT cash (by currency)
      SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7300' LIMIT 1;
      IF v_currency = 'USD' THEN
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
      ELSE
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
      END IF;

    ELSIF v_transaction_type = 'transfer' THEN
      -- MVP: same cash account on both sides (STR-006 §5.1)
      IF v_currency = 'USD' THEN
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
      ELSE
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
      END IF;

    ELSE
      RAISE EXCEPTION 'UNKNOWN_TRANSACTION_TYPE: %', v_transaction_type
        USING ERRCODE = 'P0001';
    END IF;

  ELSIF p_source_type = 'lease_payment' THEN
    -- DEBIT cash (by currency), CREDIT 4100
    IF v_currency = 'USD' THEN
      SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
    ELSE
      SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
    END IF;
    SELECT id INTO v_credit_account_id FROM accounts WHERE code = '4100' LIMIT 1;

  ELSIF p_source_type = 'property_expense' THEN
    -- DEBIT: expense account determined by property_expenses.type
    CASE v_expense_type
      WHEN 'maintenance' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7110' LIMIT 1;
      WHEN 'utilities' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7120' LIMIT 1;
      WHEN 'tax' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7130' LIMIT 1;
      WHEN 'fees' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7140' LIMIT 1;
      ELSE
        RAISE EXCEPTION 'UNKNOWN_EXPENSE_TYPE: %', v_expense_type
          USING ERRCODE = 'P0001';
    END CASE;

    -- CREDIT: cash if portfolio-linked, else 2120 (accrued expenses)
    IF v_portfolio_id IS NOT NULL THEN
      IF v_currency = 'USD' THEN
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
      ELSE
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
      END IF;
    ELSE
      SELECT id INTO v_credit_account_id FROM accounts WHERE code = '2120' LIMIT 1;
    END IF;

  ELSIF p_source_type = 'capital_transaction' THEN
    -- Fetch partner_id and entity_type from partner_capital_accounts
    SELECT pca.partner_id, pca.entity_type
    INTO   v_partner_id, v_entity_type
    FROM   partner_capital_accounts pca
    WHERE  pca.id = v_partner_capital_account_id;

    -- Locate this partner's capital ledger account (31XX)
    SELECT a.id INTO v_capital_ledger_id
    FROM   accounts a
    WHERE  a.metadata->>'partner_id' = v_partner_id::text
      AND  a.code LIKE '31%'
    LIMIT 1;

    -- Locate this partner's drawings ledger account (32XX)
    SELECT a.id INTO v_drawings_ledger_id
    FROM   accounts a
    WHERE  a.metadata->>'partner_id' = v_partner_id::text
      AND  a.code LIKE '32%'
    LIMIT 1;

    CASE v_capital_type

      WHEN 'capital_injection' THEN
        -- DEBIT cash, CREDIT 31XX
        IF v_currency = 'USD' THEN
          SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;
        v_credit_account_id := v_capital_ledger_id;

      WHEN 'capital_reduction' THEN
        -- DEBIT 31XX, CREDIT cash
        v_debit_account_id := v_capital_ledger_id;
        IF v_currency = 'USD' THEN
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;

      WHEN 'drawing' THEN
        -- DEBIT 32XX, CREDIT cash
        v_debit_account_id := v_drawings_ledger_id;
        IF v_currency = 'USD' THEN
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;

      WHEN 'profit_share' THEN
        -- DEBIT revenue account (by entity_type), CREDIT 31XX
        IF v_entity_type = 'property' THEN
          SELECT id INTO v_debit_account_id FROM accounts WHERE code = '4100' LIMIT 1;
        ELSE
          SELECT id INTO v_debit_account_id FROM accounts WHERE code = '4300' LIMIT 1;
        END IF;
        v_credit_account_id := v_capital_ledger_id;

      WHEN 'loss_share' THEN
        -- DEBIT 31XX, CREDIT expense account (by entity_type)
        v_debit_account_id := v_capital_ledger_id;
        IF v_entity_type = 'property' THEN
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '7100' LIMIT 1;
        ELSE
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '7300' LIMIT 1;
        END IF;

      ELSE
        RAISE EXCEPTION 'UNKNOWN_CAPITAL_TYPE: %', v_capital_type
          USING ERRCODE = 'P0004';
    END CASE;

  END IF;

  -- Guard: both account IDs must be resolved before inserting lines
  IF v_debit_account_id IS NULL OR v_credit_account_id IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_FOUND for source_type=% source_id=%',
      p_source_type, p_source_id
      USING ERRCODE = 'P0005';
  END IF;

  -- ── STEP 5: Generate reference_no ───────────────────────────
  v_reference_no := 'JE-' || UPPER(LEFT(p_source_type, 4))
                  || '-' || LEFT(p_source_id::text, 8);

  -- ── STEP 6: Insert journal_entry header (status = 'draft') ──
  INSERT INTO journal_entries (
    entry_date,    period_id,    reference_no,
    description,   status,       source_type,   source_id
  ) VALUES (
    v_entry_date,  v_period_id,  v_reference_no,
    v_description, 'draft',      p_source_type, p_source_id
  )
  RETURNING id INTO v_journal_entry_id;

  -- ── STEP 7: Insert debit line then credit line ───────────────
  -- exchange_rate is NULL for USD (STR-006 §6.1) — passed as-is.
  INSERT INTO journal_entry_lines
    (journal_entry_id,    account_id,           debit_amount, credit_amount,
     currency,            exchange_rate)
  VALUES
    (v_journal_entry_id,  v_debit_account_id,   v_amount,     0,
     v_currency,          v_exchange_rate),
    (v_journal_entry_id,  v_credit_account_id,  0,            v_amount,
     v_currency,          v_exchange_rate);

  -- ── STEP 8: Verify balance ───────────────────────────────────
  SELECT COALESCE(SUM(debit_amount), 0),
         COALESCE(SUM(credit_amount), 0)
  INTO   v_total_debit, v_total_credit
  FROM   journal_entry_lines
  WHERE  journal_entry_id = v_journal_entry_id;

  IF v_total_debit != v_total_credit THEN
    RAISE EXCEPTION 'ENTRY_NOT_BALANCED (debit=% credit=%)',
      v_total_debit, v_total_credit
      USING ERRCODE = 'P0003';
  END IF;

  -- ── STEP 9: Mark as posted ───────────────────────────────────
  UPDATE journal_entries
  SET    status = 'posted'
  WHERE  id = v_journal_entry_id;

  -- ── STEP 10: Update source table foreign key ─────────────────
  IF p_source_type = 'transaction' THEN
    UPDATE transactions
    SET    journal_entry_id = v_journal_entry_id
    WHERE  id = p_source_id;

  ELSIF p_source_type = 'lease_payment' THEN
    UPDATE lease_payments
    SET    journal_entry_id = v_journal_entry_id
    WHERE  id = p_source_id;

  ELSIF p_source_type = 'property_expense' THEN
    UPDATE property_expenses
    SET    journal_entry_id = v_journal_entry_id
    WHERE  id = p_source_id;

  ELSIF p_source_type = 'capital_transaction' THEN
    UPDATE capital_transactions
    SET    journal_entry_id = v_journal_entry_id
    WHERE  id = p_source_id;
  END IF;

  RETURN v_journal_entry_id;

END;
$$;

-- ────────────────────────────────────────────────────────────
-- Step 2 — Grant execute to authenticated role
-- ────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION post_journal_entry(text, uuid) TO authenticated;

COMMIT;

-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually in Supabase SQL editor)
-- ════════════════════════════════════════════════════════════

-- Test 1: Post a transaction (replace with a real ID from your DB)
-- SELECT post_journal_entry('transaction', '<transaction_uuid>');

-- Test 2: Verify journal_entries row created with status='posted'
-- SELECT id, entry_date, reference_no, status, source_type
-- FROM journal_entries
-- WHERE source_type = 'transaction'
-- ORDER BY created_at DESC LIMIT 5;

-- Test 3: Verify journal_entry_lines balance (should return 0 rows)
-- SELECT je.reference_no,
--        SUM(jel.debit_amount)  AS total_debit,
--        SUM(jel.credit_amount) AS total_credit
-- FROM journal_entry_lines jel
-- JOIN journal_entries je ON je.id = jel.journal_entry_id
-- GROUP BY je.id, je.reference_no
-- HAVING SUM(jel.debit_amount) != SUM(jel.credit_amount);

-- Test 4: Verify source FK updated
-- SELECT id, journal_entry_id FROM transactions
-- WHERE journal_entry_id IS NOT NULL LIMIT 5;

-- Test 5: Verify ALREADY_POSTED guard
-- SELECT post_journal_entry('transaction', '<same_uuid_as_test_1>');
-- (Should raise: ALREADY_POSTED)
