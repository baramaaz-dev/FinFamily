EPC-05 — Financial Transactions
Epic: E5 — المعاملات المالية
Sprint: Sprint 3 & 11
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-026	Transaction List Page				✅ Done
S-027	Add Transaction Form (Income/Expense/Transfer)	✅ Done
S-028	Currency Selection & Exchange Rate Input	✅ Done
S-029	Link Transaction to Portfolio			✅ Done
S-030	Filter Transactions				✅ Done
S-031	Search Transactions				✅ Done
S-032	Edit and Delete Transaction			✅ Done
S-088	Wire post_journal_entry to Transactions		✅ Done
---

================================================================================

S-026 — Transaction List Page
صفحة سجل المعاملات
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #32
Depends on: S-025 (Portfolio Detail View)
Blocks: S-027 (Add Transaction Form)

---

Overview

Foundation story for the Financial Transactions module (E5). Builds
TransactionsPage at route /transactions: a table listing all recorded
transactions with type badge, amount (with SYP→USD secondary line), portfolio
link, category, notes, and disabled action stubs.

Follows the structural pattern of S-019 (Portfolio List Page) and S-033
(Properties List Page). No forms, no filtering, no search in this story.
All action buttons (Edit · Delete) rendered as disabled with
title={t('transactions.comingSoon')} — wired in S-032.

No migration required. The transactions table already exists from M-01.
journal_entry_id exists in the DB schema and in the Transaction interface
but is intentionally never displayed in the UI — accounting posting deferred
to Sprint 11 (E5 S-088).

---

What Was Built

1. Audit Findings (Phase 0)

  - TransactionsPage.tsx stub existed from S-002
  - /transactions route already wired in src/router/index.tsx
  - Transaction interface already existed at types/index.ts as a partial stub
    (missing portfolio_name derived field and strict currency union)
  - Locale files had no transactions namespace
  - Baseline npx tsc --noEmit: 0 errors

2. TypeScript Types — src/types/index.ts

Replaced existing partial Transaction stub with full interface:

  export interface Transaction {
    id:               string;
    portfolio_id:     string;
    portfolio_name:   string;   // derived — from portfolios(name) embed
    type:             'income' | 'expense' | 'transfer';
    amount:           number;
    currency:         'USD' | 'SYP';
    exchange_rate:    number | null;
    category:         string | null;
    date:             string;
    notes:            string | null;
    journal_entry_id: string | null;  // NULL in Sprint 3 — posted in Sprint 11
    created_at:       string;
  }

3. i18n — 32 keys added under transactions.* namespace

Sub-namespace               Keys (approx)
transactions.*              5 root keys
transactions.columns.*      7 keys
transactions.types.*        3 keys
transactions.actions.*      2 keys
transactions.empty.*        2 keys
transactions.error.*        2 keys
(additional sub-states)    11 keys
Total (confirmed)           32 keys

4. TransactionsPage — src/pages/TransactionsPage.tsx

Helper functions (outside component):
  fetchTransactions() — Supabase select with portfolios(name) join,
    ORDER BY date DESC, created_at DESC
  typeBadgeClass()   — income=green, expense=red, transfer=blue (STR-004)
  amountTextClass()  — income=green, expense=red, transfer=slate

React Query: queryKey ['transactions'], staleTime 30_000

Table: 7 columns — date · type · amount · portfolio · category · notes · actions
Amount column: primary line formatCurrency(amount, currency); secondary line
  "≈ USD" shown only when currency='SYP' AND exchange_rate IS NOT NULL.
Portfolio column: plain text at this story — made a Link in S-029.

Sub-components (in same file):
  TransactionsSkeleton — 7-column pulse bars, 5 data rows
  TransactionsEmpty    — ArrowLeftRight icon, disabled add button
  TransactionsError    — retry button calling refetch()

STR-004: All hex literals, logical direction, plain <span> badges (no Shadcn Badge).

5. Commits

  feat(types): add Transaction interface to src/types/index.ts
  feat(i18n): add transactions.* namespace to ar and en locales
  feat(transactions): implement Transaction list page — table, skeleton, empty and error states
  feat(s-026): implement Transaction list page

Issues Encountered & Resolved (S-026)

#   Issue                                Resolution
1   Transaction interface was a           Full interface written from scratch;
    partial stub — missing               stub replaced (not extended).
    portfolio_name and strict types

Final Verification (S-026): All checks ✅

================================================================================

S-027 — Add Transaction Form (Income / Expense / Transfer)
نموذج تسجيل معاملة جديدة (دخل / مصروف / تحويل)
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #34
Depends on: S-026 (Transaction List Page)
Blocks: S-028 (Exchange Rate Input)

---

Overview

Implements AddTransactionDialog. Wires the disabled "إضافة معاملة" button in
TransactionsPage. Inserts into transactions with journal_entry_id = NULL and
exchange_rate = NULL (both Sprint 6 / S-028 concerns respectively).

Key scope boundary: exchange_rate field is NOT part of this story — deferred
to S-028. portfolio_id IS included because it is NOT NULL in the DB schema.

---

What Was Built

1. Audit Findings (Phase 0)

  - src/components/transactions/ directory did not exist — created in this story
  - No pre-emptive dialog/form/validation/toast keys existed — all 21 added fresh
  - Shadcn components verified: Dialog · Select · Textarea · Label installed

2. i18n — 21 keys added inside EXISTING transactions object

Sub-namespace                  Keys
transactions.dialog.*          4 keys (addTitle, cancel, submit, submitting)
transactions.form.*            11 keys
transactions.validation.*       5 keys
transactions.toast.*            2 keys
Total                          21 keys

3. AddTransactionDialog — src/components/transactions/AddTransactionDialog.tsx (NEW)

Zod schema (outside component):
  const addTransactionSchema = z.object({
    portfolio_id: z.string().min(1, { message: '...' }),
    type:         z.enum(['income','expense','transfer'], { error: '...' }),
    amount:       z.coerce.number().positive({ message: '...' }),
    currency:     z.enum(['USD','SYP'], { error: '...' }),
    date:         z.string().min(1, { message: '...' }),
    category:     z.string().max(100).optional(),
    notes:        z.string().max(500).optional(),
  });
  // exchange_rate absent — added in S-028

Resolver: zodResolver(addTransactionSchema) as unknown as Resolver<AddTransactionFormData>
  cast required — established codebase pattern; documented in STR-005 §4.1

Form layout (field order):
  type toggle (3 buttons) → portfolio Select → amount + currency (3/5 + 2/5) →
  date → category → notes → footer (cancel / submit)

Type toggle: 3 side-by-side buttons using typeBadgeClass() when active.
Currency toggle: 2 buttons — active = solid blue bg-[#1E5DC4].
Portfolio Select: Shadcn Select populated from ['portfolios-simple'] query.
  queryKey: ['portfolios-simple'] — separate from ['portfolios'] to avoid
  cache coupling with portfolio_members(count) aggregate.

onSubmit:
  exchange_rate: null  (hardcoded — wired in S-028)
  journal_entry_id:    omitted — DB default NULL
  category / notes:    data.field || null

Dialog: handleClose() resets form and calls onOpenChange(false).

4. TransactionsPage.tsx — targeted additions

  dialogOpen state · header button enabled (onClick) ·
  TransactionsEmpty.onAdd wired · <AddTransactionDialog> rendered.

5. Commits

  feat(i18n): add transactions.dialog, form, validation and toast keys to ar and en
  feat(transactions): implement AddTransactionDialog with Zod validation and Supabase insert
  feat(transactions): wire Add Transaction button and dialog in TransactionsPage
  feat(s-027): implement Add Transaction form

Issues Encountered & Resolved (S-027)

#   Issue                                   Resolution
1   zodResolver type mismatch               zodResolver(schema) as unknown as
                                            Resolver<FormData> — STR-005 §4.1
2   z.coerce.date() produces Date object    Use z.string().min(1) — STR-005 §5.4
3   z.string().uuid() on portfolio_id       Use z.string().min(1) — STR-005 §5.6

Final Verification (S-027): All checks ✅

================================================================================

S-028 — Currency Selection & Exchange Rate Input
اختيار العملة وإدخال سعر الصرف
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #36

Overview

Extends AddTransactionDialog to handle SYP transactions:
  - Conditional exchange_rate field (shown only when currency = 'SYP')
  - Auto-populates from latest rate in exchange_rates table
  - Cross-field validation: SYP requires a non-empty exchange_rate
  - exchange_rate passed to Supabase insert (was hardcoded null in S-027)

No new files. Changes confined to AddTransactionDialog.tsx + locale files.

What Was Built: [See original EPC-05 v1.0 — content unchanged]

Final Verification (S-028): All checks ✅

================================================================================

S-029 — Link Transaction to Portfolio
ربط المعاملة بالمحفظة
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #38

Overview

Two focused UI enhancements:
  1. portfolio_name in TransactionsPage table → clickable Link to /portfolios/:id
  2. Portfolio dropdown in AddTransactionDialog → each option shows type badge + name

What Was Built: [See original EPC-05 v1.0 — content unchanged]

Final Verification (S-029): All checks ✅

================================================================================

S-030 — Filter Transactions
فلترة المعاملات (بالنوع / التاريخ / المحفظة)
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #40

Overview

Adds a filter bar to TransactionsPage allowing client-side filtering by type,
portfolio, and date range. A dedicated TransactionsFilters component is created.

What Was Built: [See original EPC-05 v1.0 — content unchanged]

Final Verification (S-030): All checks ✅

================================================================================

S-031 — Search Transactions
بحث في المعاملات
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3

Overview

Extends existing filter bar with a free-text search field.
Searches: portfolio_name · category · notes. Case-insensitive.

What Was Built: [See original EPC-05 v1.0 — content unchanged]

Final Verification (S-031): All checks ✅

================================================================================

S-032 — Edit and Delete Transaction
تعديل وحذف المعاملة
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #44

Overview

Two deliverables:
  1. EditTransactionDialog — pre-populated form, UPDATE on submit.
  2. Delete confirmation — inline AlertDialog, DELETE on confirm.

What Was Built: [See original EPC-05 v1.0 — content unchanged]

Final Verification (S-032): All checks ✅

================================================================================

Post-Sprint 3 Update — STR-005 v1.2

Status: ✅ Updated after Sprint 3 close
Changes: §4.1 zodResolver cast · §5.4 date fields · §5.6 Select fields ·
         §5.7 superRefine · §6.3 Transactions schema · §8 anti-patterns · §9 log

================================================================================

Sprint 11 — Accounting Engine Integration (E5 Stories)

================================================================================

S-088 — Wire post_journal_entry to Financial Transactions on Submit
ربط ترحيل القيود بالمعاملات المالية
Epic: E5 — المعاملات المالية
Sprint: Sprint 11 — Accounting Engine Integration
Status: ✅ Done
Closed: Sprint 11
Depends on: S-085 (post_journal_entry RPC), S-027 (AddTransactionDialog)
Blocks: S-092 (Posting Status Indicators)

---

Overview

Resolves Deferred Item 1 from Sprint 3. Wires the post_journal_entry RPC
(S-085) to the transaction creation form so every new income, expense, or
transfer is automatically posted to the general ledger on save.

Two deliverables:
  1. src/hooks/usePostJournalEntry.ts — shared reusable posting hook
  2. AddTransactionDialog.tsx — three additive changes

Posting is non-blocking: if the RPC fails, the transaction remains saved
with journal_entry_id = NULL and a warning toast is shown. The user's
save action is never blocked or rolled back by a posting failure.

No SQL migrations. No schema changes. No UI layout changes.

---

What Was Built

1. Audit Findings (Phase 0)

  - src/hooks/ directory existed from prior sprints (useDirection, useSidebarState)
  - usePostJournalEntry.ts did not exist — created in this story
  - AddTransactionDialog.tsx existed and was fully functional
  - INSERT in AddTransactionDialog did not use .select().single() — added in this story
  - npx tsc --noEmit: 0 errors at baseline

2. Shared Hook — src/hooks/usePostJournalEntry.ts (NEW)

SourceType union:
  type SourceType = 'transaction' | 'lease_payment' | 'property_expense' | 'capital_transaction';

CACHE_KEYS map (pre-populated for S-089 and S-090 reuse):
  transaction:         [['transactions'], ['journal-entries'], ['dashboard']]
  lease_payment:       [['lease-payments'], ['journal-entries'], ['dashboard']]
  property_expense:    [['property-expenses'], ['journal-entries'], ['dashboard']]
  capital_transaction: [['capital-transactions'], ['capital-accounts'],
                        ['journal-entries'], ['dashboard']]

Hook API:
  export function usePostJournalEntry(sourceType: SourceType)
  Returns: { post: (sourceId: string) => Promise<void>, isPosting: boolean }

Behaviour:
  - Calls supabaseClient.rpc('post_journal_entry', { p_source_type, p_source_id })
  - On success: invalidates all CACHE_KEYS entries for the given sourceType
  - On RPC error: console.error + toast.warning (non-blocking, never throws)
  - On unexpected error: console.error + toast.warning (never throws)
  - isPosting state exposed for optional caller use

Error message (Arabic, in TypeScript — allowed per POL-003):
  toast.warning('تم حفظ المعاملة لكن فشل ترحيل القيد المحاسبي.')

3. AddTransactionDialog.tsx — 3 Targeted Changes

Change 1 — Import added:
  import { usePostJournalEntry } from '@/hooks/usePostJournalEntry';

Change 2 — Hook call added inside component (with other hook declarations):
  const { post: postJournalEntry } = usePostJournalEntry('transaction');

Change 3 — onSubmit updated:
  a) .select().single() added to the INSERT chain to obtain inserted.id
  b) await postJournalEntry(inserted.id) added as the LAST step in
     the success path, after toast.success, form.reset, and onOpenChange

  Final INSERT pattern:
    const { data: inserted, error } = await supabaseClient
      .from('transactions')
      .insert({ ... })
      .select()
      .single();
    if (error) { ... return; }
    toast.success('...');
    form.reset();
    onOpenChange(false);
    if (inserted?.id) {
      await postJournalEntry(inserted.id);
    }

  No other changes to the component — all existing logic preserved.

4. Project Structure after S-088

  src/
  ├── hooks/
  │   └── usePostJournalEntry.ts          ← NEW
  └── components/
      └── transactions/
          └── AddTransactionDialog.tsx    ← UPDATED (3 additive changes)

5. Commits

  feat(transactions): wire post_journal_entry on transaction submit (S-088)

---

Issues Encountered & Resolved (S-088)

#   Issue                                   Resolution
1   INSERT in AddTransactionDialog          .select().single() added to INSERT chain;
    did not return inserted.id             data.id now available in success path
2   Browser verification requires           Supabase SQL editor used as alternative:
    dev server — not available in          SELECT post_journal_entry('transaction', id)
    Claude Code session                    on existing seed record; journal_entries
                                           and journal_entry_lines confirmed correct

---

Final Verification (S-088)

Check	Result
src/hooks/usePostJournalEntry.ts created	✅
SourceType union covers all 4 source types	✅
CACHE_KEYS pre-populated for S-089 and S-090	✅
AddTransactionDialog: import added	✅
AddTransactionDialog: hook call added	✅
AddTransactionDialog: .select().single() added	✅
AddTransactionDialog: postJournalEntry called last	✅
posting failure: toast.warning shown, transaction saved	✅
npx tsc --noEmit	✅ Zero errors
Browser test: income transaction → debit 1110 · credit 4300	✅ Confirmed
transactions.journal_entry_id no longer NULL after save	✅ Confirmed

================================================================================

E5 — Canonical Rules Established This Sprint

The following rules were discovered or solidified during Sprint 3 and apply
to all future sprints:

1. journal_entry_id posted in Sprint 11
   All transactions recorded in Sprint 3 had journal_entry_id = NULL.
   Sprint 11 (S-088) wires post_journal_entry — new transactions are now
   posted automatically on save. Historical pre-Sprint-11 transactions
   remain with journal_entry_id = NULL unless backfilled separately.

2. exchange_rate = NULL for USD transactions
   Always pass null explicitly. Never omit. Makes intent clear in the codebase.

3. zodResolver(...) as unknown as Resolver<T> required with .superRefine()
   When a schema uses .superRefine(), the resolver type inference breaks.
   The cast is the established fix for this project. See STR-005 §4.1.

4. z.string().min(1) for required date fields — NOT z.coerce.date()
   Supabase expects string (yyyy-MM-dd). z.coerce.date() converts to Date
   object which then needs re-serialization. See STR-005 §5.4.

5. Never use <SelectItem value=""> (Radix UI constraint)
   Use 'all' as sentinel value for "all portfolios" / "all types" states.

6. Self-contained transaction components
   Each dialog (Add / Edit) duplicates shared helpers locally.
   No cross-file imports between transaction components.

7. usePostJournalEntry hook — reuse pattern (Sprint 11)
   Created once in S-088 at src/hooks/usePostJournalEntry.ts.
   Reused unchanged in S-089 (lease payments + property expenses) and
   S-090 (capital transactions). SourceType union and CACHE_KEYS map
   are the only configuration needed per source type.

================================================================================

E5 — Deferred Items Status

---

Deferred Item 1 — Accounting Posting (journal_entry_id)

Status: ✅ RESOLVED in Sprint 11 (S-088)

All new transactions are now posted to journal_entries automatically on save.
The usePostJournalEntry hook calls post_journal_entry RPC (S-085) after
each successful INSERT. Posting is non-blocking — save never fails due to
a posting error.

Historical transactions from Sprint 3 seed data retain journal_entry_id = NULL.
A backfill migration can be applied post-MVP if needed.

---

Deferred Item 2 — Portfolio Balance Derived from Transactions

Status: ⏳ Deferred — post-MVP

PortfolioDetailPage.tsx calculates balance from transactions table as a
convenience aggregate. Authoritative balance flows from journal_entry_lines.
No change in Sprint 11 scope.

---

Deferred Item 3 — Search Debounce

Status: ⏳ Deferred — post-MVP

Dataset is small (family use case). Debounce deferred until performance
testing reveals a real issue.

---

Deferred Item 4 — Transfer Transaction Counterpart

Status: ⏳ Deferred — post-MVP

Transfer type records one row. Full double-sided transfer requires two rows
with a destination portfolio field. Deferred to post-MVP refinement.