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
S-092	Posting Status Indicators in UI				✅ Done
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
[Content unchanged — see git history]

---
S-002 through S-008
Status: ✅ Done
Closed: Sprint 0–1
[Content unchanged — see git history]

---
S-075 through S-082
Status: ✅ Done
Closed: Sprint 10
[Content unchanged — see git history]

---

============================================================================
Sprint 11 — Accounting Engine Integration
============================================================================

S-084 — Auto-create Partner Ledger Accounts on people INSERT
Status: ✅ Done
Closed: Sprint 11
[Content unchanged from previous EPC-01 version — see git history]

Final Verification (S-084): All checks ✅

---

S-085 — RPC — post_journal_entry (Single-Source Posting)
Status: ✅ Done
Closed: Sprint 11
[Content unchanged from previous EPC-01 version — see git history]

Final Verification (S-085): All checks ✅

---

S-086 — RPC — post_settlement_entry (Compound Settlement Entry)
Status: ✅ Done
Closed: Sprint 11
[Content unchanged from previous EPC-01 version — see git history]

Final Verification (S-086): All checks ✅

---

S-087 — RPC — delete_partner_accounts (Conditional Deletion + UI Guard)
Status: ✅ Done
Closed: Sprint 11
[Content unchanged from previous EPC-01 version — see git history]

Final Verification (S-087): All checks ✅

---

S-092 — Posting Status Indicators in UI
مؤشرات حالة الترحيل في الواجهة
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 11 — Accounting Engine Integration (Final Story)
Status: ✅ Done
Closed: Sprint 11
Depends on: S-088, S-089, S-090, S-091 (posting infrastructure complete),
            S-050 (CapitalStatementPage posting badge — pre-existing)
Blocks: Sprint 11 merge → main

---

Overview

Final story of Sprint 11. Creates a shared PostingStatusBadge component and
applies it to three financial record lists, making journal entry posting status
visible throughout the UI.

The indicator derives from journal_entry_id:
  IS NOT NULL → مُرحَّل (success green)
  IS NULL     → غير مُرحَّل (neutral gray)

Note: CapitalStatementPage already had a posting status column from S-050 (Sprint 6).
That implementation was not touched — the shared component was not retroactively
applied to it. All new badge applications use the shared component.

No SQL migrations. No schema changes.

---

What Was Built

1. Audit Findings (Phase 0)

  - capital.statement.postingStatus.posted and .unposted keys: already exist from S-050 — REUSED
  - capital.statement.columns.postingStatus key: already exists from S-050 — REUSED for
    column headers in PropertyOwnershipPage
  - transactions.columns.posting key: did not exist — ADDED
  - src/components/shared/ directory: did not exist — created
  - TransactionsPage: journal_entry_id present in Transaction interface (S-026)
    and in SELECT query — no change needed
  - PropertyOwnershipPage: journal_entry_id absent from LeasePaymentRow and
    PropertyExpenseRow interfaces and from both SELECT queries — added in this story
  - colSpan values: neither file uses table-row colSpan — TransactionsPage uses
    div-based skeleton; PropertyOwnershipPage uses plain paragraphs for empty states.
    No colSpan changes required.
  - npx tsc --noEmit: 0 errors at baseline

2. Shared Component — src/components/shared/PostingStatusBadge.tsx (NEW)

  Props: { journalEntryId: string | null }

  Rendering:
    IS NOT NULL → bg-[#EBF5F0] text-[#1A7D4F] — "مُرحَّل"  (success-50 · success-400)
    IS NULL     → bg-[#F1F5F9] text-[#94A3B8] — "غير مُرحَّل" (slate-100 · slate-400)

  i18n: reuses capital.statement.postingStatus.posted / .unposted from S-050.
  Colors: STR-004 hex values only — no Tailwind color names.

3. TransactionsPage.tsx — 3 Targeted Changes

File: src/pages/TransactionsPage.tsx

Change 1 — Import added:
  import { PostingStatusBadge } from '@/components/shared/PostingStatusBadge';

Change 2 — Column header added (before Actions column):
  <TableHead className="text-center">{t('transactions.columns.posting')}</TableHead>

Change 3 — Cell added per row (before Actions cell):
  <TableCell className="text-center">
    <PostingStatusBadge journalEntryId={tx.journal_entry_id} />
  </TableCell>

journal_entry_id was already present in the Transaction interface (S-026) and
in fetchTransactions() SELECT — no data layer changes needed.

4. PropertyOwnershipPage.tsx — Changes to Both Sections

File: src/pages/PropertyOwnershipPage.tsx

Interface updates:
  LeasePaymentRow: journal_entry_id: string | null  ← added
  PropertyExpenseRow: journal_entry_id: string | null  ← added

SELECT query updates:
  ['lease_payments', id] query: journal_entry_id added to SELECT
  ['property_expenses', id] query: journal_entry_id added to SELECT

Import added:
  import { PostingStatusBadge } from '@/components/shared/PostingStatusBadge';

Lease payments section — column header and cell added:
  Header: {t('capital.statement.columns.postingStatus')}  (reused from S-050)
  Cell: <PostingStatusBadge journalEntryId={payment.journal_entry_id} />

Property expenses section — column header and cell added:
  Header: {t('capital.statement.columns.postingStatus')}  (reused from S-050)
  Cell: <PostingStatusBadge journalEntryId={expense.journal_entry_id} />

5. i18n — 1 Key Added

  transactions.columns.posting added to both locale files:
  ar.ts: 'الترحيل'
  en.ts: 'Posting'

  All other badge labels reused from S-050 capital.statement.postingStatus.*

6. Project Structure after S-092

  src/
  ├── components/
  │   └── shared/
  │       └── PostingStatusBadge.tsx        ← NEW
  ├── pages/
  │   ├── TransactionsPage.tsx              ← UPDATED (import + header + cell)
  │   └── PropertyOwnershipPage.tsx         ← UPDATED (interfaces + queries + header + cell ×2)
  └── i18n/locales/
      ├── ar.ts                             ← UPDATED (transactions.columns.posting)
      └── en.ts                             ← UPDATED (transactions.columns.posting)

7. Commits

  feat(ui): add posting status indicators across financial tables (S-092)

---

Issues Encountered & Resolved (S-092)

#   Issue                                   Resolution
1   journal_entry_id absent from            Added to both interfaces (LeasePaymentRow,
    PropertyOwnershipPage row interfaces    PropertyExpenseRow) and both SELECT queries
    and SELECT queries
2   colSpan update expected by prompt       Neither TransactionsPage nor
    but not applicable                      PropertyOwnershipPage uses table-row
                                            colSpan — div/paragraph empty states.
                                            No colSpan changes needed.
3   capital.statement.columns.postingStatus Reused directly — no duplication
    already existed from S-050

---

Final Verification (S-092)

Check	Result
src/components/shared/PostingStatusBadge.tsx created	✅
STR-004 hex colors in badge	✅ success-50/400 and slate-100/400
TransactionsPage: import added	✅
TransactionsPage: Posting column header added	✅
TransactionsPage: PostingStatusBadge per row	✅
PropertyOwnershipPage: LeasePaymentRow.journal_entry_id added	✅
PropertyOwnershipPage: PropertyExpenseRow.journal_entry_id added	✅
PropertyOwnershipPage: lease payments SELECT updated	✅
PropertyOwnershipPage: property expenses SELECT updated	✅
PropertyOwnershipPage: badge in payments table	✅
PropertyOwnershipPage: badge in expenses table	✅
transactions.columns.posting key in ar.ts + en.ts	✅
i18n keys reused from S-050	✅ postingStatus.* + columns.postingStatus
CapitalStatementPage untouched	✅
npx tsc --noEmit	✅ Zero errors
npm run build	✅ Success

============================================================================

Sprint 11 — Complete ✅

All 9 stories delivered across E1, E4, E5, E6:

Story   Epic  Layer       Deliverable
------  ----  ----------  ---------------------------------------------------
S-084   E1    Database    Partner account auto-creation trigger + backfill
S-085   E1    Database    post_journal_entry RPC (4 source types, 11 sub-types)
S-086   E1    Database    post_settlement_entry RPC (compound N+1 entry)
S-087   E1    Database    delete_partner_accounts RPC + PeoplePage UI guard
S-088   E5    Frontend    Posting wired to financial transactions
S-089   E4    Frontend    Posting wired to lease payments + property expenses
S-090   E6    Frontend    Posting wired to capital transactions
S-091   E6    Frontend    Compound posting wired to settlement confirmation
S-092   E1    Frontend    Posting status badges across all financial tables

Migrations delivered:
  20260611120000  S-084   Partner account trigger
  20260612000000  S-085   post_journal_entry RPC
  20260612000001  Hotfix  Arabic account names + POL-003
  20260612000002  S-086   post_settlement_entry RPC
  20260612000003  S-087   delete_partner_accounts RPC
  20260612000004  Hotfix  Partner account code formula fix (MAX+1)

Outstanding STR-002 Updates Required (identified during Sprint 11):
  - accounts.metadata jsonb column (added in S-084)
  - Expense accounts 7000–7300 (added in S-085)
  - profit_settlements.journal_entry_id column (added in S-086)
  - journal_entries.source_type CHECK extended (added in S-086)

Sprint 11 merged to main: 2026-06-12