-- S-095: Link chart of accounts to company umbrella entity

-- Step 1: Add company_id as nullable first (backfill before NOT NULL)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS company_id uuid
  REFERENCES company(id) ON DELETE RESTRICT;

-- Step 2: Backfill all existing accounts with the single company row
UPDATE accounts
SET company_id = (SELECT id FROM company LIMIT 1)
WHERE company_id IS NULL;

-- Step 3: Enforce NOT NULL now that all rows are populated
ALTER TABLE accounts
  ALTER COLUMN company_id SET NOT NULL;

-- Step 4: Index for FK lookups
CREATE INDEX IF NOT EXISTS idx_accounts_company_id
  ON accounts(company_id);

-- Step 5: Drop existing general_ledger VIEW before recreating
DROP VIEW IF EXISTS general_ledger;

-- Step 6: Recreate general_ledger VIEW with company_id and entry_status
CREATE VIEW general_ledger AS
SELECT
  a.company_id,
  a.code                    AS account_code,
  a.name                    AS account_name,
  a.account_class,
  a.normal_balance,
  ap.fiscal_year,
  ap.period_number,
  ap.name                   AS period_name,
  je.entry_date,
  je.reference_no,
  je.description            AS entry_description,
  jel.description           AS line_description,
  jel.debit_amount,
  jel.credit_amount,
  jel.currency,
  jel.exchange_rate,
  je.source_type,
  je.source_id,
  je.status                 AS entry_status
FROM journal_entry_lines     jel
JOIN journal_entries         je  ON je.id   = jel.journal_entry_id
JOIN accounts                a   ON a.id    = jel.account_id
JOIN accounting_periods      ap  ON ap.id   = je.period_id
WHERE je.status = 'posted'
ORDER BY a.code, je.entry_date, je.id;
