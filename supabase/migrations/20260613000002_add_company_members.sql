-- S-094: Partner shares in company umbrella entity

CREATE TABLE IF NOT EXISTS company_members (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid        NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  person_id          uuid        NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  share_numerator    integer     NOT NULL CHECK (share_numerator > 0),
  share_denominator  integer     NOT NULL CHECK (share_denominator > 0),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, person_id)
);

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select" ON company_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_members_insert" ON company_members
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "company_members_update" ON company_members
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "company_members_delete" ON company_members
  FOR DELETE TO authenticated USING (true);
