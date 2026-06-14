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
  -- التحقق من أن القيد الأصلي مُرحَّل
  IF NOT EXISTS (
    SELECT 1 FROM journal_entries
    WHERE id = p_original_id AND status = 'posted'
  ) THEN
    RAISE EXCEPTION 'NOT_POSTED' USING ERRCODE = 'P0001';
  END IF;

  -- التحقق من عدم وجود عكس سابق
  IF EXISTS (
    SELECT 1 FROM journal_entries
    WHERE source_type = 'reversal' AND source_id = p_original_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_REVERSED' USING ERRCODE = 'P0001';
  END IF;

  -- إيجاد الفترة المفتوحة
  SELECT id INTO v_period_id
  FROM accounting_periods
  WHERE status = 'open'
    AND start_date <= v_entry_date
    AND end_date   >= v_entry_date
  LIMIT 1;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'NO_OPEN_PERIOD' USING ERRCODE = 'P0002';
  END IF;

  -- إدراج قيد العكس
  INSERT INTO journal_entries (
    period_id, entry_date, description,
    status, source_type, source_id, reversal_of
  ) VALUES (
    v_period_id, v_entry_date, p_reason,
    'posted', 'reversal', p_original_id, p_original_id
  )
  RETURNING id INTO v_reversal_id;

  -- إدراج سطور معكوسة (مدين ↔ دائن)
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
    u'\u0639\u006B\u0073: ' || COALESCE(description, ''),
    currency,
    exchange_rate
  FROM journal_entry_lines
  WHERE journal_entry_id = p_original_id;

  -- تحديث القيد الأصلي إلى معكوس
  UPDATE journal_entries
  SET status = 'reversed'
  WHERE id = p_original_id;

  RETURN v_reversal_id;
END;
$function$;