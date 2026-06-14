ALTER TABLE journal_entries 
DROP CONSTRAINT journal_entries_source_type_check;

ALTER TABLE journal_entries 
ADD CONSTRAINT journal_entries_source_type_check 
CHECK (source_type = ANY (ARRAY[
  'manual'::text,
  'transaction'::text,
  'project_transaction'::text,
  'lease_payment'::text,
  'property_expense'::text,
  'capital_transaction'::text,
  'profit_settlement'::text,
  'settlement'::text,
  'reversal'::text,
  'closing'::text
]));