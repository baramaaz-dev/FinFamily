EPC-01 — Infrastructure & Setup
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 0, 1, 10, 11 & 13 — الإعداد والبنية التحتية والإتمام والمحرك المحاسبي ودورة المراجعة
Status: 🔄 In Progress (Sprint 13)
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
S-086	RPC — post_settlement_entry (Compound Settlement Entry)		✅ Done
S-087	RPC — delete_partner_accounts (Conditional Deletion + UI Guard)	✅ Done
S-092	Posting Status Indicators in UI				✅ Done
S-098	Convert Posting from Automatic to Draft (Manual Review Gate)	✅ Done
S-099	Pending Journal Review Page (/journal-review)			✅ Done
S-100	Journal Posting Interface (CFO Gate)				✅ Done
S-101	Journal Entry Reversal with Mandatory Reason			✅ Done
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

  Change 1 — Import added: PostingStatusBadge
  Change 2 — Column header added (before Actions column): transactions.columns.posting
  Change 3 — Cell added per row: <PostingStatusBadge journalEntryId={tx.journal_entry_id} />

  journal_entry_id was already present in the Transaction interface (S-026) and
  in fetchTransactions() SELECT — no data layer changes needed.

4. PropertyOwnershipPage.tsx — Changes to Both Sections

  Interface updates:
    LeasePaymentRow: journal_entry_id: string | null  ← added
    PropertyExpenseRow: journal_entry_id: string | null  ← added

  SELECT query updates:
    ['lease_payments', id] query: journal_entry_id added to SELECT
    ['property_expenses', id] query: journal_entry_id added to SELECT

  Lease payments section — column header and cell added.
  Property expenses section — column header and cell added.
  Header reuses: capital.statement.columns.postingStatus (from S-050)

5. i18n — 1 Key Added

  transactions.columns.posting: ar → 'الترحيل' / en → 'Posting'
  All other badge labels reused from S-050 capital.statement.postingStatus.*

6. Commits

  feat(ui): add posting status indicators across financial tables (S-092)

---

Issues Encountered & Resolved (S-092)

#   Issue                                   Resolution
1   journal_entry_id absent from            Added to both interfaces and SELECT queries
    PropertyOwnershipPage row interfaces
2   colSpan update not applicable           Neither page uses table-row colSpan
3   capital.statement.columns.postingStatus Reused directly — no duplication
    already existed from S-050

---

Final Verification (S-092): All checks ✅
Sprint 11 merged to main: 2026-06-12

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

============================================================================

============================================================================
Sprint 13 — Review Cycle & Manual Posting Gate (E1 Stories)
============================================================================

Sprint 13 Context

Sprint 13 converts the accounting workflow from automatic instant-posting
(Sprint 11) to a two-phase manual review cycle:
  Phase 1 (S-098): All RPCs save journal entries as 'draft' — not 'posted'.
  Phase 2 (S-099–S-101): CFO reviews, posts, and reverses entries via a
  dedicated /journal-review page.

The four E1 stories in Sprint 13 affect:
  - Supabase RPC behaviour (S-098)
  - A new review page with full CRUD on journal entry status (S-099–S-101)
  - The shared PostingStatusBadge component (updated in S-098/S-099)

Reference documents: STR-006 v1.2, POL-001 v1.0

---

S-098 — Convert Posting from Automatic to Draft (Manual Review Gate)
تحويل الترحيل من آلي إلى يدوي
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-085, S-086, S-088, S-089, S-090, S-091, S-092
Blocks: S-099 (journal review page)

---

Overview

Sprint 11 wired all financial entry points to RPCs that created journal entries
with status = 'posted' immediately on user submission. S-098 changes this so that
all new journal entries land as status = 'draft', awaiting CFO review.

Three change areas:
  1. Supabase RPC update: remove step 6 (status → 'posted') from both RPCs.
  2. Hook update: add ['journal-entries-pending'] invalidation.
  3. Badge copy: "غير مُرحَّل" → "معلّق" / "بدون قيد" across four registers.

---

What Was Built

1. Migration — supabase/migrations/20260613000004_draft_posting_mode.sql

  post_journal_entry RPC: rebuilt from scratch (original not in repo).
    Implements STR-006 §5 templates for all 4 source types.
    Step 6 (UPDATE ... SET status = 'posted') absent — entries remain 'draft'.
    Step 7 (source_table.journal_entry_id link) retained.

  post_settlement_entry RPC: copied from 20260612000002 with step 12
    (SET status = 'posted') removed.

2. Hook — src/hooks/usePostJournalEntry.ts

  Added: queryClient.invalidateQueries({ queryKey: ['journal-entries-pending'] })
  so S-099's pending review list refreshes on every new entry creation.
  No other changes.

3. Shared Badge — src/components/shared/PostingStatusBadge.tsx

  Updated to three-state logic:
    journal_entry_id IS NULL          → "بدون قيد"   (slate neutral)
    journal_entry_id IS NOT NULL      → "معلّق"       (warning #B45309 / #FEF7EC)
    (third state "مُرحَّل" prepared as stub for S-100)

  Applied across all four registers (S-092 badge locations):
    TransactionsPage · Lease payments log · Property expenses log ·
    CapitalStatementPage (replaced inline badge with shared component)

4. CapitalStatementPage.tsx

  Replaced inline badge code with <PostingStatusBadge /> — now uses the
  shared component consistently with all other three registers.

5. i18n — ar.ts / en.ts

  journal.status.draft  → 'معلّق' / 'Pending'
  journal.status.posted → 'مُرحَّل' / 'Posted'   (updated)
  journal.status.noEntry → 'بدون قيد' / 'No Entry'  (added)

---

Key Decisions

- source_table.journal_entry_id link retained (step 7) — required for badge
  rendering and S-099 source reference display.
- "معلّق" replaces "غير مُرحَّل": semantics changed from "not linked" to
  "linked but awaiting review".
- Existing 'posted' entries (from Sprint 11 test data) unaffected — S-098
  only changes behaviour for new entries created after migration.

---

Issues Encountered & Resolved (S-098)

#   Issue                                   Resolution
1   post_journal_entry original body not    Implemented from scratch per STR-006 §5
    in repo (lived only in Supabase)        and §10.1 specification
2   Arabic text in badge rendered reversed  Terminal display artifact for RTL strings.
    in Claude Code completion summary       Actual values in code confirmed correct
                                            by TypeScript 0-error check

---

Final Verification (S-098)

Check	Result
Migration 20260613000004 applied	✅
post_journal_entry: new entries status = 'draft'	✅
post_settlement_entry: settlement entries status = 'draft'	✅
source_table.journal_entry_id still written	✅
usePostJournalEntry: ['journal-entries-pending'] invalidation added	✅
PostingStatusBadge: three-state logic	✅
Badge "معلّق" in TransactionsPage	✅
Badge "معلّق" in lease payments log	✅
Badge "معلّق" in property expenses log	✅
Badge "معلّق" in CapitalStatementPage (now uses shared component)	✅
journal.status.* i18n keys updated	✅
npx tsc --noEmit	✅ Zero errors

---

S-099 — Pending Journal Review Page (/journal-review)
صفحة مراجعة القيود المعلّقة
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-098 (draft-first posting)
Blocks: S-100 (posting interface), S-101 (reversal UI)

---

Overview

Builds the pending journal review page at /journal-review — an inbox aggregating
all draft journal entries from all sources for CFO review. Read-only in this story;
posting (S-100) and reversal (S-101) added subsequently.

---

What Was Built

1. New Files (4)

  src/types/journalReview.ts
    JournalEntrySourceType union (6 values)
    PendingJournalLine interface
    PendingJournalEntry interface with derived fields:
      total_debit, total_credit, is_balanced

  src/lib/supabase/journalReview.ts
    getPendingJournalEntries(): three-step query
      Step 1: journal_entries WHERE status = 'draft'
      Step 2: journal_entry_lines batch fetch via .in('journal_entry_id', ids)
      Step 3: accounts lookup via .in('id', accountIds)
    Client-side Map assembly → PendingJournalEntry[]
    is_balanced = |total_debit - total_credit| < 0.001 && total_debit > 0

  src/hooks/useJournalReview.ts
    PENDING_ENTRIES_KEY = ['journal-entries-pending']
    usePendingJournalEntries(): staleTime = 0

  src/pages/JournalReviewPage.tsx
    Filter bar: date range (from/to) · source type Select · account search Input
    Summary strip: total count · total debit (USD) · unbalanced count (danger)
    Expandable table: React.Fragment key={entry.id} for main + detail rows
    One-at-a-time expansion (expandedId state)
    Detail panel: full journal_entry_lines with account code, class, amounts
    Disabled "ترحيل" stub with tooltip (placeholder for S-100)
    Empty state: CheckCircle icon + message
    Loading skeleton: 5 animated rows
    Client-side filtering via useMemo

2. Modified Files (5)

  src/router/routes.ts — JOURNAL_REVIEW: '/journal-review'
  src/router/index.tsx — { path: 'journal-review', element: <JournalReviewPage /> }
  src/layouts/components/navItems.ts — Clock icon nav item after journal
  src/i18n/locales/ar.ts — nav.journalReview + full journalReview.* namespace
  src/i18n/locales/en.ts — English mirror

  Additionally re-applied S-098 changes that had been lost:
    src/components/shared/PostingStatusBadge.tsx — warning amber for draft
    src/hooks/usePostJournalEntry.ts — ['journal-entries-pending'] invalidation
    src/pages/CapitalStatementPage.tsx — replaced inline badge with <PostingStatusBadge />

---

Key Decisions

- staleTime: 0 — pending queue must always reflect latest state.
- queryKey ['journal-entries-pending'] matches S-098 invalidation exactly.
- general_ledger VIEW not used here (it filters posted only); queries
  journal_entries and journal_entry_lines tables directly.
- Client-side filtering: expected volume < 100 entries at any time.
- React.Fragment with key on two-row tbody pattern (main + expanded).

---

Final Verification (S-099)

Check	Result
/journal-review renders for authenticated users	✅
Sidebar "مراجعة القيود" link with Clock icon	✅
Draft entries listed, ordered by created_at DESC	✅
Expandable rows: one at a time	✅
Filter bar: date · source type · account search	✅
Summary strip: count · debit sum · unbalanced count	✅
Empty state renders when no results	✅
"ترحيل" button visible but disabled	✅
npx tsc --noEmit	✅ Zero errors
12 files, 552 insertions	✅

---

S-100 — Journal Posting Interface (CFO Gate)
واجهة ترحيل القيود
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-099 (JournalReviewPage with disabled posting stub)
Blocks: S-101 (reversal UI — needs posted entries to reverse)

---

Overview

Activates the disabled "ترحيل" posting buttons from S-099. Adds checkbox
bulk selection and a bulk posting action bar. Posting promotes a draft
journal entry to status = 'posted' via a direct Supabase UPDATE (not RPC).

---

What Was Built

1. New Files (3)

  src/lib/supabase/journalPosting.ts
    postJournalEntry(entryId: string): Promise<void>
      Guard 1: open accounting period check (.lte/.gte on start_date/end_date)
      Guard 2: entry status = 'draft' verification
      UPDATE journal_entries SET status = 'posted'
        .eq('id', entryId).eq('status', 'draft')  ← race-condition guard

  src/hooks/useJournalPosting.ts
    usePostSingleEntry(): useMutation with toast feedback per error type:
      NO_OPEN_PERIOD → toast.error (no open period)
      ALREADY_POSTED → toast.error + invalidate pending cache
      generic        → toast.error
    postEntriesBulk(ids, onProgress): plain async function
      for…of loop (sequential, not Promise.all)
      Returns { posted: number, failed: string | null }
      Stops on first error, reports which entry failed

  src/components/ui/checkbox.tsx — Radix-based Checkbox (Shadcn API)
  src/components/ui/tooltip.tsx  — Radix Tooltip/Provider/Trigger/Content

2. Modified Files

  src/pages/JournalReviewPage.tsx
    Checkbox column in thead/tbody (header selects all balanced entries)
    Unbalanced rows: disabled checkbox + bg-[#FEF0EF] red tint
    Active "ترحيل" button with Tooltip (disabled + tooltip for unbalanced)
    Bulk action bar (appears when ≥ 1 selected): count · post · clear
    Progress indicator during bulk posting: "جارٍ الترحيل {i} من {n}…"
    useEffect: selection resets when any filter changes
    Single-entry AlertDialog (with 8-char entry ref in body)
    Bulk posting AlertDialog (with entry count in title and body)

  src/i18n/locales/ar.ts + en.ts
    journalReview.post.* (14 keys each): success/error toasts, dialog text,
    progress, selection labels

  package.json + package-lock.json
    @radix-ui/react-checkbox, @radix-ui/react-tooltip added

---

Key Decisions

- Direct UPDATE on journal_entries.status (not RPC): S-085 RPC creates new
  entries from source records; S-100 promotes already-created draft entries.
  A direct UPDATE is cleaner and more explicit.
- Double guard: period check + .eq('status','draft') on UPDATE prevents
  race conditions from simultaneous browser sessions.
- Sequential bulk (for…of not Promise.all): low volume, progress tracking,
  clear error attribution, respects Supabase rate limits.
- onInteractOutside not needed on AlertDialog: Radix AlertDialog blocks
  outside-click dismissal by design (semantic difference from Dialog).

---

Final Verification (S-100)

Check	Result
"ترحيل" enabled for balanced entries only	✅
Unbalanced entries: disabled button + red row tint	✅
Single-entry confirmation dialog with entry ref	✅
Post confirmed: entry status = 'posted' in DB	✅
Posted entry disappears from pending list	✅
general_ledger row count increases after posting	✅
Checkbox: header selects all balanced entries	✅
Bulk action bar appears when ≥ 1 selected	✅
Bulk post: sequential, progress shown, single success toast	✅
Filter change: selection resets automatically	✅
No open period: toast.error blocks posting	✅
npx tsc --noEmit	✅ Zero errors

---

S-101 — Journal Entry Reversal with Mandatory Reason
القيد العكسي مع سبب إلزامي
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-100 (entries can now reach 'posted' status)
Blocks: S-102 (Trial Balance — reversal entries appear in general_ledger)

---

Overview

Adds reversal capability to JournalReviewPage and restructures the page
into two tabs: "المعلّقة" (draft entries + posting) and "المُرحَّلة" (posted
entries + reversal). A reversal creates a mirror journal entry with swapped
debit/credit amounts and marks the original as 'reversed'.

---

What Was Built

1. Type Changes — src/types/journalReview.ts

  JournalEntrySourceType: added 'reversal' value
  PostedJournalEntry interface: same shape as PendingJournalEntry but
    status: 'posted' | 'reversed'
    is_reversed: boolean  (true if a reversal entry exists for this id)

2. New Query — src/lib/supabase/journalReview.ts (extended)

  getPostedJournalEntries(): three-step assembly + fourth reversal-detection step
    Step 4: fetch journal_entries WHERE source_type = 'reversal'
            AND source_id IN (postedIds) → build reversedSet
    Returns PostedJournalEntry[] with is_reversed computed

3. New Files (2)

  src/lib/supabase/journalReversal.ts
    reverseJournalEntry(originalId, reason): Promise<void>
      5-step sequential with manual rollback:
        1. Fetch original + verify status = 'posted'
        2. Fetch original lines
        3. Check no existing reversal (ALREADY_REVERSED guard)
        4. INSERT reversal header: source_type='reversal', status='posted'
        5. INSERT reversed lines (debit ↔ credit swapped)
           description prefix: '\u0639\u0643\u0633: ' (عكس:)
           Rollback on line insert failure: delete header
        6. UPDATE original status = 'reversed'
           Rollback on failure: delete reversal lines + header
      Reversal entries saved as status = 'posted' immediately
      (CFO performing reversal is the authorizer — no second review needed)

  src/hooks/useJournalReversal.ts
    useReverseJournalEntry(): useMutation
      onSuccess: invalidate POSTED_ENTRIES_KEY + PENDING_ENTRIES_KEY +
                 ['journal-entries'] + toast.success
      onError: per-type toast (ALREADY_REVERSED · NOT_POSTED · generic)

4. Hook Extension — src/hooks/useJournalReview.ts

  POSTED_ENTRIES_KEY = ['journal-entries-posted']
  usePostedJournalEntries(): staleTime = 60_000

5. Page Restructure — src/pages/JournalReviewPage.tsx

  Shadcn Tabs added (TabsList / TabsTrigger / TabsContent)
  Tab 1 "المعلّقة": all existing S-099/S-100 content unchanged
  Tab 2 "المُرحَّلة": posted entries table
    Same column structure as Tab 1 minus checkbox column
    Additional "الحالة" column:
      'posted'   → "مُرحَّل"  success green
      'reversed' → "معكوس"   danger red + 60% opacity row
    "عكس" button: enabled for non-reversed entries, disabled otherwise
    Reversal Dialog (not AlertDialog — requires text input + line preview):
      Warning banner (amber)
      Reason textarea: minLength 10, inline error if < 10 chars
      Swapped-lines preview table (credit shown as debit, debit as credit)
      "تأكيد العكس" button: danger red, disabled until reason ≥ 10 chars
      onInteractOutside blocked (e.preventDefault())

  Tab count badges: pending count (warning amber) · posted count (success green)
  'reversal' added to sourceLabel() map → "قيد عكسي"

6. New UI Component — src/components/ui/tabs.tsx (Radix Tabs wrapper)

7. i18n — ar.ts + en.ts
  journalReview.tabs.* (pending · posted · emptyPosted)
  journalReview.col.status
  journalReview.sourceType.reversal
  journalReview.reversal.* (12 keys: dialog, warning, reason, preview,
    buttons, badge, tooltips, toasts)
  journalReview.action.reverse

---

Key Decisions

- Reversal entries posted immediately (status = 'posted'): CFO performing
  reversal is the authorizer — draft step adds no value.
- Dialog (not AlertDialog): reversal requires user text input and a line
  preview table; AlertDialog's simple yes/no structure is insufficient.
- Manual rollback (not RPC): consistent with project convention from S-097.
  Sequential steps with explicit cleanup on each failure point.
- Unicode escapes for Arabic string literals in .ts files
  ('\u0639\u0643\u0633' = 'عكس') per POL-003 spirit.
- is_reversed detection: separate query for source_type='reversal' entries
  (not relying solely on original entry's status field) — double safety.

---

Issues Encountered & Resolved (S-101)

#   Issue                                   Resolution
1   Shadcn Tabs component missing           Created src/components/ui/tabs.tsx
                                            using Radix Tabs pattern matching
                                            existing Shadcn components

---

Final Verification (S-101)

Check	Result
Two tabs on /journal-review	✅
Tab 1 unchanged from S-100	✅
Tab 2 lists posted entries ordered by created_at DESC	✅
"عكس" enabled for non-reversed, disabled for reversed	✅
"معكوس" badge on reversed entries	✅
Reversal Dialog: warning banner + reason textarea + line preview	✅
"تأكيد العكس" disabled when reason < 10 chars	✅
Reversal creates new entry: source_type='reversal', status='posted'	✅
Lines inserted with debit ↔ credit swapped	✅
Original entry status → 'reversed'	✅
general_ledger reflects reversal entry lines	✅
Manual rollback: header cleaned up on line insert failure	✅
npx tsc --noEmit	✅ Zero errors
8 files changed	✅

============================================================================

Sprint 13 E1 Stories — In Progress

Remaining E1 stories in Sprint 13:
  S-099 ✅  S-100 ✅  S-101 ✅
  S-098 ✅ (foundation)

Non-E1 stories in Sprint 13 (documented in other EPCs):
  S-102 — Trial Balance Page (E8 — EPC-08)
  S-103 — Accounting Period Closing (E9 — EPC-09)
  S-104 — Rebuild Reports from General Ledger (E8 — EPC-08)
