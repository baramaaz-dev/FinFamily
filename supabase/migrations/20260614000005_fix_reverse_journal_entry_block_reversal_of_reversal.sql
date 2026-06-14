CREATE OR REPLACE FUNCTION public.reverse_journal_entry(
  p_original_id uuid,
  p_reason      text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_reversal_id  uuid;
  v_period_id    uuid;
  v_entry_date   date := CURRENT_DATE;
BEGIN
  -- منع عكس القيد العكسي
  IF EXISTS (
    SELECT 1 FROM journal_entries
    WHERE id = p_original_id AND source_type = 'reversal'
  ) THEN
    RAISE EXCEPTION 'CANNOT_REVERSE_REVERSAL' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM journal_entries
    WHERE id = p_original_id AND status = 'posted'
  ) THEN
    RAISE EXCEPTION 'NOT_POSTED' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM journal_entries
    WHERE source_type = 'reversal' AND source_id = p_original_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_REVERSED' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_period_id
  FROM accounting_periods
  WHERE status = 'open'
    AND start_date <= v_entry_date
    AND end_date   >= v_entry_date
  LIMIT 1;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'NO_OPEN_PERIOD' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO journal_entries (
    period_id, entry_date, description,
    status, source_type, source_id, reversal_of
  ) VALUES (
    v_period_id, v_entry_date, p_reason,
    'posted', 'reversal', p_original_id, p_original_id
  )
  RETURNING id INTO v_reversal_id;

  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id,
    debit_amount, credit_amount,
    description, currency, exchange_rate
  )
  SELECT
    v_reversal_id,
    account_id,
    credit_amount,
    debit_amount,
    'عكس: ' || COALESCE(description, ''),
    currency,
    exchange_rate
  FROM journal_entry_lines
  WHERE journal_entry_id = p_original_id;

  UPDATE journal_entries
  SET status = 'reversed'
  WHERE id = p_original_id;

  RETURN v_reversal_id;
END;
$function$;