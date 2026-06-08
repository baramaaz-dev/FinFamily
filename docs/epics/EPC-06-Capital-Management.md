EPC-06 — Capital Accounts & Profit Settlements
Epic  : E6 — حسابات رأس المال والتسويات
Sprint: Sprint 6
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

STR-001 updated: S-083 added under Sprint 6 / E9 section.

================================================================================

S-083 — Chart of Accounts Settings Page
صفحة دليل الحسابات في الإعدادات
Epic  : E9 — الإعدادات والأسعار (executed in Sprint 6 as E6 prerequisite)
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-047 · M-04 (seed_chart_of_accounts)
Blocks    : S-048 (visual reference for COA structure)

---

Overview

Read-only tree view of the IFRS 18 Chart of Accounts at
/settings/accounts. Displays all records from the `accounts` table in
hierarchical form. Add / Edit / Delete buttons rendered but DISABLED —
activation deferred to post-MVP.

No migration required. `accounts` table already exists (M-03).

---

What Was Built

1. Audit Findings (Phase 0)

  - Account interface already existed in src/types/index.ts — Phase 1 partial no-op
  - Locale files are .ts not .json — all subsequent stories use this extension
  - src/components/settings/accounts/ did not exist — created
  - Baseline: 0 TypeScript errors

---

2. i18n — 32 keys added under settings.accounts.* namespace

  Root keys: title · subtitle · addAccount · lockedTooltip · expandAll · collapseAll
  Columns: code · name · class · normalBalance · postable · actions
  Classes: asset · liability · equity · revenue · expense
  normalBalance: debit · credit
  postable: yes · no
  ifrsCategories: balance · operating · investing · financing
  ifrsCodes: balance · operating · investing · financing
  Misc: empty · error · retry

---

3. Files Created

  src/components/settings/accounts/AccountClassBadge.tsx
    - plain <span>, hex colors per STR-004
    - asset=blue · liability=amber · equity/revenue=green · expense=red

  src/components/settings/accounts/AccountTreeNode.tsx
    - Recursive component, depth × 20px via paddingInlineStart (RTL-safe)
    - useDirection() for RTL-aware chevron (ChevronLeft/ChevronDown)
    - Disabled Edit + Delete with Lock icon + lockedTooltip

  src/pages/AccountsPage.tsx
    - React Query: ['accounts'], staleTime 5min
    - buildTree() helper: flat list → nested AccountNode[]
    - expandedIds: Set<string> state
    - IFRS 18 category banner (4 tiles: ميزانية · تشغيل · استثمار · تمويل)
    - "إضافة حساب" disabled button in header
    - Sub-components: AccountsSkeleton · AccountsEmpty

---

4. Files Modified

  src/types/index.ts         — AccountNode interface added
  src/i18n/locales/ar.ts     — settings.accounts.* merged
  src/i18n/locales/en.ts     — settings.accounts.* merged
  src/router/index.tsx        — { path: 'accounts', element: <AccountsPage /> }
  src/pages/SettingsPage.tsx  — BookOpen nav link to /settings/accounts

---

Issues Encountered & Resolved (S-083)

None. Implementation matched spec exactly.

---

Final Verification (S-083): All checks ✅

================================================================================

S-048 — Create Partner Capital Account
إنشاء حساب رأس مال لشريك/كيان
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-083
Blocks    : S-049

---

Overview

Capital Accounts page at /capital listing all partner_capital_accounts.
AddCapitalAccountDialog creates new accounts with opening balance.
Duplicate guard: (partner_id, entity_type, entity_id) must be unique —
validated via .maybeSingle() before insert.
'project' entity_type excluded from UI — post-MVP.

---

What Was Built

1. Audit Findings (Phase 0)

  - PartnerCapitalAccount interface: did not exist — added
  - capital.* i18n key: did not exist — added as top-level key
  - No /capital route — added
  - Baseline: 0 TypeScript errors

---

2. i18n — 35 keys added under top-level capital.* namespace

  Root: title · subtitle · addAccount · comingSoon
  Columns: partner · entityType · entity · openingBalance · currency · openingDate · actions · closingBalance (added in S-051)
  entityTypes: portfolio · property
  dialog: addTitle · cancel · submit · submitting
  form: partner · partnerPlaceholder · entityType · entity · entityPlaceholder ·
        openingBalance · openingBalancePlaceholder · currency · openingDate
  validation: 8 messages
  toast: createSuccess · createError
  empty: title · subtitle
  Misc: error · retry

---

3. Files Created

  src/components/capital/AddCapitalAccountDialog.tsx
    - Zod: z.string().refine() for opening_balance (STR-005 §5.2.1)
    - z.string().min(1) for opening_date (STR-005 §5.4)
    - zodResolver cast (STR-005 §4.1)
    - entity_type toggle: portfolio/property only
    - useEffect: reset entity_id on entity_type change
    - Duplicate check via .maybeSingle() before insert
    - onInteractOutside: e.preventDefault()

  src/pages/CapitalAccountsPage.tsx
    - React Query: ['capital-accounts'] staleTime 30s
    - React Query: ['entity-names-for-capital'] staleTime 5min
    - resolveEntityName() helper — polymorphic entity join (see Canonical Rules)
    - 6-column table (7 after S-051)
    - Disabled Edit + Delete stubs

---

4. Files Modified

  src/types/index.ts         — PartnerCapitalAccount interface added
  src/i18n/locales/ar.ts     — capital.* added
  src/i18n/locales/en.ts     — capital.* added
  src/router/routes.ts        — CAPITAL: '/capital'
  src/router/index.tsx        — { path: 'capital', element: <CapitalAccountsPage /> }
  src/layouts/components/navItems.ts — Wallet icon nav item between Reports and Settings

---

Issues Encountered & Resolved (S-048)

None. Implementation matched spec exactly.

---

Final Verification (S-048): All checks ✅

================================================================================

S-049 — Record Capital Transaction
تسجيل معاملة رأسمالية (ضخ/إنقاص/مسحوبات/أرباح/خسارة)
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-048
Blocks    : S-050

---

Overview

AddCapitalTransactionDialog for all five transaction types.
Reuses ['latest-exchange-rate'] warm cache (STR-005 §5.2.1 canonical key).
journal_entry_id = NULL always (STR-006 §11.3).
Hooks declared unconditionally before null guard (project rule).

---

What Was Built

1. Audit Findings (Phase 0)

  - CapitalTransaction interface: already existed — Phase 1 no-op
  - capital.transactions.* sub-key: did not exist — added inside capital key
  - ['latest-exchange-rate'] confirmed as canonical key from AddTransactionDialog
  - Baseline: 0 TypeScript errors

---

2. i18n — 31 keys added under capital.transactions.* sub-namespace

  Root: addTitle · addButton · cancel · submit · submitting
  types: 5 transaction type labels
  form: 9 field labels/placeholders
  validation: 9 messages
  toast: 2 messages
  context: "{partner} — {entity}" string (resolved via .replace() at call site)

---

3. Files Created

  src/components/capital/AddCapitalTransactionDialog.tsx
    - Props: account (PartnerCapitalAccount | null) — all hooks before null guard
    - z.string().refine() for amount · superRefine for SYP cross-validation
    - zodResolver cast mandatory
    - Type toggle 2 rows (3+2): green for injection/profit, red for the rest
    - Exchange rate auto-fill from ['latest-exchange-rate']
    - journal_entry_id: null hardcoded (STR-006 §11.3)

---

4. Files Modified

  src/pages/CapitalAccountsPage.tsx
    - selectedAccount + txDialogOpen state
    - "+ معاملة" green button per row
    - AddCapitalTransactionDialog mounted at JSX bottom

---

Issues Encountered & Resolved (S-049)

None. Implementation matched spec exactly.

---

Final Verification (S-049): All checks ✅

================================================================================

S-050 — Capital Account Statement
عرض كشف حساب رأسمالي لشريك
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-049
Blocks    : S-051

---

Overview

Detail page at /capital/:accountId. Shows account header card + all
capital_transactions newest-first. Signed amount display per STR-006 §7:
injection/profit_share = positive (+green), reduction/drawing/loss = negative (−red).
Posting status badge reflects journal_entry_id (NULL = "غير مُرحَّل" — expected in MVP).

---

What Was Built

1. Audit Findings (Phase 0)

  - capital.statement.* key: did not exist — added
  - No /capital/:accountId route — added
  - CAPITAL_DETAIL added to routes.ts as function: (id) => `/capital/${id}`
  - Baseline: 0 TypeScript errors

---

2. i18n — 22 keys added under capital.statement.* sub-namespace

  Root: title · backToList · viewButton
  accountHeader: 6 field labels
  columns: 8 column headers
  postingStatus: posted · unposted
  empty: title · subtitle
  Misc: error · retry

---

3. Files Created

  src/pages/CapitalStatementPage.tsx (260 lines initial, grew to 559 after S-055)
    - 3 React Query hooks: account header · transactions · entity name
    - getSignedAmount() helper: positive for injection/profit, negative for rest
    - 8-column table: date · type · signed amount · currency ·
                      exchangeRate · referenceNo · notes · postingStatus
    - Sub-components: StatementSkeleton · StatementEmpty · StatementError

---

4. Files Modified

  src/pages/CapitalAccountsPage.tsx — Eye icon "كشف الحساب" button per row
  src/router/routes.ts               — CAPITAL_DETAIL function constant
  src/router/index.tsx                — :accountId child route

---

Issues Encountered & Resolved (S-050)

None. Implementation matched spec exactly.

---

Final Verification (S-050): All checks ✅

================================================================================

S-051 — Closing Capital Balance
حساب رأس المال الختامي وفق المعادلة
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-050
Blocks    : S-052

---

Overview

Implements STR-006 §7 closing balance formula as a shared utility.
buildCapitalBreakdown() is the single source of truth — imported
in both CapitalStatementPage and CapitalAccountsPage.

MVP limitation documented: SYP opening_balance without exchange_rate
defaults to 0 in USD view.

---

What Was Built

1. Audit Findings (Phase 0)

  - src/utils/capital.ts: did not exist — created
  - capital.summary.* keys: did not exist — added
  - Baseline: 0 TypeScript errors

---

2. i18n — 11 keys added

  capital.summary.*: title · openingBalance · injections · profitShares ·
                     lossShares · drawings · reductions · closingBalance · currencyNote
  capital.columns.closingBalance added to existing capital.columns object

---

3. Files Created

  src/utils/capital.ts (63 lines)
    - toUSD(amount, currency, exchangeRate | null): number
    - CapitalBreakdown interface — 7 fields
    - buildCapitalBreakdown(openingBalance, currency, exchangeRate, transactions[])
      → implements STR-006 §7.1 formula exactly

---

4. Files Modified

  src/pages/CapitalStatementPage.tsx
    - useMemo: breakdown computed from account + transactions
    - SummaryRow sub-component (zero-value rows hidden, alwaysShow flag for opening)
    - Summary card between header and transactions table

  src/pages/CapitalAccountsPage.tsx
    - ['capital-transactions-all'] query (capital_account_id, type, amount, currency, exchange_rate)
    - closingBalanceMap: Map<accountId, closingBalance> memo
    - Closing balance column (7th column)

---

Issues Encountered & Resolved (S-051)

None. Implementation matched spec exactly.

---

Final Verification (S-051): All checks ✅

================================================================================

S-052 — Profit Settlement Draft Form
نموذج إنشاء تسوية أرباح جديدة (profit_settlement)
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-051
Blocks    : S-053

---

Overview

Profit Settlements page at /settlements. AddSettlementDialog creates
draft settlements (status='draft' hardcoded — never from form).
Period cross-validation: period_end < period_start blocked via superRefine.
'project' entity_type excluded — post-MVP.

---

What Was Built

1. Audit Findings (Phase 0)

  - ProfitSettlement / SettlementShare interfaces: did not exist — added
  - settlements.* top-level key: did not exist — added (NOT nested under capital)
  - portfolio-options / property-options cache keys confirmed from S-048
  - Baseline: 0 TypeScript errors

---

2. i18n — 40 keys added under top-level settlements.* namespace

  Root: title · subtitle · addSettlement · comingSoon
  Columns: 8 headers
  Status: draft · confirmed
  entityTypes: portfolio · property
  dialog: 4 keys
  form: 10 keys
  validation: 10 messages including periodEndBeforeStart (superRefine)
  toast: 2 messages
  empty: title · subtitle
  Misc: error · retry

---

3. Files Created

  src/components/settlements/AddSettlementDialog.tsx
    - superRefine: period_end < period_start → error on period_end field
    - z.string().refine() for total_profit · z.string().min(1) for dates
    - zodResolver cast mandatory
    - status: 'draft' hardcoded in insert (never from form)

  src/pages/SettlementsPage.tsx
    - React Query: ['settlements'] staleTime 15s
    - React Query: ['entity-names-for-settlements'] staleTime 5min
    - 8-column table with status badges (draft=amber, confirmed=green)
    - "تفاصيل" button disabled (enabled in S-053)

---

4. Files Modified

  src/types/index.ts              — ProfitSettlement + SettlementShare interfaces
  src/i18n/locales/ar.ts + en.ts  — settlements.* added
  src/router/routes.ts             — SETTLEMENTS: '/settlements'
  src/router/index.tsx             — /settlements route
  src/layouts/components/navItems.ts — BarChart2 nav item after /capital

---

Issues Encountered & Resolved (S-052)

None. Implementation matched spec exactly.

---

Final Verification (S-052): All checks ✅

================================================================================

S-053 — Auto-Calculate Partner Settlement Shares
احتساب حصص الشركاء في التسوية تلقائياً
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-052
Blocks    : S-054

---

Overview

SettlementDetailPage at /settlements/:settlementId. "احتساب الحصص"
button batch-inserts into settlement_shares using STR-006 §8.2:
  amount = total_profit × (share_numerator / share_denominator)
Sum validated against total_profit (tolerance 0.0001) — warn only, not blocking.
capital_transaction_id = NULL — populated by S-054.

---

What Was Built

1. Audit Findings (Phase 0)

  - settlements.detail.* sub-key: did not exist — added
  - No /settlements/:settlementId route — added
  - SETTLEMENT_DETAIL added to routes.ts as function: (id) => `/settlements/${id}`
  - Baseline: 0 TypeScript errors

---

2. i18n — 38 keys added under settlements.detail.* sub-namespace

  Root: backToList · title · settlementInfo · 6 header fields · sharesSection ·
        calculateShares · calculating · confirmSettlement · confirmLocked · viewButton
  sharesColumns: partner · fraction · amount · currency
  sumCheck: match · mismatch ({sum} and {total} tokens resolved via .replace())
  noShares: title · subtitle
  Misc: noMembers · error · retry · toast.calculateSuccess · toast.calculateError

---

3. Files Created

  src/pages/SettlementDetailPage.tsx (initial 438 lines, grew through fixes)
    - fetchEntityMembers(): polymorphic — portfolio_members OR property_owners
    - handleCalculateShares(): fetch → calculate → validate sum → batch insert
    - capital_transaction_id: null in all inserted rows
    - setQueryData pattern (see Bug Fixes below)

---

4. Files Modified

  src/pages/SettlementsPage.tsx    — "تفاصيل" button enabled (was disabled)
  src/router/routes.ts              — SETTLEMENT_DETAIL function constant
  src/router/index.tsx              — :settlementId child route

---

Issues Encountered & Resolved (S-053)

#   Issue                                       Resolution
--  ------------------------------------------  ----------------------------------------
1   Shares table did not appear after calculate  Initial fix: added refetch: refetchShares
    — success toast fired but UI showed empty    + await refetchShares() after
    state. React Query v5 invalidateQueries      invalidateQueries. This worked
    marks cache stale but does not force         but was superseded by Bug Fix 2.
    immediate re-render.

2   Fragile Supabase embedded join               fetchShares split into two separate
    people!partner_id(name) caused entire        queries: plain settlement_shares select,
    fetchShares() to throw when called           then batched people lookup via .in('id').
    directly inside handleCalculateShares,       Partner names assembled client-side via Map.
    surfacing as "فشل عند حساب الحصص" toast.    See E6 Canonical Rule 4.

3   Duplicate settlement_shares rows             User had clicked calculate multiple times
    (same 3 partners appearing 9 times           during debugging. Cleaned via SQL:
    across settlements) due to no UNIQUE         DELETE WHERE id NOT IN (
    constraint and repeated button clicks.         SELECT DISTINCT ON (settlement_id,
                                                     partner_id) id ...
                                                   ORDER BY settlement_id, partner_id, id DESC)
                                                 settlement_shares has no created_at column
                                                 — id DESC used for ordering.

---

Final Verification (S-053): All checks ✅

================================================================================

S-054 — Confirm Settlement
تأكيد التسوية وتغيير الحالة إلى confirmed
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-053
Blocks    : S-055

---

Overview

Enables "تأكيد التسوية" button. Confirmation sequence per STR-006 §8.3:
  For each settlement_share:
    1. Find partner_capital_account (partner_id + entity_type + entity_id)
    2. Insert capital_transaction (type='profit_share', journal_entry_id=NULL)
    3. Update settlement_share.capital_transaction_id = new tx ID
  Then: update profit_settlements.status → 'confirmed'

Pre-confirmation guards:
  - Σ amounts ≈ total_profit (tolerance 0.0001) — blocking
  - All partners must have capital account for entity — blocking with partner name in toast

reference_no format: SETTLE-{first 8 chars of settlement.id toUpperCase()}
AlertDialog (Shadcn) used for confirmation UX.
Confirm button color: bg-[#1A7D4F] (success green — positive financial event).

---

What Was Built

1. Audit Findings (Phase 0)

  - settlements.detail.confirm.* key: did not exist — added
  - AlertDialog confirmed installed at @/components/ui/alert-dialog
  - CheckCircle2 added to imports
  - Baseline: 0 TypeScript errors

---

2. i18n — 13 keys added under settlements.detail.confirm.* sub-namespace

  dialogTitle · dialogDescription · entityLabel · periodLabel · totalLabel ·
  partnersLabel · cancelButton · confirmButton · confirming ·
  noCapitalAccount ({name} token) · sumMismatchBlock ·
  toast.success · toast.error

---

3. Files Modified

  src/pages/SettlementDetailPage.tsx
    - isConfirming + confirmDialogOpen state
    - handleConfirmSettlement(): sum check → per-share loop → status update → 5× invalidateQueries
    - Disabled "تأكيد" replaced with AlertDialog trigger (green)
    - AlertDialog summary card: entity/period/total/partners count

---

Issues Encountered & Resolved (S-054)

#   Issue                                       Resolution
--  ------------------------------------------  ----------------------------------------
1   invalidateQueries for settlement-shares     Replaced with setQueryData pattern:
    after confirmation did not update shares    const freshShares = await fetchShares(id)
    table immediately.                          queryClient.setQueryData([key], freshShares)
                                                Applied to both handleCalculateShares
                                                and handleConfirmSettlement.

---

Final Verification (S-054): All checks ✅

================================================================================

S-055 — Display Settlement–Capital Transaction Link
ربط settlement_shares بـ capital_transactions
Epic  : E6
Sprint: Sprint 6
Status: ✅ Done
Depends on: S-054
Blocks    : Sprint 6 merge → main

---

Overview

Read-only display of the link established in S-054.
Two targeted UI additions:
  1. SettlementDetailPage shares table: 5th column "الترحيل" showing
     green "مرتبط" badge when capital_transaction_id is set, gray "—" when null.
  2. CapitalStatementPage transactions table: 9th column "المصدر" showing
     green "تسوية" badge when reference_no starts with "SETTLE-", gray "—" otherwise.

No new queries, no new routes, no migration.

---

What Was Built

1. Audit Findings (Phase 0)

  - settlements.detail.sharesColumns.linked: did not exist — added
  - capital.statement.columns.source: did not exist — added
  - CheckCircle2 already imported from S-054 — no duplicate import needed
  - Baseline: 0 TypeScript errors

---

2. i18n — 6 keys added (3 per locale file)

  settlements.detail.sharesColumns.linked  — column header
  settlements.detail.linkedBadge           — "مرتبط"
  settlements.detail.unlinkedDash          — "—"
  capital.statement.columns.source         — column header
  capital.statement.settlementBadge        — "تسوية"
  (unlinked cases use hardcoded "—" span)

---

3. Files Modified

  src/pages/SettlementDetailPage.tsx
    - 5th TableHead + TableCell in shares table
    - capital_transaction_id !== null → green badge · null → gray dash

  src/pages/CapitalStatementPage.tsx
    - 9th TableHead + TableCell in transactions table
    - reference_no?.startsWith('SETTLE-') → green "تسوية" badge
    - colSpan updated 8 → 9 for empty/error states

---

Issues Encountered & Resolved (S-055)

#   Issue                                       Resolution
--  ------------------------------------------  ----------------------------------------
1   "الترحيل" column in CapitalStatementPage    This is expected MVP behavior.
    shows "غير مُرحَّل" — user queried whether   "غير مُرحَّل" = journal_entry_id IS NULL
    this is correct.                             = accounting posting deferred (STR-006
                                                 §11.3). Not a bug. Clarified in session.

---

Final Verification (S-055): All checks ✅

================================================================================

E6 — Canonical Rules Established This Sprint

1. Polymorphic entity join — resolveEntityName() pattern
   partner_capital_accounts.entity_id and profit_settlements.entity_id
   have no FK — polymorphic reference. Resolution: fetch portfolios and
   properties separately, match client-side via find(). queryKey must be
   DISTINCT from ['portfolios'] and ['properties'] to avoid stale-data
   collisions (e.g. ['entity-names-for-capital'] · ['entity-names-for-settlements']).

2. buildCapitalBreakdown() — single source of truth
   src/utils/capital.ts is the ONLY implementation of the capital equation.
   Never reimplement the formula inline. Import in every component that needs it.
   Both CapitalStatementPage and CapitalAccountsPage import from this file.
   Any future story touching capital math must use this utility.

3. setQueryData over invalidateQueries for immediate UI updates
   React Query v5 invalidateQueries marks cache stale but does not force
   a synchronous re-render. For dialogs that insert data and must show
   results immediately:
     const freshData = await fetchFn(id);
     queryClient.setQueryData([queryKey, id], freshData);
   This pattern is REQUIRED for handleCalculateShares and handleConfirmSettlement.
   Using invalidateQueries alone causes the "success toast but empty UI" bug.

4. Supabase embedded join fragility — two-step query pattern
   Embedded joins (people!partner_id(name)) can fail at runtime when Supabase
   cannot resolve the FK alias. When called inside a handler (not a useQuery),
   errors propagate to the catch block as a silent failure.
   Pattern: always fetch the base table first, then batch-fetch related records
   via .in('id', [...ids]), assemble via Map client-side.
   Established in fetchShares() — apply to any future handler that needs joined data.

5. journal_entry_id = NULL throughout E6 MVP
   All capital_transactions created in this sprint have journal_entry_id = NULL.
   The accounting posting layer (journal_entries + journal_entry_lines) is
   deferred to post-MVP (STR-006 §11.3). The "غير مُرحَّل" badge in
   CapitalStatementPage is correct and expected — not a bug.

6. Settlement confirmation guards are sequential, not parallel
   handleConfirmSettlement iterates shares in a for...of loop (not Promise.all).
   This is intentional: if one partner lacks a capital account, the loop stops
   immediately with a named-partner error toast — no partial state created.
   Parallel execution would risk partial inserts before the error is caught.

7. reference_no format for settlement-originated transactions
   SETTLE-{settlement.id.substring(0,8).toUpperCase()}
   This prefix is the mechanism used by CapitalStatementPage (S-055) to detect
   settlement origin via reference_no?.startsWith('SETTLE-').
   Must not be changed without updating the detection logic.

8. Hooks before null guard — Dialog with nullable prop
   AddCapitalTransactionDialog receives account: PartnerCapitalAccount | null.
   ALL hooks (useTranslation, useQueryClient, useQuery, useForm, watch, useState)
   must be declared BEFORE the null guard (if (!account) return null).
   Violating this rule causes "React Hook called conditionally" runtime errors.
   Project rule confirmed in S-049, applies to all dialogs with nullable props.

================================================================================

E6 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — Accounting Posting Layer

journal_entry_id on capital_transactions is NULL throughout Sprint 6.
The full double-entry posting (journal_entries + journal_entry_lines per STR-006 §5)
is deferred to a future sprint. When implemented, the "غير مُرحَّل" badges in
CapitalStatementPage will turn green automatically as journal_entry_id is populated.

Deferred Item 2 — Settlement Profit Validation

The AddSettlementDialog total_profit field accepts any non-negative number.
There is no validation that the entered amount does not exceed the actual net
profit of the entity for the period (Σ income − Σ expenses from transactions).

When Sprint 9 builds the P&L calculation layer (S-068), a soft warning should
be added:
  if total_profit > actualNetProfit → ⚠️ "المبلغ يتجاوز صافي أرباح الكيان (X $)"
Non-blocking — user confirms to proceed (distribution from capital is valid).

Deferred Item 3 — Unique Constraint on settlement_shares

No UNIQUE constraint exists on (settlement_id, partner_id) in settlement_shares.
Multiple clicks on "احتساب الحصص" can insert duplicate rows.
Short-term mitigation: setQueryData pattern prevents the "silent insert then
re-click" pattern by showing results immediately after first click.
Long-term: ADD UNIQUE (settlement_id, partner_id) to settlement_shares.

Deferred Item 4 — Edit / Delete on Capital Accounts and Transactions

Edit + Delete buttons on CapitalAccountsPage and CapitalStatementPage
are rendered as disabled stubs. Activation requires:
  Edit capital account: update opening_balance + currency (no entity change).
  Delete capital account: guard — no capital_transactions must exist.
  Edit capital transaction: reversal pattern (STR-006 §4.3) — not direct edit.
  Delete capital transaction: only for unposted (journal_entry_id IS NULL).

Deferred Item 5 — project Entity Type in Capital and Settlements

entity_type = 'project' is excluded from all UI dropdowns in this sprint.
To activate: add 'project' to entity_type toggles in AddCapitalAccountDialog
and AddSettlementDialog, and add 'project_transactions' as a source in
fetchEntityMembers().