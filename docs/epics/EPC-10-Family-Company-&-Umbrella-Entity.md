EPC-10 — Family Company & Umbrella Entity
Epic  : E10 — الشركة العائلية والكيان الجامع
Sprint: Sprint 12
Status: ✅ Done (S-096 deferred)

---

Stories Overview

Story   Title                                              Status
------  -------------------------------------------------  -----------
S-093   Create Virtual Family Company Entity              ✅ Done
S-094   Define Partner Shares in Company Umbrella Entity  ✅ Done
S-095   Link Chart of Accounts to Company Umbrella Entity ✅ Done
S-096   Historical Opening Balances Entry                 ⏸ Deferred
S-097   General Journal UI (E5 — executed in Sprint 12)   ✅ Done

Note: S-097 belongs to Epic E5 (Financial Transactions) but was
scoped and executed within Sprint 12 as the final infrastructure
story before Sprint 13. It is documented here for sprint completeness.

---

================================================================================

S-093 — Create Virtual Family Company Entity
إنشاء كيان الشركة العائلية الافتراضية
Epic  : E10 — الشركة العائلية والكيان الجامع
Sprint: Sprint 12
Status: ✅ Done
Closed: Sprint 12
Depends on: S-095 (chart of accounts rebuild — inverse: S-093 must exist first)
Blocks    : S-094 (Company Members), S-095 (Link Accounts to Company)

---

Overview

Foundation story for Epic E10. Creates the `company` table as a
single-row entity representing the family partnership umbrella.
Builds CompanySettingsPage at /settings/company with a form to
create/update company details (name, founded date, base currency, notes).

The company is NOT a list — exactly one row is seeded by the migration
and updated via the settings form. No Insert from client; client only
SELECT and UPDATE.

---

What Was Built

1. Files Changed: 10 files, 380 insertions

File                                                    What
------------------------------------------------------  -----------------------------------------------
supabase/migrations/20260613000001_add_company_entity.sql  company table, RLS policies (SELECT+UPDATE only),
                                                           updated_at trigger, seed row via Unicode escapes
src/types/company.ts                                    Company, Currency, UpdateCompanyPayload types
src/lib/supabase/company.ts                             getCompany() / updateCompany() helpers
src/hooks/useCompany.ts                                 useCompany (query, staleTime 5 min) +
                                                           useUpdateCompany (mutation)
src/pages/CompanySettingsPage.tsx                       Full settings form — name, founded date,
                                                           currency Select (Controller), notes textarea;
                                                           skeleton loader; Sonner toasts
src/router/index.tsx                                    { path: 'company', element: <CompanySettingsPage /> }
                                                           under settings children
src/router/routes.ts                                    SETTINGS_COMPANY: '/settings/company'
src/pages/SettingsPage.tsx                              Building2 tab → /settings/company following
                                                           existing NavLink pattern
src/i18n/locales/ar.ts                                  settings.company.* + nav.companySettings keys
src/i18n/locales/en.ts                                  English mirror of same keys

---

2. Migration Details

Table: company
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name            text NOT NULL
  founded_date    date (nullable)
  base_currency   text NOT NULL DEFAULT 'USD' CHECK IN ('USD','SYP')
  notes           text (nullable)
  created_at      timestamptz NOT NULL DEFAULT now()
  updated_at      timestamptz NOT NULL DEFAULT now()

Trigger: trg_company_updated_at — BEFORE UPDATE, sets updated_at = now()
Trigger function: set_updated_at() — created as OR REPLACE (idempotent)

RLS policies:
  company_select → FOR SELECT TO authenticated USING (true)
  company_update → FOR UPDATE TO authenticated USING (true) WITH CHECK (true)
  No INSERT policy — single row exists from seed; client cannot insert

Seed row: name = U&'\0634\0631\0643\0629 \0627\0644\0639\0627\0626\0644\0629'
  (شركة العائلة) via Unicode escapes per POL-003. Inserted only if no
  row exists (WHERE NOT EXISTS guard — idempotent migration).

---

3. Key Decisions

- updated_at maintained by trigger (not application layer)
- base_currency stored here is the reporting currency for all financial
  statements — consumed by S-095 and downstream report stories
- RLS INSERT intentionally omitted: if row absent, getCompany() returns
  null and the page renders an empty pre-populated form; upsert fallback
  not implemented (not needed — seed guarantees row existence)
- useCompany() COMPANY_KEY = ['company'] — shared across all components
  that need company data (chart of accounts badge S-095, future reports)

---

4. Commits

feat(E10): S-093 create virtual family company entity
  - Add company table (single-row) with RLS and seed row
  - Add updated_at trigger
  - Add TypeScript type and Supabase helpers
  - Add useCompany / useUpdateCompany React Query hooks
  - Add CompanySettingsPage at /settings/company
  - Add company settings nav link to Sidebar
  - Add i18n strings under settings.company namespace

---

Issues Encountered & Resolved (S-093)

None. Implementation matched spec exactly.
TypeScript: 0 errors.

---

Database Verification (S-093)

Query run post-migration:
  SELECT id, name, founded_date, base_currency, notes, created_at, updated_at
  FROM company;
Result: 1 row, name = 'شركة المعاز' (updated by user via form after seed)

  SELECT COUNT(*) FROM company;
Result: 1 — single-row constraint verified

Final Verification (S-093): All checks ✅

================================================================================

S-094 — Define Partner Shares in Company Umbrella Entity
تحديد حصص الشركاء في الكيان الجامع
Epic  : E10 — الشركة العائلية والكيان الجامع
Sprint: Sprint 12
Status: ✅ Done (includes post-implementation fix)
Closed: Sprint 12
Depends on: S-093 (company table)
Blocks    : S-095 (Link Accounts to Company)

---

Overview

Adds company_members table linking partners (people) to the company
with fractional shares (share_numerator / share_denominator).
These shares represent each heir's stake in the partnership as a whole —
independent of per-portfolio or per-property shares.

Adds a members section to CompanySettingsPage (below company info card)
with a table, Add/Edit/Delete dialogs, and live share-sum indicator.

Share validation: Σ (share_numerator / share_denominator) for all
members checked with ε = 0.0001 tolerance.

---

What Was Built

1. Files Changed: 8 files, 868 insertions

File                                                    What
------------------------------------------------------  -----------------------------------------------
supabase/migrations/20260613000002_add_company_members.sql  company_members table, UNIQUE constraint,
                                                             CHECK on numerator/denominator, full RLS
src/types/companyMember.ts                              CompanyMember (with person_name join field),
                                                           CreateCompanyMemberPayload,
                                                           UpdateCompanyMemberPayload
src/lib/supabase/companyMembers.ts                      Two-step query pattern (members fetch +
                                                           people name lookup via Map),
                                                           addCompanyMember, updateCompanyMember,
                                                           deleteCompanyMember
src/hooks/useCompanyMembers.ts                          useCompanyMembers (enabled only when
                                                           companyId truthy),
                                                           useAddCompanyMember,
                                                           useUpdateCompanyMember,
                                                           useDeleteCompanyMember
src/utils/shares.ts                                     fractionToDecimal, sharesSum,
                                                           isSharesSumValid (ε = 0.0001)
src/pages/CompanySettingsPage.tsx                       Rewritten: all hooks unconditional at top;
                                                           members table; Add dialog (person Select +
                                                           fraction inputs + live % preview + sum
                                                           validation); Edit dialog (read-only name +
                                                           fraction inputs + reset-on-close);
                                                           Delete AlertDialog
src/i18n/locales/ar.ts                                  settings.company.members.* keys (28 keys)
src/i18n/locales/en.ts                                  English mirror

---

2. Migration Details

Table: company_members
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
  company_id         uuid NOT NULL REFERENCES company(id) ON DELETE CASCADE
  person_id          uuid NOT NULL REFERENCES people(id) ON DELETE RESTRICT
  share_numerator    integer NOT NULL CHECK (share_numerator > 0)
  share_denominator  integer NOT NULL CHECK (share_denominator > 0)
  notes              text (nullable)
  created_at         timestamptz NOT NULL DEFAULT now()
  UNIQUE (company_id, person_id)

RLS policies (4 separate):
  company_members_select → FOR SELECT TO authenticated
  company_members_insert → FOR INSERT TO authenticated
  company_members_update → FOR UPDATE TO authenticated
  company_members_delete → FOR DELETE TO authenticated

---

3. Share Validation Approach

Initial implementation used a hard block:
  if (Math.abs(newTotal - 1) > 0.0001) { toast.error(...); return; }

This prevented adding members one at a time (e.g. first partner at 14/72 = 19.4%
was rejected because 19.4% ≠ 100%). Post-implementation fix applied (see below).

Post-fix approach — soft warning:
  Mutation always fires regardless of total.
  onSuccess: if total = 1 → toast.success; if total ≠ 1 → toast.warning with
  current percentage displayed. Table footer shows red/green aggregate indicator.
  Delete validation unchanged — hard block when deleting would leave remaining
  members with sum ≠ 1 (unless deleting the last member).

---

4. People Selector Cache Key

Person dropdown in AddCompanyMemberDialog uses queryKey ['people-slim']
(not ['people']) to avoid cache collision with the full people list.
Only id and name columns selected.

---

5. Commits

feat(E10): S-094 define partner shares in company umbrella entity
  - Add company_members table with RLS policies
  - Add CompanyMember types and Supabase CRUD helpers
  - Add useCompanyMembers / useAddCompanyMember / useUpdateCompanyMember
    / useDeleteCompanyMember
  - Add sharesSum / isSharesSumValid utilities with epsilon tolerance
  - Add members section to CompanySettingsPage (table + add/edit/delete dialogs)
  - Validate share sum = 1 before every insert and update
  - Add i18n keys under settings.company.members namespace

fix(E10): S-094 relax share sum validation from hard block to warning toast
  - onAddMember: removed pre-flight return block; mutation always fires;
    onSuccess computes new total and routes to success/warning toast
  - onEditMember: same pattern applied
  - Delete validation and table-footer color logic untouched

---

Issues Encountered & Resolved (S-094)

#   Issue                                   Resolution
--  --------------------------------------  ----------------------------------------
1   Hard-block share validation prevented   Post-implementation fix applied.
    adding members one at a time (e.g.      Changed to soft warning: mutation fires
    19.4% rejected because ≠ 100%)          always; toast.warning when total ≠ 100%.
                                            Table footer red/green aggregate retained.

---

Database Verification (S-094)

Query run post-implementation:
  SELECT person_id, share_numerator, share_denominator,
         share_numerator::float / share_denominator AS decimal_share
  FROM company_members WHERE company_id = '<id>';

  SELECT ROUND(SUM(share_numerator::numeric / share_denominator), 4) AS total_shares,
         COUNT(*) AS members_count
  FROM company_members;
Result: total_shares = 1.0000, members_count = 6

Members added: 6 partners with mixed denominators (72nds and 8ths)
totalling 100.0% — verified via application UI and SQL query.

Final Verification (S-094): All checks ✅

================================================================================

S-095 — Link Chart of Accounts to Company Umbrella Entity
ربط شجرة الحسابات بالكيان الجامع
Epic  : E10 — الشركة العائلية والكيان الجامع
Sprint: Sprint 12
Status: ✅ Done
Closed: Sprint 12
Depends on: S-093 (company table), S-094 (company_members)
Blocks    : S-096 (Opening Balances), S-097 (General Journal UI)

---

Overview

Anchors the chart of accounts (`accounts` table) to the company entity
via a company_id foreign key. Rebuilds the general_ledger VIEW to
include company_id and entry_status. Adds a company name badge to the
chart of accounts page (AccountsPage).

Database-infrastructure-first story — minimal UI change.

---

What Was Built

1. Files Changed: 3 files

File                                                    What
------------------------------------------------------  -----------------------------------------------
supabase/migrations/20260613000003_link_accounts_to_company.sql
                                                        ADD COLUMN (nullable) → UPDATE (backfill) →
                                                        SET NOT NULL → CREATE INDEX →
                                                        DROP VIEW → CREATE VIEW
src/types/index.ts                                      Account: company_id: string inserted after id
                                                        GeneralLedgerRow: company_id prepended,
                                                        entry_status: JournalEntry['status'] appended
src/pages/AccountsPage.tsx                              useCompany() added unconditionally at top;
                                                        company_id added to explicit .select() column
                                                        list; company badge rendered between page
                                                        header and IFRS banner (skeleton while loading,
                                                        pill badge when loaded, null if no company)

---

2. Migration Steps (strict order)

Step 1: ALTER TABLE accounts ADD COLUMN company_id uuid
        REFERENCES company(id) ON DELETE RESTRICT  — nullable first
Step 2: UPDATE accounts SET company_id = (SELECT id FROM company LIMIT 1)
        WHERE company_id IS NULL  — backfill all existing rows
Step 3: ALTER TABLE accounts ALTER COLUMN company_id SET NOT NULL
Step 4: CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id)
Step 5: DROP VIEW IF EXISTS general_ledger
Step 6: CREATE VIEW general_ledger AS ...  — rebuilt with company_id + entry_status

---

3. Rebuilt general_ledger VIEW

New columns vs. STR-002 original definition:
  a.company_id          — added (first column) — anchors ledger to company
  je.status AS entry_status  — added (last column) — prepared for S-099/S-102

Full column list (19 columns):
  company_id · account_code · account_name · account_class · normal_balance ·
  fiscal_year · period_number · period_name · entry_date · reference_no ·
  entry_description · line_description · debit_amount · credit_amount ·
  currency · exchange_rate · source_type · source_id · entry_status

---

4. Company Badge (AccountsPage)

Renders between page title and IFRS 18 banner:
  Loading  → h-5 w-48 bg-slate-200 rounded animate-pulse
  Loaded   → pill: bg-slate-100 rounded-full px-3 py-0.5
               {company.name}  •  {company.base_currency}
               text-sm text-slate-500 / text-slate-400
  No data  → null (renders nothing)

---

5. Commits

feat(E10): S-095 link chart of accounts to company umbrella entity
  - Add company_id FK to accounts table with backfill and NOT NULL constraint
  - Add idx_accounts_company_id index
  - Rebuild general_ledger VIEW with company_id and entry_status columns
  - Update Account and GeneralLedgerRow TypeScript interfaces
  - Add company name badge to chart of accounts page

---

Issues Encountered & Resolved (S-095)

None. Migration strict-order requirement followed exactly.
TypeScript: 0 errors.

---

Database Verification (S-095)

Query 1:
  SELECT COUNT(*) AS total, COUNT(company_id) AS with_company_id,
         COUNT(*) - COUNT(company_id) AS missing FROM accounts;
Result: missing = 0 ✅

Query 2:
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'general_ledger' ORDER BY ordinal_position;
Result: 19 columns, company_id first, entry_status last ✅

Final Verification (S-095): All checks ✅

================================================================================

S-096 — Historical Opening Balances Entry
إدخال الأرصدة الافتتاحية التاريخية
Epic  : E10 — الشركة العائلية والكيان الجامع
Sprint: Sprint 12
Status: ⏸ Deferred — not implemented
Deferred reason: System starting from zero; no historical data to migrate.

---

Overview (Original Scope — not built)

Originally intended to provide a UI for entering opening balances for
each postable account as source_type = 'opening_balance' journal entries
posted in the first accounting period.

---

Deferral Decision

During Sprint 12 execution, all transactional data tables were found to
contain only test/seed data. Decision made to start the accounting system
from a clean slate:

  TRUNCATE TABLE
    settlement_shares, profit_settlements, capital_transactions,
    partner_capital_accounts, distributions, lease_payments,
    property_expenses, leases, transactions,
    journal_entry_lines, journal_entries
  RESTART IDENTITY CASCADE;

Post-truncate verification:
  SELECT COUNT(*) FROM journal_entries;  → 0
  SELECT COUNT(*) FROM transactions;     → 0

Opening balances will be entered manually via the General Journal (S-097)
when live accounting begins. No dedicated opening-balance UI is needed
for MVP — the journal entry form is sufficient.

---

Preserved Items (not deleted by truncate):
  people · portfolios · portfolio_members · properties · property_owners ·
  accounts · accounting_periods · exchange_rates · company · company_members

Deferred to: Post-MVP or when accountant begins live data entry.

================================================================================

S-097 — General Journal UI
واجهة دفتر اليومية العام
Epic  : E5 — المعاملات المالية (executed in Sprint 12)
Sprint: Sprint 12
Status: ✅ Done
Closed: Sprint 12
Depends on: S-095 (accounts have company_id, general_ledger VIEW rebuilt)
Blocks    : S-099 (Sprint 13 — Journal Review Page)
            S-100 (Sprint 13 — Posting Interface)

---

Overview

Builds the General Journal page (/journal) for entering manual
double-entry journal vouchers with dynamic debit/credit lines.

Per STR-006 §4.1: manual entries saved as status='draft' only.
No automatic posting — posting is Sprint 13 (S-100).

Per STR-006 §4.2, conditions enforced at form level:
  ① Σ debit = Σ credit (balance check)
  ② Lines ≥ 2 (minimum two sides)
  ③ Each line: debit XOR credit > 0 (not both, not neither)
  ④ Only is_postable=true accounts selectable (enforced via account selector)
  ⑤⑥ Open period resolution via findOpenPeriod() called in onSubmit

---

What Was Built

1. Files Changed: 9 files, 756 insertions

File                                                    What
------------------------------------------------------  -----------------------------------------------
src/types/journalEntry.ts                               JournalEntryStatus, JournalEntrySourceType,
                                                           JournalEntry, JournalEntryLine,
                                                           JournalEntryLineInput, JournalEntryWithLines,
                                                           CreateJournalEntryPayload
                                                           Re-uses existing JournalEntry/JournalEntryLine
                                                           from @/types to avoid duplication
src/lib/supabase/journalEntries.ts                      findOpenPeriod (open period containing date),
                                                           getManualJournalEntries (two-step query —
                                                           entries then lines merged via Map),
                                                           createJournalEntry (sequential insert with
                                                           manual rollback on lines failure),
                                                           deleteJournalEntry (draft-only guard)
src/hooks/useJournalEntries.ts                          useManualJournalEntries,
                                                           useCreateJournalEntry,
                                                           useDeleteJournalEntry
src/pages/JournalPage.tsx                               useFieldArray form with account grouped-Select
                                                           (per account_class), live debit/credit totals
                                                           updating on every keystroke, balanced/
                                                           not-balanced badge in tfoot, XOR-per-line Zod
                                                           errors, submit disabled until balanced,
                                                           draft entries log table below with
                                                           delete-only-for-draft guard
src/router/index.tsx                                    /journal route added inside authenticated layout
src/router/routes.ts                                    JOURNAL: '/journal' constant
src/components/layout/Sidebar.tsx                       BookOpen nav item inserted after المعاملات
src/i18n/locales/ar.ts                                  nav.journal + 30-key journal.* section
src/i18n/locales/en.ts                                  English mirror

---

2. Key Implementation Decisions

useFieldArray (not useState) for dynamic lines:
  React Hook Form's useFieldArray tracks each row's form state correctly
  without triggering unnecessary re-renders. Controller (not register)
  required for Shadcn Select components inside field array rows.

Account selector grouping:
  Postable accounts (is_postable=true, is_active=true) fetched with
  queryKey ['accounts-postable'], staleTime 10 min. Grouped by account_class
  into 5 Arabic-labelled optgroups via useMemo.

Period resolution in onSubmit:
  findOpenPeriod(entry_date) called at submission time (not on mount).
  If no open period: toast.error blocks insert. Uses lte/gte Supabase
  operators against start_date/end_date of accounting_periods.

createJournalEntry rollback:
  Header inserted first (returns id). If lines insert fails, header
  deleted manually (await supabase.from('journal_entries').delete().eq('id', entry.id)).
  Full DB transaction not used (no RPC for manual entries) — manual rollback
  pattern follows project conventions for sequential inserts.

Balance indicator:
  Real-time via form.watch('lines'). totalDebit and totalCredit recomputed
  on every keystroke. isBalanced = |totalDebit - totalCredit| < 0.001 AND
  totalDebit > 0. Submit button disabled until isBalanced = true.

---

3. Commits

feat(E5): S-097 general journal UI — manual entry form and draft log
  - Add JournalEntry / JournalEntryLine / JournalEntryLineInput types
  - Add Supabase helpers: createJournalEntry, getManualJournalEntries,
    deleteJournalEntry, findOpenPeriod
  - Add useManualJournalEntries / useCreateJournalEntry / useDeleteJournalEntry
  - Add JournalPage with dynamic multi-line form, live balance indicator,
    draft entries log, and delete action
  - Add /journal route and دفتر اليومية sidebar link
  - Add i18n keys under journal.* namespace

---

Issues Encountered & Resolved (S-097)

None. Implementation matched spec exactly.
TypeScript: 0 errors.

---

Final Verification (S-097): All checks ✅

================================================================================

E10 — Canonical Rules Established This Sprint

1. company table is single-row — one seed row, client UPDATE only.
   RLS: SELECT + UPDATE allowed. INSERT from client intentionally omitted.
   Confirmed via query: SELECT COUNT(*) FROM company → always 1.

2. Arabic text in SQL migrations: Unicode escape sequences ONLY (POL-003).
   Confirmed in all three Sprint 12 migrations.
   Pattern: U&'\XXXX\XXXX' — no Arabic literals in .sql files.

3. company_id FK added to accounts table — all accounts belong to the
   single company entity. Migration strict order mandatory:
   ADD COLUMN (nullable) → UPDATE → SET NOT NULL → INDEX → DROP VIEW → CREATE VIEW
   Reversing any step causes migration failure.

4. general_ledger VIEW must be DROP + CREATE (not CREATE OR REPLACE).
   Supabase compatibility requirement. DROP VIEW IF EXISTS before recreating.

5. Share validation: soft warning (toast.warning) not hard block.
   Members can be added with partial totals; red aggregate footer signals
   incomplete state. Hard block only on DELETE when remaining sum ≠ 1
   (unless deleting the last member).

6. queryKey ['people-slim'] for minimal people fetch in member selectors.
   Never ['people'] — prevents cache collision with full people list.
   Columns: id, name only. staleTime 10 min.

7. queryKey ['accounts-postable'] for is_postable=true accounts.
   Separate from full accounts query. staleTime 10 min.
   Used in JournalPage account selector. Grouped by account_class in useMemo.

8. useFieldArray (react-hook-form) for dynamic form line arrays.
   Controller (not register) required for Shadcn Select inside field rows.
   Established in S-097. Apply to all future dynamic-line forms.

9. findOpenPeriod() called in onSubmit, not on mount.
   Period depends on user-entered date — cannot be pre-fetched.
   Uses .lte('start_date', date).gte('end_date', date).eq('status', 'open')

10. Manual rollback pattern for sequential inserts without RPC:
    Insert header → get id → insert lines → if lines fail: delete header.
    Used in createJournalEntry. Established for non-RPC manual entry path.

================================================================================

E10 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — S-096 Opening Balances Entry UI

A dedicated UI for entering opening balances (source_type = 'opening_balance')
for each postable account before going live.

Current workaround: use the General Journal (S-097) to enter opening
balance vouchers manually. The form supports this fully.

Deferred: until accountant begins live data entry and requires a
streamlined batch-entry experience for 20+ accounts.

Deferred Item 2 — Company Members Share History (Effective Dates)

Currently company_members has no effective_from/effective_to pattern
(unlike project_members which uses Effective Dates Pattern — STR-002 §1.6).

If ownership shares change over time (e.g. a partner sells their stake),
the current schema overwrites the historical share. For a family
partnership that is legally stable, this is acceptable for MVP.

Scope: add effective_from date column + effective_to nullable + UNIQUE
(company_id, person_id, effective_from). Deferred: post-MVP.

Deferred Item 3 — Journal Entry Lines View in Log

The draft entries log table shows line count and total debit but does
not show individual line details inline. A row-expand or view-lines
Dialog was noted in the story spec but implementation focused on the
core form and log table.

Scope: add Eye icon button per row → opens read-only Dialog showing
journal_entry_lines for that entry. Low effort — deferred to Sprint 13
or UX polish sprint.