EPC-09 — Settings & Exchange Rates
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5 & 13
Status: 🔄 In Progress (Sprint 13)

---

Stories Overview

Story   Title                                          Status
------  -----------------------------------------------  -------
S-044   Exchange Rate Management Page                  ✅ Done
S-045   Add Exchange Rate Form                         ✅ Done
S-046   Exchange Rate History View                     ✅ Done
S-047   Auto-fetch Latest Rate in Forms                ✅ Done
S-103   Accounting Period Closing                      ✅ Done

---

================================================================================

S-044 — Exchange Rate Management Page
صفحة إدارة أسعار الصرف
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5
Status: ✅ Done
Closed: Sprint 5
Depends on: S-032 (Edit and Delete Transaction — Sprint 3 closed)
Blocks    : S-045 (Add Exchange Rate Form)

---

Overview

Foundation story for Epic E9. Builds ExchangeRatesPage at route
/settings/exchange-rates: a table listing all recorded SYP/USD exchange
rates ordered by date descending, with the most recent rate visually
distinguished by a "الأحدث" badge.

Follows the structural pattern of S-015 (People List Page), S-026
(Transaction List Page), and S-033 (Properties List Page). No forms,
no mutations in this story — those are S-045 and S-046. All action
buttons (Edit · Delete) rendered as disabled with
title={t('exchangeRates.actions.comingSoon')} — wired in S-046.

No migration required. The exchange_rates table already exists from
Sprint 1 (M-01) and RLS is already applied (verified in S-007,
RLS-POLICY-MATRIX.md row 5 — Pattern ب, 4 separate policies).

Seed data already present: 3 rows (2026-04-01 @ 13,500 · 2026-05-01 @
13,750 · 2026-06-01 @ 14,000). The 2026-06-01 row renders with the
"الأحدث" badge.

---

What Was Built

1. Audit Findings (Phase 0)

  - ExchangeRatesPage.tsx stub existed from S-002
  - /settings/exchange-rates route already wired in src/router/index.tsx
  - ExchangeRate interface already existed in src/types/index.ts —
    Phase 1 was a no-op. Interface contents verified to match DB schema.
  - settings.people / settings.exchangeRates i18n keys: already present
    in both locale files — left untouched.
  - SettingsPage.tsx: no sub-nav existed — Case C applied (full NavLink
    sub-nav added from scratch).
  - supabaseClient import path confirmed as @/lib/supabase
    (not @/lib/supabaseClient — applies to all E9 stories)
  - Baseline npx tsc --noEmit: 0 errors

---

2. i18n — 16 keys added under exchangeRates.* namespace

Sub-namespace               Keys
--------------------------  --------------------------------------------------
exchangeRates (root)        pageTitle · pageSubtitle · addRate
                            latestBadge · rateUnit
exchangeRates.columns       date · rate · notes · actions
exchangeRates.actions       edit · delete · comingSoon
exchangeRates.empty         title · subtitle
exchangeRates.error         title · retry
Total                       16 keys

settings.people and settings.exchangeRates keys: pre-existing — no changes.

---

3. SettingsPage.tsx — NavLink sub-nav added (Case C)

NavLink-based sub-nav bar added above the page content area:
  "إدارة الأشخاص"  → /settings/people
  "أسعار الصرف"    → /settings/exchange-rates

Active state  : border-[#1E5DC4] text-[#1E5DC4]   (STR-004 primary-400)
Inactive state: border-transparent text-[#475569]   (STR-004 slate-600)

---

4. ExchangeRatesPage — src/pages/ExchangeRatesPage.tsx

Full replacement of S-002 stub.
React Query: queryKey ['exchange-rates'], staleTime 30_000
Table: 4 columns — date · rate · notes · actions
Rate column: font-mono tabular-nums · "الأحدث" badge on first row
  plain <span> bg-[#EBF5F0] text-[#1A7D4F]  (STR-004 success)
Sub-components (in same file):
  ExchangeRatesSkeleton · ExchangeRatesEmpty · ExchangeRatesError

---

5. Commits

feat(i18n): add exchangeRates.* namespace to ar and en locales
feat(settings): add settings sub-nav for people and exchange-rates pages
feat(exchange-rates): implement ExchangeRatesPage — table, skeleton, empty and error states

---

Issues Encountered & Resolved (S-044)

#   Issue                                   Resolution
--  --------------------------------------  ----------------------------------------
1   ExchangeRate interface already existed  Phase 1 was a no-op. Verified fields
    in types/index.ts as stub               match DB schema. No changes made.
2   supabaseClient import path in prompt    Correct path @/lib/supabase confirmed
    specified as @/lib/supabaseClient       via Phase 0. Applies to all E9 stories.

---

Final Verification (S-044): All checks ✅

================================================================================

S-045 — Add Exchange Rate Form
نموذج إضافة سعر صرف جديد
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5
Status: ✅ Done
Closed: Sprint 5
Depends on: S-044 (Exchange Rate Management Page)
Blocks    : S-046 (Exchange Rate History View)

---

Overview

Implements AddExchangeRateDialog and wires the "إضافة سعر جديد" button.
Three-field form: date · rate (SYP per 1 USD) · notes.
On success invalidates ['exchange-rates'] AND ['latest-exchange-rate'].

---

What Was Built

1. Audit Findings (Phase 0)

  - Header button disabled with comingSoon title ✓
  - ExchangeRatesEmpty accepts onAdd prop ✓
  - queryKey ['latest-exchange-rate'] confirmed in AddTransactionDialog ✓
  - exchangeRates.* namespace present; no dialog/form/validation/toast yet ✓
  - src/components/exchange-rates/ did not exist — created ✓
  - Baseline: 0 TypeScript errors ✓

---

2. i18n — 15 keys added inside EXISTING exchangeRates object

Sub-namespace                  Keys
-----------------------------  -----------------------------------------------
exchangeRates.dialog           addTitle · cancel · submit · submitting
exchangeRates.form             date · rate · ratePlaceholder · rateHint
                               notes · notesPlaceholder
exchangeRates.validation       dateRequired · ratePositive · notesTooLong
exchangeRates.toast            addSuccess · addError
Total                          15 keys

---

3. AddExchangeRateDialog — src/components/exchange-rates/AddExchangeRateDialog.tsx (NEW)

const addExchangeRateSchema = z.object({
  date:  z.string().min(1, { message: 'exchangeRates.validation.dateRequired' }),
  rate:  z.coerce.number().positive({ message: 'exchangeRates.validation.ratePositive' }),
  notes: z.string().max(500, { message: 'exchangeRates.validation.notesTooLong' }).optional(),
});
// cast required: z.coerce.number() present (STR-005 §4.1 v1.3)
resolver: zodResolver(addExchangeRateSchema) as unknown as Resolver<AddExchangeRateFormData>

defaultValues: { date: '', rate: '' as unknown as number, notes: '' }
  rate defaults to '' so input renders blank (not 0) on open.

onSubmit: insert → invalidate ['exchange-rates'] + ['latest-exchange-rate']
onInteractOutside: e.preventDefault()

---

4. Commits

feat(i18n): add exchangeRates dialog, form, validation and toast keys
feat(exchange-rates): implement AddExchangeRateDialog with Zod validation and Supabase insert
feat(exchange-rates): wire Add Rate button and dialog in ExchangeRatesPage
feat(s-045): implement Add Exchange Rate form

---

Issues Encountered & Resolved (S-045)

#   Issue                                   Resolution
--  --------------------------------------  ----------------------------------------
1   Spec stated no Resolver<T> cast needed  Cast IS required. z.coerce.number()
    (no .superRefine()), but TypeScript      alone breaks zodResolver type inference.
    errors appeared without it.             STR-005 §4.1 updated to v1.3 to document
                                             both triggers: z.coerce.number() and
                                             .superRefine().

---

Final Verification (S-045): All checks ✅

================================================================================

Post-Story Update — STR-005 v1.3
Status: ✅ Applied (2026-06-08)

§4.1 corrected: Resolver<T> cast is required when schema contains
z.coerce.number() OR .superRefine() — either triggers the incompatibility.
Prior §4.1 only documented .superRefine() as the trigger.
File updated, committed: docs(str-005): v1.3 — extend Resolver cast rule
to include z.coerce.number()

================================================================================

S-046 — Exchange Rate History View
عرض سجل أسعار الصرف (تعديل وحذف)
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5
Status: ✅ Done
Closed: Sprint 5
Depends on: S-045 (Add Exchange Rate Form)
Blocks    : S-047 (Auto-fetch Latest Rate in Forms)

---

Overview

Completes CRUD for exchange_rates by wiring the disabled Edit and Delete
action buttons from S-044. Mirrors S-032 (Edit and Delete Transaction).
Both mutations invalidate ['exchange-rates'] AND ['latest-exchange-rate'].

---

What Was Built

1. Audit Findings (Phase 0)

  - Edit + Delete buttons confirmed disabled with comingSoon title ✓
  - rates array, dialogOpen, AddExchangeRateDialog all present from S-045 ✓
  - alert-dialog.tsx already installed ✓
  - Baseline: 0 TypeScript errors ✓

---

2. i18n — 11 keys added inside EXISTING exchangeRates object

Sub-namespace                  Keys
-----------------------------  -----------------------------------------------
exchangeRates.dialog (append)  editTitle · updateSubmit · updating
                               deleteTitle · deleteDescription · deleteConfirm
                               deleteCancel
exchangeRates.toast (append)   updateSuccess · updateError
                               deleteSuccess · deleteError
Total                          11 keys

deleteDescription uses {rate} token — resolved at call site via .replace().

---

3. EditExchangeRateDialog — src/components/exchange-rates/EditExchangeRateDialog.tsx (NEW)

Mirrors AddExchangeRateDialog: same schema, same cast, same field layout.
open derived from exchangeRate !== null (not a separate boolean prop).

useEffect pre-populate:
  if (exchangeRate) reset({ date, rate, notes: notes ?? '' })

handleClose():
  Resets to ORIGINAL values (not empty defaults) — project rule for all
  edit dialogs. onOpenChange(false).

onSubmit: .update().eq('id', id)
  → invalidate ['exchange-rates'] + ['latest-exchange-rate']
onInteractOutside: e.preventDefault()

---

4. ExchangeRatesPage.tsx — targeted additions

New state: selectedRate · deleteRateId · isDeleting (all before early returns)
Edit button  → onClick(() => setSelectedRate(rate))
Delete button → onClick(() => setDeleteRateId(rate.id))
handleDeleteConfirm: delete → dual invalidation → toast
AlertDialog: {rate} token replaced via .replace() at call site
isDeleting disables both Cancel and Confirm during in-flight request.

---

5. Commits

feat(i18n): add exchangeRates dialog edit/delete and toast update/delete keys
feat(exchange-rates): implement EditExchangeRateDialog with pre-populated form and UPDATE logic
feat(exchange-rates): wire Edit/Delete buttons and AlertDialog in ExchangeRatesPage
feat(s-046): implement exchange rate edit and delete

---

Issues Encountered & Resolved (S-046)

None. Implementation matched spec exactly.

---

Final Verification (S-046): All checks ✅

================================================================================

S-047 — Auto-fetch Latest Rate in Forms
جلب آخر سعر صرف تلقائياً في النماذج
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5
Status: ✅ Done
Closed: Sprint 5
Depends on: S-046 (Exchange Rate History View)
Blocks    : Sprint 5 merge → main

---

Overview

Extends the auto-fetch pattern from AddTransactionDialog (S-028) to the
two E4 forms that had SYP exchange_rate fields but required manual entry:
  - RecordLeasePaymentDialog (S-040)
  - AddPropertyExpenseDialog (S-041)

AddTransactionDialog and EditTransactionDialog are NOT modified — their
auto-fetch was already functional. Verification only.

All three dialogs now share queryKey ['latest-exchange-rate'], so any
mutation in ExchangeRatesPage (S-045/S-046) invalidates all three
auto-fills simultaneously.

---

What Was Built

1. Audit Findings (Phase 0)

  - Both files use watchedCurrency = watch('currency') — same variable name
  - RecordLeasePaymentDialog: one existing useEffect with deps [open, lease.id]
    — left untouched; new auto-fill useEffect added separately
  - AddPropertyExpenseDialog: had NO useEffect and NO useEffect import
    — both added fresh
  - supabaseClient from @/lib/supabase confirmed in both files ✓
  - setValue already destructured in both files ✓
  - exchangeRateHint keys absent in both namespaces ✓
  - Baseline: 0 TypeScript errors ✓

---

2. i18n — 2 keys added

  properties.leases.payment.form.exchangeRateHint
    → "سعر آخر تحديث: {rate} ل.س / دولار — يمكنك تعديله"

  properties.expenses.form.exchangeRateHint
    → "سعر آخر تحديث: {rate} ل.س / دولار — يمكنك تعديله"

{rate} resolved at render: .replace('{rate}', Number(latestRate).toLocaleString('ar-SA'))
Fallback when latestRate is null: t('exchangeRates.form.rateHint')

---

3. RecordLeasePaymentDialog — 4 targeted additions

  a. fetchLatestExchangeRate() added outside component (above interface LeaseRow)
     — exact copy from AddTransactionDialog canonical source.
  b. useQuery(['latest-exchange-rate'], staleTime: 5 min) added after
     portfolios query.
  c. New useEffect (separate from existing [open, lease.id] hook):
       if SYP + latestRate → setValue('exchange_rate', String(latestRate))
       if USD → setValue('exchange_rate', '')
  d. Hint <p> added below Input — resolves {rate} via .replace().

---

4. AddPropertyExpenseDialog — same 4 additions

  a. fetchLatestExchangeRate() outside component.
  b. useQuery(['latest-exchange-rate']).
  c. New useEffect — same logic (watchedCurrency same variable name).
     useEffect import also added (was absent from this file).
  d. Hint <p> using properties.expenses.form.exchangeRateHint.

Self-contained per file — no shared utility created (E5 Canonical Rule 6).

---

5. Commits

feat(i18n): add exchangeRateHint keys to leases.payment.form and expenses.form
feat(properties): add latest exchange rate auto-fetch to RecordLeasePaymentDialog
feat(properties): add latest exchange rate auto-fetch to AddPropertyExpenseDialog
feat(s-047): auto-fetch latest exchange rate in lease payment and expense forms

---

Issues Encountered & Resolved (S-047)

#   Issue                                   Resolution
--  --------------------------------------  ----------------------------------------
1   AddPropertyExpenseDialog had no         useEffect import added alongside the
    useEffect and no useEffect import       new auto-fill hook. Phase 0 audit caught
    (unlike all other dialogs)              this before writing code.

---

Final Verification (S-047): All checks ✅

================================================================================

E9 — Canonical Rules Established in Sprint 5

1. supabaseClient import path: @/lib/supabase
   NOT @/lib/supabaseClient — confirmed in S-044 Phase 0. All E9 prompts
   used this path.

2. ExchangeRate interface: pre-exists in src/types/index.ts
   Created as stub before Sprint 5. Do not re-declare.

3. queryKey ['exchange-rates'] — ExchangeRatesPage list
   queryKey ['latest-exchange-rate'] — auto-fill in all SYP forms
   Dual invalidation required on every mutation (insert / update / delete).
   Missing ['latest-exchange-rate'] is a silent bug — no TypeScript error,
   but stale rate displayed for up to 5 minutes in all three dialogs.

4. Resolver<T> cast required when schema uses z.coerce.number() OR .superRefine()
   Confirmed in S-045 (z.coerce.number() alone, no .superRefine()).
   STR-005 updated to v1.3. All numeric forms in future sprints need the cast.

5. Edit dialog handleClose() resets to ORIGINAL values, not empty defaults.
   Established in S-032 (E5), confirmed in S-046 EditExchangeRateDialog.

6. Self-contained dialog pattern (E5 Canonical Rule 6).
   fetchLatestExchangeRate() duplicated locally in each dialog.
   No shared utility file — consistent with all other dialogs in the project.

7. AddPropertyExpenseDialog had no useEffect before S-047.
   Future stories touching this file should not assume useEffect exists.

================================================================================

E9 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — Exchange Rate Trend Chart

A sparkline or small line chart showing SYP/USD rate history on the
ExchangeRatesPage would provide visual context for rate trends.

Scope: Recharts LineChart, data from ['exchange-rates'] cache (already warm),
no new Supabase query required.
Deferred: post-MVP; the table view is sufficient for MVP data-entry use.

Deferred Item 2 — Duplicate Date Warning

Multiple exchange rates per day are permitted by the DB schema (no UNIQUE
constraint on date). Adding a soft warning when a user inserts a rate for
a date that already has an entry would prevent accidental duplicates.

Scope: check rates.some(r => r.date === data.date) in AddExchangeRateDialog
onSubmit before insert; show a Shadcn Alert or toast warning.
Deferred: low frequency issue for a family-use application.

================================================================================

============================================================================
Sprint 13 — Period Closing (E9 Story)
============================================================================

S-103 — Accounting Period Closing (إقفال الفترة المحاسبية)
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-102 (Trial Balance — period must be balanced before closing)
            S-100 (posting interface — no pending drafts allowed before closing)
            S-083 (AccountsPage — account 3300 must exist)
Blocks: S-104 (Rebuild Reports from GL — closed periods feed historical data)

---

Overview

Implements three-state accounting period lifecycle: open → closed → locked.

  open   : normal operations — posting, reversals, new entries allowed
  closed : soft close — no new posting; reports still readable; reversible
  locked : hard lock — irreversible; triggers automatic closing entries
           transferring revenue/expense balances to retained earnings (3300)

---

What Was Built

1. Migration — supabase/migrations/20260614000001_period_closing_columns.sql

  Added to accounting_periods table:
    closed_at          timestamptz  NULL
    locked_at          timestamptz  NULL
    closing_entry_id   uuid         NULL  REFERENCES journal_entries(id)

  Extended journal_entries source_type CHECK constraint:
    Dropped existing CHECK constraint, re-added to include all values:
    'transaction' | 'lease_payment' | 'property_expense' |
    'capital_transaction' | 'settlement' | 'manual' | 'reversal' | 'closing'

2. Type Update — src/types/index.ts

  AccountingPeriod interface extended:
    closed_at?:          string | null
    locked_at?:          string | null
    closing_entry_id?:   string | null

3. Supabase Helpers — src/lib/supabase/periodClosing.ts (NEW)

  getPendingDraftCount(startDate, endDate): Promise<number>
    Counts journal_entries WHERE status = 'draft' AND entry_date in range.
    Blocks period closing if count > 0.

  closePeriod(periodId): Promise<void>
    UPDATE status = 'closed', closed_at = NOW()
    .eq('status', 'open') race-condition guard.

  reopenPeriod(periodId): Promise<void>
    UPDATE status = 'open', closed_at = NULL
    .eq('status', 'closed') race-condition guard.

  hasOtherOpenPeriod(excludePeriodId): Promise<boolean>
    Prevents reopening when another period is already open.

  lockPeriod(periodId, periodName, startDate, endDate): Promise<void>
    7-step sequential process with manual rollback:
      1. Fetch retained earnings account (3300) — throws RETAINED_EARNINGS_ACCOUNT_NOT_FOUND if absent
      2. Fetch revenue account balances from general_ledger VIEW
      3. Fetch expense account balances from general_ledger VIEW
      4. Aggregate net balances by account_code client-side
      5. Resolve account IDs from accounts table via code lookup
      6. Build compound closing entry lines:
           Revenue accounts: DEBIT (clears credit balance)
           Expense accounts: CREDIT (clears debit balance)
           Account 3300: CREDIT net_profit (or DEBIT if net loss)
      7. INSERT journal_entries (source_type='closing', status='posted')
         INSERT journal_entry_lines (with manual rollback on failure)
         UPDATE accounting_periods status='locked', locked_at, closing_entry_id

    Closing entries saved as status = 'posted' immediately — CFO performing
    lock is the authorizer; no draft/review step needed.
    Skips journal entry creation if no revenue/expense activity in period.

    Unicode escapes for Arabic description strings (POL-003 spirit):
      '\u0625\u0642\u0641\u0627\u0644' = 'إقفال'
      '\u0642\u064a\u0648\u062f \u0625\u0642\u0641\u0627\u0644 \u0627\u0644\u0641\u062a\u0631\u0629' = 'قيود إقفال الفترة'

4. Hooks — src/hooks/usePeriodClosing.ts (NEW)

  useClosePeriod(): useMutation
    onSuccess: invalidate ['accounting-periods'] + toast.success
    onError: toast.error

  useReopenPeriod(): useMutation
    onSuccess: invalidate ['accounting-periods'] + toast.success

  useLockPeriod(): useMutation
    onSuccess: invalidate ['accounting-periods'] + ['journal-entries'] + toast.success
    onError: RETAINED_EARNINGS_ACCOUNT_NOT_FOUND → specific toast guidance

  getPendingDraftCount and hasOtherOpenPeriod exported for pre-flight use.

5. New Page — src/pages/AccountingPeriodsPage.tsx (NEW)

  Table of all accounting periods with:
    Status badge per row:
      open   → "مفتوحة"   success green   bg-[#EBF5F0] text-[#1A7D4F]
      closed → "مُغلَقة"  warning amber   bg-[#FEF7EC] text-[#B45309]
      locked → "مُقفَلة"  danger red      bg-[#FEF0EF] text-[#C0392B]

    Action buttons per status:
      open   → "إقفال الفترة"  (warning amber)
      closed → "إعادة الفتح"  (outline) + "قفل نهائي" (danger red)
      locked → Lock icon + closing_entry_id ref (8 chars)

    Pre-flight checks (direct async calls, not mutations):
      Close: getPendingDraftCount() → blocking toast if drafts > 0
      Reopen: hasOtherOpenPeriod() → blocking toast if another open period exists

    AlertDialog for Close and Reopen (simple yes/no — Radix blocks outside-click).
    Dialog for Lock (requires typing period name exactly — prevents accidental lock).
      "قفل نهائي" button disabled until lockConfirmText === period.name.

6. Router Update

  /settings/periods route added to src/router/index.tsx.
  SettingsPage.tsx gains "الفترات المحاسبية" nav tab with CalendarDays icon.

7. i18n — src/i18n/locales/ar.ts + en.ts

  periodClosing.* namespace added (ar + en):
    status.open / closed / locked
    action.close / reopen / lock
    close/reopen/lock success and error toasts
    closeBlockedDrafts (with {count} placeholder)
    reopenBlockedOtherOpen
    lockErrorNoRetainedEarnings (guidance to create account 3300)
    closeDialog / reopenDialog / lockDialog keys
    lockDialog.warningTitle / warningPoint1 / warningPoint2 / confirmLabel / locking

---

Key Decisions

- Three-state model: 'closed' as reversible intermediate gives accountant a
  safety net before the irreversible 'locked' state.
- Closing entries auto-posted (not draft) — system-generated after CFO
  authorization; no value in a second review step.
- Name-confirmation input for lock: strongest guard on most irreversible action.
- Dialog (not AlertDialog) for lock: requires text input alongside warning banner.
- AlertDialog for close/reopen: simple yes/no, Radix blocks outside-click by design.
- Posting guard in S-100 (postJournalEntry) unchanged: open-period lookup
  naturally blocks posting to closed/locked periods without explicit status check.
- Manual rollback on lockPeriod: consistent with S-097/S-101 project convention.

---

Issues Encountered & Resolved (S-103)

None. Implementation matched spec exactly.
Migration CHECK constraint extended cleanly — existing constraint dropped and
re-added with full set of source_type values.

---

Final Verification (S-103)

Check	Result
Migration 20260614000001 applied	✅
closed_at / locked_at / closing_entry_id columns added	✅
source_type CHECK extended to include 'closing'	✅
AccountingPeriod type updated (3 new nullable fields)	✅
getPendingDraftCount / closePeriod / reopenPeriod / hasOtherOpenPeriod	✅
lockPeriod: closing entries created, period locked, closing_entry_id set	✅
useClosePeriod / useReopenPeriod / useLockPeriod hooks	✅
AccountingPeriodsPage: status badges + action buttons	✅
Close blocked when drafts exist: toast with count	✅
Reopen blocked when other open period exists	✅
Lock dialog: name-confirmation required, danger styling	✅
/settings/periods route + SettingsPage nav tab	✅
periodClosing.* i18n keys (ar + en)	✅
npx tsc --noEmit	✅ Zero errors
10 files changed	✅