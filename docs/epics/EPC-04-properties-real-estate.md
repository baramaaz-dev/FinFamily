EPC-04 — Properties & Real Estate
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4 & 11
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-033	Properties List Page				✅ Done
S-034	Add Property Form				✅ Done
S-035	Add Property Owners — Shares & Ownership Basis	✅ Done
S-036	Validate Ownership Total = 1 before Save	✅ Done
S-037	Property Ownership Statement View		✅ Done
S-038	Add Lease Contract				✅ Done
S-039	Lease Payments Log				✅ Done
S-040	Record Lease Payment				✅ Done
S-041	Add Property Expense				✅ Done
S-042	Property Expenses List with Filters		✅ Done
S-043	Property Upcoming Obligations View		✅ Done
S-089	Wire post_journal_entry to Lease Payments & Expenses	✅ Done
---

================================================================================

S-033 — Properties List Page
قائمة العقارات
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-033): All checks ✅

================================================================================

S-034 — Add Property Form
نموذج إضافة عقار جديد
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-034): All checks ✅

================================================================================

S-035 — Add Property Owners — Shares & Ownership Basis
إضافة ملاّك العقار مع الحصص وعلة التملك
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-035): All checks ✅

================================================================================

S-036 — Validate Ownership Total = 1 before Save
التحقق من مجموع حصص الملاك = 1 قبل الحفظ
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-036): All checks ✅

================================================================================

S-037 — Property Ownership Statement View
عرض بيان ملكية العقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-037): All checks ✅

================================================================================

S-038 — Add Lease Contract
نموذج تسجيل عقد إيجار جديد
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-038): All checks ✅

================================================================================

S-039 — Lease Payments Log
سجل دفعات الإيجار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

Note: leaseStatusInfo() i18n key bug (missing 'properties.' prefix) discovered
in this story and fixed in S-040 Phase 0.

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-039): All checks ✅

================================================================================

S-040 — Record Lease Payment
تسجيل دفعة إيجار جديدة
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

Note: journal_entry_id was intentionally absent from the INSERT payload in
Sprint 4. Posting wired in Sprint 11 (S-089).

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-040): All checks ✅

================================================================================

S-041 — Add Property Expense
نموذج تسجيل مصروف عقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

Note: journal_entry_id was intentionally absent from the INSERT payload in
Sprint 4. Posting wired in Sprint 11 (S-089).

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-041): All checks ✅

================================================================================

S-042 — Property Expenses List with Filters
سجل مصروفات العقار مع الفلترة
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-042): All checks ✅

================================================================================

S-043 — Property Upcoming Obligations View
عرض الالتزامات القادمة للعقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4 — Final Story of E4
Status: ✅ Done
Closed: Sprint 4

[Content unchanged from original EPC-04 — see git history]

Final Verification (S-043): All checks ✅

================================================================================

Post-Sprint 4 Hotfix — SelectItem Empty Value Crash

Status: ✅ Fixed and pushed to main

Error: A <Select.Item /> must have a value prop that is not an empty string.
Root cause: RecordLeasePaymentDialog.tsx and AddPropertyExpenseDialog.tsx both
used <SelectItem value=""> for the "no portfolios available" empty state.
Fix: replaced with non-interactive <div> in both files.

Canonical rule: Never use <SelectItem value=""> — use a <div> instead.

================================================================================

Sprint 11 — Accounting Engine Integration (E4 Stories)

================================================================================

S-089 — Wire post_journal_entry to Lease Payments and Property Expenses
ربط ترحيل القيود بدفعات الإيجار ومصروفات العقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 11 — Accounting Engine Integration
Status: ✅ Done
Closed: Sprint 11
Depends on: S-085 (post_journal_entry RPC), S-088 (usePostJournalEntry hook),
            S-040 (RecordLeasePaymentDialog), S-041 (AddPropertyExpenseDialog)
Blocks: S-092 (Posting Status Indicators)

---

Overview

Wires the post_journal_entry RPC (S-085) to two property-related forms,
using the shared usePostJournalEntry hook created in S-088. Follows the
identical three-change pattern established in S-088.

Two deliverables — both additive only:
  1. RecordLeasePaymentDialog.tsx — 3 additive changes
  2. AddPropertyExpenseDialog.tsx — 3 additive changes

Posting is non-blocking in both forms: if the RPC fails, the record is saved
with journal_entry_id = NULL and a warning toast is shown. The user's save
action is never blocked or rolled back.

No SQL migrations. No schema changes. No i18n additions. No UI layout changes.

Journal entry templates applied (STR-006):
  lease_payment    → DEBIT 1110/1120 (cash), CREDIT 4100 (rental revenue)
  property_expense → DEBIT 71XX (by type), CREDIT 1110/1120 (cash) or 2120 (accrued)
                     Credit is 2120 when portfolio_id IS NULL

---

What Was Built

1. Audit Findings (Phase 0)

  - src/hooks/usePostJournalEntry.ts existed from S-088 — no new file needed
  - CACHE_KEYS for 'lease_payment' and 'property_expense' already populated
    in the hook from S-088 (pre-populated for future reuse)
  - RecordLeasePaymentDialog.tsx INSERT did not use .select().single() — added
  - AddPropertyExpenseDialog.tsx INSERT did not use .select().single() — added
  - npx tsc --noEmit: 0 errors at baseline

2. RecordLeasePaymentDialog.tsx — 3 Targeted Changes

File: src/components/properties/RecordLeasePaymentDialog.tsx

Change 1 — Import added:
  import { usePostJournalEntry } from '@/hooks/usePostJournalEntry';

Change 2 — Hook call added inside component (with other hook declarations):
  const { post: postJournalEntry } = usePostJournalEntry('lease_payment');

Change 3 — onSubmit updated:
  a) .select().single() added to the INSERT chain to obtain inserted.id
  b) await postJournalEntry(inserted.id) added as the LAST step in
     the success path, after toast.success, form.reset, and onOpenChange

  Final INSERT pattern:
    const { data: inserted, error } = await supabaseClient
      .from('lease_payments')
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

3. AddPropertyExpenseDialog.tsx — 3 Targeted Changes

File: src/components/properties/AddPropertyExpenseDialog.tsx

Identical three-change pattern applied with source type 'property_expense':

Change 1 — Import added:
  import { usePostJournalEntry } from '@/hooks/usePostJournalEntry';

Change 2 — Hook call added:
  const { post: postJournalEntry } = usePostJournalEntry('property_expense');

Change 3 — onSubmit updated:
  a) .select().single() added to INSERT chain
  b) await postJournalEntry(inserted.id) added as LAST step in success path

  Note: the RPC handles the portfolio_id IS NULL → credit 2120 (accrued) logic
  internally. The UI passes no additional data — only the source_id.

4. Cache Invalidation (via hook CACHE_KEYS)

  lease_payment:    ['lease-payments'] · ['journal-entries'] · ['dashboard']
  property_expense: ['property-expenses'] · ['journal-entries'] · ['dashboard']

  Both invalidated automatically by usePostJournalEntry on successful posting.
  No manual invalidateQueries calls added in this story.

5. Project Structure after S-089

  src/
  └── components/
      └── properties/
          ├── RecordLeasePaymentDialog.tsx   ← UPDATED (3 additive changes)
          └── AddPropertyExpenseDialog.tsx   ← UPDATED (3 additive changes)

  src/hooks/usePostJournalEntry.ts — UNCHANGED (reused from S-088)

6. Commits

  feat(properties): wire post_journal_entry to lease payments and expenses (S-089)

---

Issues Encountered & Resolved (S-089)

#   Issue                                   Resolution
1   Neither form's INSERT returned          .select().single() added to both INSERT
    inserted.id — no .select().single()     chains; inserted.id now available
2   Browser verification requires           Dev server must be started manually by
    dev server — not available in           Barakat to test full flow against live DB;
    Claude Code session                     RPC correctness confirmed via S-085 tests

---

Final Verification (S-089)

Check	Result
RecordLeasePaymentDialog: import added	✅
RecordLeasePaymentDialog: hook call added	✅
RecordLeasePaymentDialog: .select().single() added	✅
RecordLeasePaymentDialog: postJournalEntry called last	✅
AddPropertyExpenseDialog: import added	✅
AddPropertyExpenseDialog: hook call added	✅
AddPropertyExpenseDialog: .select().single() added	✅
AddPropertyExpenseDialog: postJournalEntry called last	✅
posting failure: toast.warning shown, record saved	✅ (non-blocking by design)
npx tsc --noEmit	✅ Zero errors

================================================================================

E4 — Deferred Items Status

---

Deferred Item 1 — Additional Property Types

Status: ⏳ Deferred — post-MVP

Current DB CHECK: IN ('residential', 'commercial', 'land')
Candidate types: 'agricultural_land', 'farm', 'warehouse', 'apartment', 'villa'
Implementation cost is identical whenever done — expand after MVP validates need.

---

Deferred Item 2 — Property Document Attachments

Status: ⏳ Deferred — post-MVP

صك الملكية and عقد الإيجار uploads require Supabase Storage + new table +
RLS + upload UI. Meaningful scope for a dedicated post-MVP story.

---

Deferred Item 3 — Portfolio Balance Update on Rent Receipt

Status: ✅ PARTIALLY RESOLVED in Sprint 11 (S-089)

When a lease payment is recorded and a portfolio is selected, the payment
is now automatically posted as a journal entry (DEBIT cash · CREDIT 4100).
This reflects the income event in the general ledger and feeds into P&L
and partner capital calculations.

The portfolio_id in lease_payments remains a reference field. The full
authoritative portfolio balance is derived from journal_entry_lines via
the general_ledger VIEW, not from a denormalized balance column.

Historical lease payments from Sprint 4 seed data retain
journal_entry_id = NULL. A backfill migration can be applied post-MVP.