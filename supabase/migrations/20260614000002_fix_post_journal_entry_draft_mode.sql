CREATE OR REPLACE FUNCTION public.post_journal_entry(p_source_type text, p_source_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    v_transaction_type           text;
    v_expense_type               text;
    v_portfolio_id               uuid;
    v_capital_type               text;
    v_partner_id                 uuid;
    v_entity_type                text;
    v_partner_capital_account_id uuid;
    v_capital_ledger_id          uuid;
    v_drawings_ledger_id         uuid;
  BEGIN

    IF EXISTS (
      SELECT 1 FROM journal_entries
      WHERE source_type = p_source_type
        AND source_id   = p_source_id
        AND status     != 'reversed'
    ) THEN
      RAISE EXCEPTION 'ALREADY_POSTED' USING ERRCODE = 'P0001';
    END IF;

    IF p_source_type = 'transaction' THEN
      SELECT t.date, t.amount, t.currency, t.exchange_rate, t.notes, t.type
      INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
             v_description, v_transaction_type
      FROM   transactions t WHERE t.id = p_source_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
      END IF;
      IF v_transaction_type = 'transfer' THEN
        v_description := 'ليوحت: ' || COALESCE(v_description, '');
      ELSE
        v_description := COALESCE(v_description, 'ةظفحم ةلماعم');
      END IF;

    ELSIF p_source_type = 'lease_payment' THEN
      SELECT lp.paid_date, lp.amount, lp.currency, lp.exchange_rate, lp.notes
      INTO   v_entry_date, v_amount, v_currency, v_exchange_rate, v_description
      FROM   lease_payments lp WHERE lp.id = p_source_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
      END IF;
      v_description := COALESCE(v_description, 'راجيإ ةعفد');

    ELSIF p_source_type = 'property_expense' THEN
      SELECT COALESCE(pe.paid_date, pe.due_date),
             pe.amount, pe.currency, pe.exchange_rate,
             pe.notes, pe.type, pe.portfolio_id
      INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
             v_description, v_expense_type, v_portfolio_id
      FROM   property_expenses pe WHERE pe.id = p_source_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
      END IF;
      v_description := COALESCE(v_description, 'راقع فورصم');

    ELSIF p_source_type = 'capital_transaction' THEN
      SELECT ct.date, ct.amount, ct.currency, ct.exchange_rate,
             ct.notes, ct.type, ct.capital_account_id
      INTO   v_entry_date, v_amount, v_currency, v_exchange_rate,
             v_description, v_capital_type, v_partner_capital_account_id
      FROM   capital_transactions ct WHERE ct.id = p_source_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'P0001';
      END IF;
      v_description := COALESCE(v_description, 'لام سأر ةكرح');

    ELSE
      RAISE EXCEPTION 'UNKNOWN_SOURCE_TYPE: %', p_source_type USING ERRCODE = 'P0001';
    END IF;

    SELECT id INTO v_period_id
    FROM   accounting_periods
    WHERE  start_date <= v_entry_date
      AND  end_date   >= v_entry_date
      AND  status = 'open'
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'NO_OPEN_PERIOD' USING ERRCODE = 'P0002';
    END IF;

    IF p_source_type = 'transaction' THEN
      IF v_transaction_type = 'income' THEN
        IF v_currency = 'USD' THEN
          SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;
        SELECT id INTO v_credit_account_id FROM accounts WHERE code = '4300' LIMIT 1;
      ELSIF v_transaction_type = 'expense' THEN
        SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7300' LIMIT 1;
        IF v_currency = 'USD' THEN
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;
      ELSIF v_transaction_type = 'transfer' THEN
        IF v_currency = 'USD' THEN
          SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
        ELSE
          SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
          SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
        END IF;
      ELSE
        RAISE EXCEPTION 'UNKNOWN_TRANSACTION_TYPE: %', v_transaction_type USING ERRCODE = 'P0001';
      END IF;

    ELSIF p_source_type = 'lease_payment' THEN
      IF v_currency = 'USD' THEN
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1110' LIMIT 1;
      ELSE
        SELECT id INTO v_debit_account_id  FROM accounts WHERE code = '1120' LIMIT 1;
      END IF;
      SELECT id INTO v_credit_account_id FROM accounts WHERE code = '4100' LIMIT 1;

    ELSIF p_source_type = 'property_expense' THEN
      CASE v_expense_type
        WHEN 'maintenance' THEN SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7110' LIMIT 1;
        WHEN 'utilities'   THEN SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7120' LIMIT 1;
        WHEN 'tax'         THEN SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7130' LIMIT 1;
        WHEN 'fees'        THEN SELECT id INTO v_debit_account_id FROM accounts WHERE code = '7140' LIMIT 1;
        ELSE RAISE EXCEPTION 'UNKNOWN_EXPENSE_TYPE: %', v_expense_type USING ERRCODE = 'P0001';
      END CASE;
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
      SELECT pca.partner_id, pca.entity_type
      INTO   v_partner_id, v_entity_type
      FROM   partner_capital_accounts pca
      WHERE  pca.id = v_partner_capital_account_id;

      SELECT a.id INTO v_capital_ledger_id
      FROM   accounts a
      WHERE  a.metadata->>'partner_id' = v_partner_id::text
        AND  a.code LIKE '31%'
      LIMIT 1;

      SELECT a.id INTO v_drawings_ledger_id
      FROM   accounts a
      WHERE  a.metadata->>'partner_id' = v_partner_id::text
        AND  a.code LIKE '32%'
      LIMIT 1;

      CASE v_capital_type
        WHEN 'capital_injection' THEN
          IF v_currency = 'USD' THEN
            SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
          ELSE
            SELECT id INTO v_debit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
          END IF;
          v_credit_account_id := v_capital_ledger_id;
        WHEN 'capital_reduction' THEN
          v_debit_account_id := v_capital_ledger_id;
          IF v_currency = 'USD' THEN
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
          ELSE
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
          END IF;
        WHEN 'drawing' THEN
          v_debit_account_id := v_drawings_ledger_id;
          IF v_currency = 'USD' THEN
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1110' LIMIT 1;
          ELSE
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '1120' LIMIT 1;
          END IF;
        WHEN 'profit_share' THEN
          IF v_entity_type = 'property' THEN
            SELECT id INTO v_debit_account_id FROM accounts WHERE code = '4100' LIMIT 1;
          ELSE
            SELECT id INTO v_debit_account_id FROM accounts WHERE code = '4300' LIMIT 1;
          END IF;
          v_credit_account_id := v_capital_ledger_id;
        WHEN 'loss_share' THEN
          v_debit_account_id := v_capital_ledger_id;
          IF v_entity_type = 'property' THEN
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '7100' LIMIT 1;
          ELSE
            SELECT id INTO v_credit_account_id FROM accounts WHERE code = '7300' LIMIT 1;
          END IF;
        ELSE
          RAISE EXCEPTION 'UNKNOWN_CAPITAL_TYPE: %', v_capital_type USING ERRCODE = 'P0004';
      END CASE;
    END IF;

    IF v_debit_account_id IS NULL OR v_credit_account_id IS NULL THEN
      RAISE EXCEPTION 'ACCOUNT_NOT_FOUND for source_type=% source_id=%',
        p_source_type, p_source_id USING ERRCODE = 'P0005';
    END IF;

    v_reference_no := 'JE-' || UPPER(LEFT(p_source_type, 4))
                    || '-' || LEFT(p_source_id::text, 8);

    INSERT INTO journal_entries (
      entry_date, period_id, reference_no, description,
      status, source_type, source_id
    ) VALUES (
      v_entry_date, v_period_id, v_reference_no, v_description,
      'draft', p_source_type, p_source_id
    )
    RETURNING id INTO v_journal_entry_id;

    INSERT INTO journal_entry_lines
      (journal_entry_id, account_id, debit_amount, credit_amount, currency, exchange_rate)
    VALUES
      (v_journal_entry_id, v_debit_account_id,  v_amount, 0,        v_currency, v_exchange_rate),
      (v_journal_entry_id, v_credit_account_id, 0,        v_amount, v_currency, v_exchange_rate);

    SELECT COALESCE(SUM(debit_amount), 0),
           COALESCE(SUM(credit_amount), 0)
    INTO   v_total_debit, v_total_credit
    FROM   journal_entry_lines
    WHERE  journal_entry_id = v_journal_entry_id;

    IF v_total_debit != v_total_credit THEN
      RAISE EXCEPTION 'ENTRY_NOT_BALANCED (debit=% credit=%)',
        v_total_debit, v_total_credit USING ERRCODE = 'P0003';
    END IF;

    -- STEP 9 REMOVED: entry remains 'draft' (S-098)

    IF p_source_type = 'transaction' THEN
      UPDATE transactions SET journal_entry_id = v_journal_entry_id WHERE id = p_source_id;
    ELSIF p_source_type = 'lease_payment' THEN
      UPDATE lease_payments SET journal_entry_id = v_journal_entry_id WHERE id = p_source_id;
    ELSIF p_source_type = 'property_expense' THEN
      UPDATE property_expenses SET journal_entry_id = v_journal_entry_id WHERE id = p_source_id;
    ELSIF p_source_type = 'capital_transaction' THEN
      UPDATE capital_transactions SET journal_entry_id = v_journal_entry_id WHERE id = p_source_id;
    END IF;

    RETURN v_journal_entry_id;
  END;
$function$;