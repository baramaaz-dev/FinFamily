EPC-01 — Infrastructure & Setup
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 0, 1, 10 & 11 — الإعداد والبنية التحتية والإتمام والمحرك المحاسبي
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-001	Development Environment & External Tools Setup			✅ Done
S-002	React Router DOM Setup, Page Structure & i18n Infrastructure	✅ Done
S-003	Main RTL/LTR Layout (Sidebar + Header + Content)		✅ Done
S-004	Authentication System (Login + Protected Routes)		✅ Done
S-005	Dinero.js Setup & Currency Logic (USD/SYP)			✅ Done
S-006	Apply Database Migrations for All Tables			✅ Done
S-007	Verify & Document RLS Policies for All Tables			✅ Done
S-008	Create Seed Data for Development & Testing			✅ Done
S-075	Comprehensive Error Handling (Error Boundaries + Toast)		✅ Done
S-076	Skeleton Loaders (Loading States Standardisation)		✅ Done
S-077	Form Validation Review (Zod Schemas Audit + suppressGlobalError)	✅ Done
S-078	RLS Policy Testing (All Tables Verification)			✅ Done
S-079	Full RTL Compatibility Review + Visual Consistency Fixes	✅ Done
S-080	Performance Optimisation (React Query Caching)			✅ Done
S-081	Mobile Responsive Testing & Fixes				✅ Done
S-082	Final Security Review Before Production				✅ Done
S-084	Auto-create Partner Ledger Accounts on people INSERT		✅ Done
S-085	RPC — post_journal_entry (Single-Source Posting)		✅ Done
S-086	RPC — post_settlement_entry (Compound Settlement Entry)	✅ Done
S-087	RPC — delete_partner_accounts (Conditional Deletion + UI Guard)	✅ Done
S-092	Posting Status Indicators in UI				⏳ Pending
---

Sprint 11 Context — Double-Entry Accounting Engine
Sprint 11 introduces the accounting engine layer that activates the double-entry
bookkeeping system across all financial entities in FinFamily. The four E1 stories
in this sprint (S-084 through S-087) form the infrastructure foundation — pure
database layer — on which the frontend wiring stories (S-088 through S-092) depend.

Reference documents governing Sprint 11:
  STR-006 v1.2 — Accounting Engine (authoritative)
  POL-001 v1.0 — Journal Recording & Posting Policy
  POL-002 v1.0 — Accounting Audit Policy
  POL-003 v1.0 — Arabic Text Encoding Policy for SQL Migrations

---

S-001 — Development Environment & External Tools Setup
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Vite + React + TypeScript
Project initialized with `react-ts` template
Runs on `localhost:5173` (dev) / `localhost:5174` (with port conflict)
Boilerplate removed: `App.css`, default `App.tsx` content, duplicate CSS files
`npx tsc --noEmit` → Zero errors
2. TypeScript Configuration
`tsconfig.json` created with `"strict": true`
`"ignoreDeprecations": "6.0"` added for `baseUrl` compatibility
`paths` configured: `@/*` → `./src/*`
`src/vite-env.d.ts` created with `/// <reference types="vite/client" />`
All source files migrated: `.js` → `.ts`, `.jsx` → `.tsx`
3. Tailwind CSS v3 + Shadcn/UI
Tailwind v4 downgraded to `^3.4.19`
`tailwind.config.ts` generated with correct `content` array
`npx shadcn@latest init` completed (Style: Default, Base: Slate, CSS vars: Yes)
`components.json` present at project root
`@radix-ui/*` packages installed
4. Supabase
Project created at `https://amvsvragnchbqwsycgyt.supabase.co`
Email Auth only — all OAuth providers disabled
Single admin user created manually via Dashboard
`src/lib/supabase.ts` exports `supabaseClient`
`VITE_SUPABASE_URL` corrected (base URL only, no `/rest/v1/` suffix)
Connection verified: `getSession()` returns no errors
Login flow tested end-to-end ✅
5. RLS
RLS enabled on all tables in `public` schema
Policies present on every table: `SELECT`, `INSERT`, `DELETE`
Verified via Supabase Dashboard → Authentication → Policies
6. Environment Variables
`.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
`.env.local` listed in `.gitignore` (covered by `*.local` rule)
`.env.example` committed with placeholder values only
7. Installed Packages
Package	Version	Purpose
`@supabase/supabase-js`	^2.106.2	Database & Auth
`@tanstack/react-query`	^5.100.14	Server state management
`react-router-dom`	^7.16.0	Client-side routing
`react-hook-form`	latest	Form management
`zod`	latest	Schema validation
`@hookform/resolvers`	latest	RHF + Zod bridge
`dinero.js`	^2.0.2	Monetary calculations
`@dinero.js/currencies`	^2.0.0-alpha.1	Currency definitions
`recharts`	^3.8.1	Charts & visualizations
`jspdf`	latest	PDF generation
`html2canvas`	latest	PDF screenshot capture
`date-fns`	^4.4.0	Date formatting & utils
`clsx`	latest	Conditional classnames
`tailwind-merge`	latest	Tailwind class merging
`lucide-react`	^1.17.0	Icon library
`zustand`	latest	Client state management
8. Project Structure
finfamily/
├── public/
├── src/
│   ├── components/
│   │   └── ui/                  ← Shadcn components
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .env.example
├── .env.local                   ← git-ignored
├── .gitignore
├── components.json
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── vite.config.ts
└── package.json
9. GitHub Repository
Repository: `finfamily` (Private)
Branch strategy: main (production) · develop · feature/* · fix/*
Commits follow Conventional Commits standard
10. Vercel Deployment
Project: `fin-family-maaz`
Production URL: `https://fin-family-maaz.vercel.app`
Source branch: `main`
Issues Encountered & Resolved
#	Issue	Resolution
1	Tailwind v4 installed instead of v3	Uninstalled v4, installed `tailwindcss@^3`
2	`VITE_SUPABASE_URL` had `/rest/v1/` suffix	Removed suffix, base URL only
3	Project was JavaScript, not TypeScript	Full migration `.js/.jsx` → `.ts/.tsx`
4	`vite.config.js` instead of `.ts`	Renamed to `vite.config.ts`
5	`supabase` export name instead of `supabaseClient`	Renamed export and all importers
6	`@tanstack/react-query` missing	Installed `^5.100.14`
7	`@dinero.js/currencies` missing	Installed `^2.0.0-alpha.1`
8	`TS5101` — `baseUrl` deprecated in TS6	Added `"ignoreDeprecations": "6.0"`
9	`TS2339` — `import.meta.env` unknown	Created `src/vite-env.d.ts`
10	`TS7006` — implicit `any` in event handler	Typed as `React.FormEvent<HTMLFormElement>`
11	Duplicate CSS: `src/styles/index.css`	Consolidated into `src/index.css`
12	`App.css` boilerplate not removed	Deleted `src/App.css`
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
`npm run dev`	✅ Ready in ~1800ms
Tailwind CSS version	✅ ^3.4.19
Supabase connection	✅ No errors
Login flow (local)	✅ Authenticated successfully
RLS on all tables	✅ Verified via Dashboard
Vercel deployment	✅ Status: Ready

---
S-002 — React Router DOM Setup, Page Structure & i18n Infrastructure
Status: ✅ Done
Closed: Sprint 0
[Content unchanged from original EPC-01 — see git history]

---
S-003 — Main RTL/LTR Layout (Sidebar + Header + Content)
Status: ✅ Done
Closed: Sprint 0
[Content unchanged from original EPC-01 — see git history]

---
S-004 — Authentication System (Login + Protected Routes)
Status: ✅ Done
Closed: Sprint 0
[Content unchanged from original EPC-01 — see git history]

---
S-005 — Dinero.js Setup & Currency Logic (USD/SYP)
Status: ✅ Done
Closed: Sprint 0
[Content unchanged from original EPC-01 — see git history]

---
S-006 — Apply Database Migrations for All Tables
Status: ✅ Done
Closed: Sprint 1
[Content unchanged from original EPC-01 — see git history]

---
S-007 — Verify & Document RLS Policies for All Tables
Status: ✅ Done
Closed: Sprint 1
[Content unchanged from original EPC-01 — see git history]

---
S-008 — Create Seed Data for Development & Testing
Status: ✅ Done
Closed: Sprint 1
[Content unchanged from original EPC-01 — see git history]

---
S-075 — Comprehensive Error Handling (Error Boundaries + Toast)
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-076 — Skeleton Loaders (Loading States Standardisation)
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-077 — Form Validation Review (Zod Schemas Audit + suppressGlobalError)
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-078 — RLS Policy Testing (All Tables Verification)
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-079 — Full RTL Compatibility Review + Visual Consistency Fixes
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-080 — Performance Optimisation (React Query Caching)
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-081 — Mobile Responsive Testing & Fixes
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---
S-082 — Final Security Review Before Production
Status: ✅ Done
Closed: Sprint 10
[Content unchanged from original EPC-01 — see git history]

---

============================================================================
Sprint 11 — Accounting Engine Integration
============================================================================

S-084 — Auto-create Partner Ledger Accounts on people INSERT
Status: ✅ Done
Closed: Sprint 11

What Was Built

1. Schema Fix — accounts.metadata Column

During the pre-implementation audit, the accounts table was found to be missing
the metadata jsonb column required for partner→account linking (STR-006 §2.4).
The column was added in this migration before the trigger was created:

  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metadata jsonb;

This is a schema gap from S-006 that was not caught during the original
migrations. STR-002 requires updating to reflect this addition.

2. Trigger Function — auto_create_partner_accounts()

PostgreSQL function created with SECURITY DEFINER.
Fires AFTER INSERT ON people FOR EACH ROW.
Creates two accounts atomically for every new person:

  Capital account (31XX):
    account_class = 'equity'
    normal_balance = 'credit'
    is_postable = true
    parent_id → account code '3100'
    name = U&'\0631\0623\0633 \0645\0627\0644 ' || NEW.name
    metadata = { "partner_id": "<person_uuid>" }

  Drawings account (32XX):
    account_class = 'equity'
    normal_balance = 'debit'
    is_postable = true
    parent_id → account code '3200'
    name = U&'\0645\0633\062D\0648\0628\0627\062A ' || NEW.name
    metadata = { "partner_id": "<person_uuid>" }

Account code generation uses (COUNT + 1) * 10 pattern:
  first partner → 3110 / 3210
  second → 3120 / 3220
  third → 3130 / 3230 (and so on)

Idempotency guard at function entry:
  IF EXISTS (SELECT 1 FROM accounts WHERE metadata->>'partner_id' = NEW.id::text)
  THEN RETURN NEW; END IF;

3. Trigger Registration

  CREATE TRIGGER trg_auto_create_partner_accounts
    AFTER INSERT ON people
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_partner_accounts();

4. Backfill Migration — Existing People

A DO $$ block loops over all people not yet represented in accounts.metadata.
Processed 6 existing people → 12 accounts created:
  Capital: 3130 through 3180
  Drawings: 3230 through 3280

Codes begin at 3130 (not 3110) because 3110 and 3120 were already seeded
as example partner accounts in the original M-04 seed migration (S-006).

5. RLS

No new policy needed. The existing `authenticated_full_access FOR ALL`
policy on accounts (from migration 20260601000003) already covers
trigger-created rows. Confirmed via pg_policy audit.

6. Verification

Query 3 (people missing accounts) returned 0 rows — all 6 people confirmed
with both 31XX and 32XX accounts.

Migration File: supabase/migrations/20260611120000_auto_partner_accounts_trigger.sql

Project Structure after S-084

supabase/migrations/
└── 20260611120000_auto_partner_accounts_trigger.sql   ← NEW

accounts table schema change:
  + metadata jsonb    ← added (was missing from S-006 original)

Commits
feat(db): add auto partner account creation trigger and backfill (S-084)

Issues Encountered & Resolved

#	Issue	Resolution
1	accounts.metadata column did not exist in the database	Added via ALTER TABLE IF NOT EXISTS before trigger creation — schema gap from S-006 documented for STR-002 update
2	Existing people had no accounts — trigger only fires on new inserts	Added DO $$ backfill loop covering all people WHERE NOT EXISTS in accounts.metadata

Final Verification

Check	Result
Migration file applied	✅ 20260611120000_auto_partner_accounts_trigger.sql
metadata column present on accounts	✅ Added in this migration
Trigger active on people table	✅ Confirmed via Supabase Dashboard
6 existing people backfilled	✅ 12 accounts created (3130–3180 / 3230–3280)
Verification query 3 (missing accounts)	✅ 0 rows
RLS: existing policy covers new accounts	✅ No new policy needed

---

S-085 — RPC — post_journal_entry (Single-Source Posting)
Status: ✅ Done
Closed: Sprint 11

What Was Built

1. Missing Expense Accounts — Schema Gap Fix

During pre-implementation testing, the following IFRS 18 operating expense
accounts were found missing from the chart of accounts (not seeded in M-04):

  7000  مصروفات التشغيل    (expense · debit · not postable)
  7100  مصروفات العقارات   (expense · debit · not postable)
  7110  مصروفات الصيانة    (expense · debit · postable)
  7120  مصروفات المرافق    (expense · debit · postable)
  7130  الضرائب والرسوم     (expense · debit · postable)
  7140  مصروفات أخرى       (expense · debit · postable)
  7300  مصروفات المحافظ    (expense · debit · postable)

These 7 accounts were added inside the migration using Unicode escape
sequences per POL-003 (Arabic text encoding rule). Individual INSERT
statements used — multi-row VALUES with Arabic text causes parser errors
in the Supabase SQL editor (see Issues section).

2. RPC Function — post_journal_entry(text, uuid) → uuid

Function created with LANGUAGE plpgsql SECURITY DEFINER.
Accepts p_source_type (text) and p_source_id (uuid).
Returns the created journal_entry_id (uuid).

Handles 4 source types with full sub-type coverage:

  source_type = 'transaction'
    income   → DEBIT 1110/1120, CREDIT 4300
    expense  → DEBIT 7300, CREDIT 1110/1120
    transfer → DEBIT 1110/1120, CREDIT 1110/1120 (same account, MVP)

  source_type = 'lease_payment'
    → DEBIT 1110/1120, CREDIT 4100

  source_type = 'property_expense'
    type=maintenance → DEBIT 7110
    type=utilities   → DEBIT 7120
    type=tax         → DEBIT 7130
    type=fees        → DEBIT 7140
    portfolio IS NOT NULL → CREDIT 1110/1120 (cash)
    portfolio IS NULL     → CREDIT 2120 (accrued expenses)

  source_type = 'capital_transaction'
    capital_injection → DEBIT 1110/1120, CREDIT 31XX (partner capital)
    capital_reduction → DEBIT 31XX, CREDIT 1110/1120
    drawing           → DEBIT 32XX, CREDIT 1110/1120
    profit_share      → DEBIT 4100/4300 (by entity_type), CREDIT 31XX
    loss_share        → DEBIT 31XX, CREDIT 7100/7300 (by entity_type)

Partner accounts (31XX/32XX) resolved dynamically:
  SELECT id FROM accounts
  WHERE metadata->>'partner_id' = partner_id::text AND code LIKE '31%'

3. Seven-Step Atomic Execution (STR-006 §10.1)

All steps execute inside a single implicit transaction:
  Step 1: Check journal_entry_id IS NULL → raise ALREADY_POSTED if duplicate
  Step 2: Fetch source record and validate (raise SOURCE_NOT_FOUND if missing)
  Step 3: Find open accounting period → raise NO_OPEN_PERIOD if absent
  Step 4: Resolve account IDs per template
  Step 5: Generate reference_no: 'JE-' || UPPER(LEFT(source_type,4)) || '-' || LEFT(source_id::text,8)
  Step 6: INSERT journal_entries (status='draft')
  Step 7: INSERT journal_entry_lines, verify balance, UPDATE to 'posted',
          UPDATE source table journal_entry_id FK

4. GRANT

  GRANT EXECUTE ON FUNCTION post_journal_entry(text, uuid) TO authenticated;

5. Test Results

  Test: capital_injection posting → journal entry created, status='posted' ✅
  Test: ALREADY_POSTED guard → second call on same source raised exception ✅
  Test: balance check (internal) → Σ debit = Σ credit confirmed ✅

Migration File: supabase/migrations/20260612000000_post_journal_entry_rpc.sql

Hotfix Applied Between S-085 and S-086 — Arabic Account Names Reversed

During verification of S-085, Arabic account names in the accounts table were
found stored with character-by-character reversal (e.g., "رأس مال" stored as
"لام سأر"). Root cause: Arabic text entered directly in the Supabase SQL
editor gets character-reversed by the LTR rendering environment.

Hotfix migration applied: 20260612000001_fix_reversed_arabic_account_names.sql
  Part A: 48 seed accounts (1XXX–9XXX) updated with correct names using REVERSE()
  Part B: 12 partner accounts (31XX/32XX) rebuilt from people.name using Unicode-escaped prefixes
  Part C: auto_create_partner_accounts trigger rewritten with Unicode escape
          sequences (U&'\XXXX') for all Arabic string literals

Policy established: docs/policies/Arabic-Text-Encoding-Policy-for-SQL-Migrations.md (POL-003)
Rule: No Arabic string literals in any SQL file. Unicode escapes only.

Project Structure after S-085

supabase/migrations/
├── 20260612000000_post_journal_entry_rpc.sql              ← NEW (S-085)
└── 20260612000001_fix_reversed_arabic_account_names.sql   ← NEW (hotfix)

docs/policies/
└── Arabic-Text-Encoding-Policy-for-SQL-Migrations.md      ← NEW (POL-003)

Commits
feat(db): add post_journal_entry RPC function (S-085)
fix(db): correct reversed Arabic account names — 48 seed + 12 partner accounts
docs: add POL-003 Arabic text encoding policy for SQL migrations

Issues Encountered & Resolved

#	Issue	Resolution
1	Expense accounts 7000–7300 missing from original chart of accounts seed (M-04)	Added 7 accounts in this migration using Unicode escape sequences; STR-002 to be updated
2	RTL text in multi-column VALUES causes silent parser errors in Supabase SQL editor	Switched to individual SELECT-based INSERT statements per account; rule documented in POL-003
3	All Arabic account names discovered to be stored character-reversed	Hotfix migration applied (20260612000001); trigger rewritten with Unicode escapes; POL-003 created

Final Verification

Check	Result
Migration file applied	✅ 20260612000000_post_journal_entry_rpc.sql
Function exists in pg_proc	✅ post_journal_entry(text, uuid)
SECURITY DEFINER confirmed	✅
GRANT to authenticated	✅
capital_injection test posting	✅ journal_entry_id populated, status='posted'
ALREADY_POSTED guard	✅ Exception raised on second call
Arabic names hotfix applied	✅ 20260612000001 — 60 accounts corrected
POL-003 committed	✅ docs/policies/

---

S-086 — RPC — post_settlement_entry (Compound Settlement Entry)
Status: ✅ Done
Closed: Sprint 11

What Was Built

1. Schema Addition — profit_settlements.journal_entry_id

  ALTER TABLE profit_settlements
  ADD COLUMN IF NOT EXISTS journal_entry_id uuid
  REFERENCES journal_entries(id);

This column was absent from the original profit_settlements table (S-006).
Links each confirmed settlement to its corresponding compound journal entry.

2. source_type CHECK Extension

The journal_entries.source_type CHECK constraint was extended to include
'profit_settlement' as a valid source type. This required dropping and
recreating the constraint (PostgreSQL does not support ADD CONSTRAINT IF NOT
EXISTS for CHECK constraints — DO $$ pattern used).

Previously accepted values: transaction · lease_payment · property_expense ·
capital_transaction · project_transaction · manual
Now also accepts: profit_settlement

STR-002 requires updating to reflect this CHECK extension.

3. RPC Function — post_settlement_entry(uuid) → uuid

Function created with LANGUAGE plpgsql SECURITY DEFINER.
Accepts p_settlement_id (uuid). Returns journal_entry_id (uuid).

Implements the compound N+1 journal entry per STR-006 §8.4:
  1 debit line  → revenue account (4100 for property, 4300 for portfolio)
                  amount = settlement.total_profit (full amount)
  N credit lines → one per settlement_share, crediting partner's 31XX account
                   amount = share.amount (individual partner share)

13-step atomic execution:
  Step 1:  Fetch settlement record → SOURCE_NOT_FOUND if missing
  Step 2:  Validate status = 'confirmed' → SETTLEMENT_NOT_CONFIRMED if draft
  Step 3:  Prevent double posting → ALREADY_POSTED if journal_entry_id IS NOT NULL
  Step 4:  Validate Σ shares = total_profit → SHARES_DO_NOT_BALANCE if mismatch
  Step 5:  Find open accounting period → NO_OPEN_PERIOD if absent
  Step 6:  Resolve revenue account by entity_type (4100 or 4300)
  Step 7:  Generate reference_no: 'JE-SETL-' || LEFT(settlement_id::text, 8)
  Step 8:  INSERT journal_entries (status='draft', source_type='profit_settlement')
  Step 9:  INSERT debit line (revenue account, total_profit)
  Step 10: LOOP over settlement_shares → INSERT one credit line per partner
           Partner 31XX account resolved via accounts.metadata->>'partner_id'
           Raises PARTNER_ACCOUNT_NOT_FOUND if any partner lacks a 31XX account
  Step 11: Verify balance: ROUND(Σdebit,2) = ROUND(Σcredit,2) → SETTLEMENT_ENTRY_NOT_BALANCED
  Step 12: UPDATE journal_entries.status = 'posted'
  Step 13: UPDATE profit_settlements.journal_entry_id = new entry id

ROUND(..., 2) used in balance check to guard against floating-point drift
when summing N partner share amounts.

4. GRANT

  GRANT EXECUTE ON FUNCTION post_settlement_entry(uuid) TO authenticated;

5. Test Results

  Settlement tested: 6 partners × 1000 USD = 6000 USD total
  Journal entry structure: 1 debit line (4300, $6000) + 6 credit lines (31XX, $1000 each)
  All 7 verification steps passed ✅
  ALREADY_POSTED guard confirmed ✅

Migration File: supabase/migrations/20260612000002_post_settlement_entry_rpc.sql

Project Structure after S-086

supabase/migrations/
└── 20260612000002_post_settlement_entry_rpc.sql   ← NEW

Commits
feat(db): add post_settlement_entry RPC function (S-086)

Issues Encountered & Resolved

#	Issue	Resolution
1	Supabase SQL editor silently drops CREATE FUNCTION when pasted as part of a larger migration block	Function creation run as a standalone SQL statement, separate from other migration SQL; existence confirmed via SELECT proname FROM pg_proc; rule documented for all future function migrations
2	journal_entry_id missing from profit_settlements (S-006 gap)	Added via ALTER TABLE in this migration
3	source_type CHECK on journal_entries did not include 'profit_settlement'	CHECK constraint dropped and recreated with extended value list

Final Verification

Check	Result
Migration file applied	✅ 20260612000002_post_settlement_entry_rpc.sql
profit_settlements.journal_entry_id column exists	✅
source_type CHECK includes 'profit_settlement'	✅
Function post_settlement_entry(uuid) in pg_proc	✅
SECURITY DEFINER confirmed	✅
GRANT to authenticated	✅
6-partner test: 1 debit + 6 credit lines	✅
Σ debit = Σ credit	✅ $6000 balanced
ALREADY_POSTED guard	✅
All 7 verification steps passed	✅

---

S-087 — RPC — delete_partner_accounts (Conditional Deletion + UI Guard)
Status: ✅ Done
Closed: Sprint 11

What Was Built

1. RPC Function — delete_partner_accounts(uuid) → void

Function created with LANGUAGE plpgsql SECURITY DEFINER.
Accepts p_person_id (uuid). Returns void.

Logic:
  Step 1: Check if any account linked to this person via metadata->>'partner_id'
          has rows in journal_entry_lines (covers both 31XX and 32XX accounts):

    SELECT EXISTS (
      SELECT 1 FROM journal_entry_lines jel
      JOIN accounts a ON a.id = jel.account_id
      WHERE a.metadata->>'partner_id' = p_person_id::text
    ) INTO v_has_entries;

  Step 2: IF v_has_entries → RAISE EXCEPTION 'ACCOUNTS_HAVE_ENTRIES'
  Step 3: ELSE → DELETE FROM accounts WHERE metadata->>'partner_id' = p_person_id::text

Handles zero-account case (person not in metadata) gracefully — returns void
without error so the delete flow continues normally.

2. GRANT

  GRANT EXECUTE ON FUNCTION delete_partner_accounts(uuid) TO authenticated;

3. TypeScript Wiring — src/pages/PeoplePage.tsx

The existing people delete handler was updated to call the RPC before
executing the people table DELETE:

  const { error: accountsError } = await supabase
    .rpc('delete_partner_accounts', { p_person_id: personId });

  if (accountsError) {
    if (accountsError.message.includes('ACCOUNTS_HAVE_ENTRIES')) {
      toast.error('لا يمكن حذف الشريك — توجد قيود محاسبية مرتبطة بحساباته.');
      return;
    }
    toast.error('حدث خطأ أثناء حذف حسابات الشريك.');
    return;
  }
  // existing people DELETE continues unchanged

Also added missing cache invalidations after successful delete:
  queryClient.invalidateQueries({ queryKey: ['people'] });
  queryClient.invalidateQueries({ queryKey: ['people-slim'] });

The people-slim invalidation was identified as missing during the resume
session (execution was interrupted mid-story; resume prompt detected and
completed the gap).

4. Implementation Note — Interrupted Execution

The original Claude Code execution was interrupted mid-way. A targeted resume
prompt was generated that: (a) ran diagnostics to identify completed vs
missing work, (b) completed only the missing piece (people-slim invalidation),
and (c) ran all verification tests. This established the resume prompt pattern
for interrupted story executions.

5. Test Results

  Test A (partner WITH journal entries) → ACCOUNTS_HAVE_ENTRIES raised ✅
  Test B (partner WITHOUT journal entries) → accounts deleted, 0 rows confirmed ✅
  Test C (random UUID) → void returned silently ✅
  UI test: Arabic error toast displayed, partner remains in list ✅

Migration File: supabase/migrations/20260612000003_delete_partner_accounts_rpc.sql
TypeScript File: src/pages/PeoplePage.tsx

Project Structure after S-087

supabase/migrations/
└── 20260612000003_delete_partner_accounts_rpc.sql   ← NEW

src/pages/
└── PeoplePage.tsx   ← UPDATED (RPC call + error guard + cache invalidation)

Commits
feat(db): add delete_partner_accounts RPC and wire UI guard (S-087)

Issues Encountered & Resolved

#	Issue	Resolution
1	Execution interrupted before TypeScript wiring was complete	Resume prompt generated; diagnostics confirmed SQL function existed; only missing piece (people-slim invalidation) was completed in the resume session
2	people-slim cache key not invalidated after successful delete	Identified in resume session; added queryClient.invalidateQueries({ queryKey: ['people-slim'] })

Final Verification

Check	Result
Migration file applied	✅ 20260612000003_delete_partner_accounts_rpc.sql
Function delete_partner_accounts(uuid) in pg_proc	✅
SECURITY DEFINER confirmed	✅
GRANT to authenticated	✅
Test A (has entries) → ACCOUNTS_HAVE_ENTRIES	✅
Test B (no entries) → accounts deleted (0 rows)	✅
Test C (random UUID) → void silently	✅
PeoplePage.tsx: RPC called before DELETE	✅
Arabic error toast displayed	✅
people + people-slim cache invalidated	✅
npx tsc --noEmit	✅ Zero errors

---

Sprint 11 — E1 Stories Complete

Infrastructure layer (S-084 through S-087) delivered:

Migration	Story	Purpose
20260611120000	S-084	Partner account auto-creation trigger
20260612000000	S-085	post_journal_entry RPC (single-source posting)
20260612000001	Hotfix	Arabic account name correction + POL-003 established
20260612000002	S-086	post_settlement_entry RPC (compound N+1 entry)
20260612000003	S-087	delete_partner_accounts RPC + UI guard

Remaining Sprint 11 stories (S-088 through S-092) are frontend-only
and documented in their respective Epic files.

Outstanding STR-002 Updates Required (identified during Sprint 11):
  - accounts.metadata jsonb column (added in S-084)
  - Expense accounts 7000–7300 added to chart of accounts (added in S-085)
  - profit_settlements.journal_entry_id column (added in S-086)
  - journal_entries.source_type CHECK extended to include 'profit_settlement' (S-086)