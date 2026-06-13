-- S-093: Virtual family company entity

CREATE TABLE IF NOT EXISTS company (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  founded_date  date,
  base_currency text        NOT NULL DEFAULT 'USD'
                            CHECK (base_currency IN ('USD', 'SYP')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_updated_at
  BEFORE UPDATE ON company
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE company ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_select" ON company
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_update" ON company
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO company (name, base_currency)
SELECT U&'\0634\0631\0643\0629 \0627\0644\0639\0627\0626\0644\0629', 'USD'
WHERE NOT EXISTS (SELECT 1 FROM company);
