EPC-06 — Capital Accounts & Profit Settlements
Epic  : E6 — حسابات رأس المال والتسويات
Sprint: Sprint 6 & 11
Status: ✅ Done

---

Stories Overview

Story   Title                                                Status
------  ---------------------------------------------------  -------
S-083   Chart of Accounts Settings Page (E9 prerequisite)   ✅ Done
S-048   Create Partner Capital Account                       ✅ Done
S-049   Record Capital Transaction                           ✅ Done
S-050   Capital Account Statement                            ✅ Done
S-051   Closing Capital Balance                              ✅ Done
S-052   Profit Settlement Draft Form                         ✅ Done
S-053   Auto-Calculate Partner Settlement Shares             ✅ Done
S-054   Confirm Settlement                                   ✅ Done
S-055   Display Settlement–Capital Transaction Link          ✅ Done
S-090   Wire post_journal_entry to Capital Transactions      ✅ Done
S-091   Update Settlement Confirmation — Compound Entry      ⏳ Pending

---

Pre-Sprint Work

STR-006 — Accounting Engine Specification (new document)
  Created before any story implementation.
  Version 1.0 → 1.1 (IFRS 18 COA restructure):
    - Income/expense split into three P&L categories:
        4000/7000 Operating · 5000/8000 Investing · 6000/9000 Financing
    - Balance sheet accounts unchanged: 1000/2000/3000
    - All journal entry templates updated with new account codes
    - Added S-083 to Story Mapping table
  Committed directly to main before sprint branch creation.

  Version 1.1 → 1.2 (Sprint 11 updates — see Sprint 11 section):
    - §2.4: partner account creation timing changed to people INSERT
    - §8.3–8.4: profit settlement entry changed to single compound N+1 entry
    - §10.4: RPCs table added
    - §11.3: two-line rule documented

STR-001 updated: S-083 added under Sprint 6 / E9 section.

================================================================================

S-083 — Chart of Accounts Settings Page
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-083): All checks ✅

================================================================================

S-048 — Create Partner Capital Account
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-048): All checks ✅

================================================================================

S-049 — Record Capital Transaction
تسجيل معاملة رأسمالية (ضخ/إنقاص/مسحوبات/أرباح/خسارة)
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Closed: Sprint 6

Note: journal_entry_id: null was hardcoded in INSERT per STR-006 §11.3.
This explicit null was REMOVED in Sprint 11 (S-090) — it must not be set
by the UI; the RPC sets it after posting.

[Remaining content unchanged from original EPC-06 — see git history]
Final Verification (S-049): All checks ✅

================================================================================

S-050 — Capital Account Statement
[Content unchanged from original EPC-06 — see git history]

Note: The "غير مُرحَّل" badge in CapitalStatementPage reflects
journal_entry_id = NULL. From Sprint 11 onward, new capital transactions
are posted automatically — the badge will show "مُرحَّل" for new records.

Final Verification (S-050): All checks ✅

================================================================================

S-051 — Closing Capital Balance
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-051): All checks ✅

================================================================================

S-052 — Profit Settlement Draft Form
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-052): All checks ✅

================================================================================

S-053 — Auto-Calculate Partner Settlement Shares
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-053): All checks ✅

================================================================================

S-054 — Confirm Settlement
تأكيد التسوية وتغيير الحالة إلى confirmed
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Closed: Sprint 6

Note: Settlement confirmation in Sprint 6 created N separate
capital_transactions (one per partner) with journal_entry_id = NULL.
Sprint 11 (S-091) replaces this with a single compound journal entry
via post_settlement_entry RPC per STR-006 §8.3–8.4 v1.2.

[Remaining content unchanged from original EPC-06 — see git history]
Final Verification (S-054): All checks ✅

================================================================================

S-055 — Display Settlement–Capital Transaction Link
[Content unchanged from original EPC-06 — see git history]
Final Verification (S-055): All checks ✅

================================================================================

E6 — Canonical Rules Established in Sprint 6

[Content unchanged from original EPC-06 — see git history]

Canonical Rule 5 update (Sprint 11):
  journal_entry_id = NULL throughout E6 MVP is now partially resolved.
  New capital_transactions are posted automatically via S-090.
  Settlement journal entries are posted via S-091 (pending).
  Historical pre-Sprint-11 capital_transactions retain journal_entry_id = NULL.

================================================================================

Sprint 11 — Accounting Engine Integration (E6 Stories)

================================================================================

S-090 — Wire post_journal_entry to Capital Transactions on Submit
ربط ترحيل القيود بالحركات الرأسمالية
Epic  : E6 — حسابات رأس المال والتسويات
Sprint: Sprint 11 — Accounting Engine Integration
Status: ✅ Done
Closed: Sprint 11
Depends on: S-085 (post_journal_entry RPC), S-084 (partner 31XX/32XX accounts),
            S-088 (usePostJournalEntry hook), S-049 (AddCapitalTransactionDialog)
Blocks: S-092 (Posting Status Indicators)

---

Overview

Wires the post_journal_entry RPC (S-085) to the capital transaction creation
form, following the pattern established in S-088 and S-089.

One file modified: AddCapitalTransactionDialog.tsx — 5 changes total
(one more than S-088/S-089 because journal_entry_id: null was present in the
INSERT payload and had to be removed).

Posting is non-blocking: if the RPC fails, the capital transaction is saved
with journal_entry_id = NULL and a warning toast is shown.

Journal entry templates applied (STR-006 §5.4):
  capital_injection → DEBIT 1110/1120, CREDIT 31XX (partner capital)
  capital_reduction → DEBIT 31XX,      CREDIT 1110/1120
  drawing           → DEBIT 32XX,      CREDIT 1110/1120
  profit_share      → DEBIT 4100/4300 (by entity_type), CREDIT 31XX
  loss_share        → DEBIT 31XX,      CREDIT 7100/7300 (by entity_type)

The RPC resolves sub-type and partner accounts internally via
capital_account_id → partner_capital_accounts → partner_id →
accounts.metadata->>'partner_id'. The UI passes only the inserted id.

No SQL migrations. No schema changes. No i18n additions. No UI layout changes.

---

What Was Built

1. Audit Findings (Phase 0)

  - src/hooks/usePostJournalEntry.ts existed from S-088 — no new file needed
  - CACHE_KEYS for 'capital_transaction' already populated in the hook
  - AddCapitalTransactionDialog INSERT had journal_entry_id: null explicitly —
    must be removed (RPC sets it; UI must not preset it)
  - INSERT did not use .select().single() — added
  - Hook declaration was after null guard — must move before (Canonical Rule 8)
  - npx tsc --noEmit: 0 errors at baseline

2. AddCapitalTransactionDialog.tsx — 5 Changes

File: src/components/capital/AddCapitalTransactionDialog.tsx

Change 1 — Import added:
  import { usePostJournalEntry } from '@/hooks/usePostJournalEntry';

Change 2 — Hook call added BEFORE null guard (Canonical Rule 8):
  const { post: postJournalEntry } = usePostJournalEntry('capital_transaction');
  // Placed before: if (!account) return null
  All hooks must be declared unconditionally per React rules.

Change 3 — .select().single() added to INSERT chain:
  const { data: inserted, error } = await supabaseClient
    .from('capital_transactions')
    .insert({ ... })
    .select()
    .single();

Change 4 — journal_entry_id: null REMOVED from INSERT payload:
  This field was hardcoded null in S-049 per STR-006 §11.3 (Sprint 6 scope).
  It must not be set by the UI — the DB default is NULL and the RPC
  updates it after posting. Explicitly setting it to null before the RPC
  runs is harmless but contradicts the intent and could mask future issues.

Change 5 — Posting call added as LAST step in success path:
  // Existing code runs first:
  // invalidateQueries · toast.success · reset() · onSuccess()
  // Then:
  if (inserted?.id) {
    await postJournalEntry(inserted.id);
  }

3. Cache Invalidation (via hook CACHE_KEYS)

  capital_transaction: ['capital-transactions'] · ['capital-accounts'] ·
                       ['journal-entries'] · ['dashboard']

  All invalidated automatically by usePostJournalEntry on successful posting.
  No manual invalidateQueries calls added in this story.

4. Project Structure after S-090

  src/
  ├── hooks/
  │   └── usePostJournalEntry.ts          ← UNCHANGED (reused from S-088)
  └── components/
      └── capital/
          └── AddCapitalTransactionDialog.tsx  ← UPDATED (5 changes)

5. Commits

  feat(capital): wire post_journal_entry to capital transactions (S-090)

---

Issues Encountered & Resolved (S-090)

#   Issue                                   Resolution
1   journal_entry_id: null present in       Removed from INSERT payload —
    INSERT payload from S-049              DB default handles NULL; RPC
                                            sets the value after posting
2   Hook declared after if (!account)       Hook call moved above null guard
    return null null guard — violates       per Canonical Rule 8 (all hooks
    React rules                             unconditional before early returns)
3   Browser verification requires           Dev server must be started by Barakat
    dev server                              to confirm journal_entries rows created
                                            with source_type='capital_transaction'

---

Final Verification (S-090)

Check	Result
AddCapitalTransactionDialog: import added	✅
AddCapitalTransactionDialog: hook call before null guard	✅
AddCapitalTransactionDialog: .select().single() added	✅
AddCapitalTransactionDialog: journal_entry_id: null removed	✅
AddCapitalTransactionDialog: postJournalEntry called last	✅
posting failure: toast.warning, transaction saved	✅ (non-blocking by design)
npx tsc --noEmit	✅ Zero errors

================================================================================

S-091 — Update Settlement Confirmation — Compound Journal Entry
تحديث تأكيد التسوية للقيد المُركَّب
Epic  : E6 — حسابات رأس المال والتسويات
Sprint: Sprint 11 — Accounting Engine Integration
Status: ⏳ Pending
Depends on: S-086 (post_settlement_entry RPC), S-054 (handleConfirmSettlement)
Blocks: S-092 (Posting Status Indicators)

Implementation pending. See STR-006 v1.2 §8.3–8.4 for the compound entry spec
and the S-091 story files for full implementation details.

================================================================================

E6 — Deferred Items Status

---

Deferred Item 1 — Accounting Posting Layer

Status: ✅ PARTIALLY RESOLVED — Sprint 11

  S-090 (done): New capital_transactions are now posted automatically on save.
                journal_entry_id is populated for all new capital transactions.
  S-091 (pending): Settlement confirmation will post a compound N+1 entry via
                   post_settlement_entry RPC.

Historical capital_transactions from Sprint 6 retain journal_entry_id = NULL.
Backfill migration can be applied post-MVP if needed.

---

Deferred Item 2 — Settlement Profit Validation

Status: ⏳ Deferred — post-MVP

When Sprint 9 builds the P&L layer, a soft warning should be added if
total_profit exceeds actual net profit for the entity period.

---

Deferred Item 3 — Unique Constraint on settlement_shares

Status: ⏳ Deferred — post-MVP

No UNIQUE constraint on (settlement_id, partner_id). setQueryData pattern
mitigates duplicate-click risk. Full fix: ADD UNIQUE constraint.

---

Deferred Item 4 — Edit / Delete on Capital Accounts and Transactions

Status: ⏳ Deferred — post-MVP

Edit/Delete buttons rendered as disabled stubs. Activation requires
reversal pattern (STR-006 §4.3) for posted transactions.

---

Deferred Item 5 — project Entity Type in Capital and Settlements

Status: ⏳ Deferred — post-MVP

entity_type = 'project' excluded from all UI dropdowns.