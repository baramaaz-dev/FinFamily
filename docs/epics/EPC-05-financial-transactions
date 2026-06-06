EPC-05 — Financial Transactions
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
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
to Sprint 6 (E6).

---

What Was Built

1. Audit Findings (Phase 0)

  - TransactionsPage.tsx stub existed from S-002
  - /transactions route already wired in src/router/index.tsx
  - Transaction interface already existed at types/index.ts as a partial stub
    (missing portfolio_name derived field and strict currency union)
  - Locale files had no transactions namespace
  - Baseline npx tsc --noEmit: 0 errors

---

2. TypeScript Types — src/types/index.ts

Replaced existing partial Transaction stub with full interface:

```ts
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
  journal_entry_id: string | null;  // always NULL at this sprint — never displayed
  created_at:       string;
}
```

---

3. i18n — 32 keys added under transactions.* namespace

Note: story spec projected 21 keys. Claude Code added 11 additional keys
during implementation (additional empty/error sub-states). 32 keys confirmed
from PR #32 summary.

Sub-namespace               Keys (approx)
transactions.*              5 root keys
transactions.columns.*      7 keys
transactions.types.*        3 keys
transactions.actions.*      2 keys
transactions.empty.*        2 keys
transactions.error.*        2 keys
(additional sub-states)    11 keys
Total (confirmed)           32 keys

---

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

---

5. Commits

```
feat(types): add Transaction interface to src/types/index.ts
feat(i18n): add transactions.* namespace to ar and en locales
feat(transactions): implement Transaction list page — table, skeleton, empty and error states
feat(s-026): implement Transaction list page
```

---

Issues Encountered & Resolved (S-026)

#   Issue                                Resolution
1   Transaction interface was a           Full interface written from scratch;
    partial stub — missing               stub replaced (not extended).
    portfolio_name and strict types

---

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

---

2. i18n — 21 keys added inside EXISTING transactions object

Sub-namespace                  Keys
transactions.dialog.*          4 keys (addTitle, cancel, submit, submitting)
transactions.form.*            11 keys
transactions.validation.*       5 keys
transactions.toast.*            2 keys
Total                          21 keys

---

3. AddTransactionDialog — src/components/transactions/AddTransactionDialog.tsx (NEW)

Zod schema (outside component):
```ts
const addTransactionSchema = z.object({
  portfolio_id: z.string().min(1, { message: '...' }),
  type:         z.enum(['income','expense','transfer'], { error: '...' }),
  amount:       z.coerce.number().positive({ message: '...' }),
  currency:     z.enum(['USD','SYP'], { error: '...' }),
  date:         z.string().min(1, { message: '...' }),   // string — not z.coerce.date() (STR-005 §5.4)
  category:     z.string().max(100).optional(),
  notes:        z.string().max(500).optional(),
});
// exchange_rate absent — added in S-028
```

Resolver: zodResolver(addTransactionSchema) as unknown as Resolver<AddTransactionFormData>
  ⚠️ cast required — established codebase pattern; documented in STR-005 §4.1

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
  Existing transactions from seed data visible in list immediately after add.

---

4. TransactionsPage.tsx — targeted additions

dialogOpen state · header button enabled (onClick) ·
TransactionsEmpty.onAdd wired · <AddTransactionDialog> rendered.

---

5. Commits

```
feat(i18n): add transactions.dialog, form, validation and toast keys to ar and en
feat(transactions): implement AddTransactionDialog with Zod validation and Supabase insert
feat(transactions): wire Add Transaction button and dialog in TransactionsPage
feat(s-027): implement Add Transaction form
```

---

Issues Encountered & Resolved (S-027)

#   Issue                                   Resolution
1   zodResolver type mismatch with           zodResolver(schema) as unknown as
    react-hook-form generic                  Resolver<FormData> — established codebase
                                             pattern. Documented in STR-005 §4.1.
2   z.coerce.date() produces Date object,    Use z.string().min(1) for required dates.
    not string — incompatible with Supabase  Documented in STR-005 §5.4.
3   z.string().uuid() on portfolio_id        Use z.string().min(1) — Select returns
    produces unhelpful format error          string; uuid() gives technical error message.
                                             Documented in STR-005 §5.6.

---

Final Verification (S-027): All checks ✅

================================================================================

S-028 — Currency Selection & Exchange Rate Input
اختيار العملة وإدخال سعر الصرف
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #36
Depends on: S-027 (Add Transaction Form)
Blocks: S-029 (Link Transaction to Portfolio)

---

Overview

Extends AddTransactionDialog to handle SYP transactions:
  - Conditional exchange_rate field (shown only when currency = 'SYP')
  - Auto-populates from latest rate in exchange_rates table
  - Cross-field validation: SYP requires a non-empty exchange_rate
  - exchange_rate passed to Supabase insert (was hardcoded null in S-027)

No new files. Changes confined to AddTransactionDialog.tsx + locale files.

---

What Was Built

1. i18n — 6 keys added inside EXISTING transactions.form and transactions.validation

  transactions.form.exchangeRate / exchangeRatePlaceholder / exchangeRateHint
  transactions.validation.exchangeRateRequired / exchangeRatePositive / exchangeRateInvalid

---

2. AddTransactionDialog.tsx — 5 targeted changes

Change 1 — New fetch helper (outside component):
```ts
async function fetchLatestExchangeRate(): Promise<number | null> {
  return supabaseClient.from('exchange_rates')
    .select('rate')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()  →  data?.rate ?? null
}
// queryKey: ['latest-exchange-rate'], staleTime: 5 * 60 * 1000
```

Change 2 — Updated Zod schema (exchange_rate added, superRefine added):
```ts
exchange_rate: z.string()
  .refine((v) => v==='' || !isNaN(parseFloat(v)), { message: '...' })
  .refine((v) => v==='' || parseFloat(v) > 0,     { message: '...' })
  .optional(),
// ⚠️ z.coerce.number().optional() and z.preprocess() are FORBIDDEN (STR-005 §5.2.1)

}).superRefine((data, ctx) => {
  if (data.currency === 'SYP' && (!data.exchange_rate || data.exchange_rate === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exchange_rate'], message: '...' });
  }
});
// ⚠️ cast still required: zodResolver(schema) as unknown as Resolver<FormData>
```

Change 3 — latestRate query + defaultValues.exchange_rate = ''

Change 4 — useEffect auto-fill:
```ts
useEffect(() => {
  if (watchedCurrency === 'SYP' && latestRate != null) setValue('exchange_rate', String(latestRate));
  else if (watchedCurrency === 'USD')                  setValue('exchange_rate', '');
}, [watchedCurrency, latestRate, setValue]);
```

Change 5 — Conditional JSX field + updated onSubmit:
```ts
exchange_rate: data.currency === 'SYP' && data.exchange_rate
  ? parseFloat(data.exchange_rate) : null,
```

---

3. Commits

```
feat(i18n): add transactions.form.exchangeRate* and validation.exchangeRate* keys
feat(transactions): add conditional exchange rate field with auto-fetch to AddTransactionDialog
feat(s-028): add exchange rate input for SYP transactions
```

---

Issues Encountered & Resolved (S-028)

#   Issue                                   Resolution
1   Optional numeric field requires          z.string().refine() + parseFloat() in onSubmit.
    special handling in Zod v4               STR-005 §5.2.1 pattern followed.
2   Cross-field validation (SYP needs        .superRefine() on the z.object() — the only
    exchange_rate) cannot live in            correct location for multi-field logic.
    a single field's validator               Documented in STR-005 §5.7.

---

Final Verification (S-028): All checks ✅

================================================================================

S-029 — Link Transaction to Portfolio
ربط المعاملة بالمحفظة
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #38
Depends on: S-028 (Exchange Rate Input)
Blocks: S-030 (Filter Transactions)

---

Overview

Two focused UI enhancements:
  1. portfolio_name in TransactionsPage table → clickable Link to /portfolios/:id
  2. Portfolio dropdown in AddTransactionDialog → each option shows type badge + name

Zero new i18n keys. portfolios.types.* already existed from S-019.
Smallest footprint story in E5.

---

What Was Built

1. i18n — 0 keys added

portfolios.types.* keys (cash_usd / cash_syp / gold / project) reused directly.
No new keys required.

---

2. TransactionsPage.tsx — 1 targeted change

Portfolio TableCell:
```tsx
// BEFORE
<TableCell className="text-sm text-[#1E293B]">{tx.portfolio_name}</TableCell>

// AFTER
<TableCell>
  <Link to={ROUTES.PORTFOLIO(tx.portfolio_id)}
        className="text-sm text-[#1E5DC4] hover:underline">
    {tx.portfolio_name}
  </Link>
</TableCell>
```

ROUTES import path verified from PortfolioDetailPage.tsx — not guessed.

---

3. AddTransactionDialog.tsx — 2 targeted changes

Change 1 — PortfolioOption extended:
```ts
interface PortfolioOption {
  id:   string;
  name: string;
  type: 'cash_usd' | 'cash_syp' | 'gold' | 'project';  // ← added
}
// fetchPortfolioOptions: .select('id, name, type')
```

Change 2 — portfolioTypeBadgeClass() helper + enriched SelectItem:
```tsx
<SelectItem key={p.id} value={p.id}>
  <span className="flex items-center gap-2">
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium
                      ${portfolioTypeBadgeClass(p.type)}`}>
      {t(`portfolios.types.${p.type}`)}
    </span>
    <span>{p.name}</span>
  </span>
</SelectItem>
```

Color mapping: cash_usd=green · cash_syp=amber · gold=amber · project=blue (STR-004)
File remains self-contained — helper defined locally, not imported.

---

4. Commits

```
feat(transactions): make portfolio name a link to portfolio detail in TransactionsPage
feat(transactions): show portfolio type badge in portfolio dropdown of AddTransactionDialog
feat(s-029): link transaction to portfolio
```

---

Final Verification (S-029): All checks ✅

================================================================================

S-030 — Filter Transactions
فلترة المعاملات (بالنوع / التاريخ / المحفظة)
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #40
Depends on: S-029 (Link Transaction to Portfolio)
Blocks: S-031 (Search Transactions)

---

Overview

Adds a filter bar to TransactionsPage allowing client-side filtering by type,
portfolio, and date range. A dedicated TransactionsFilters component is created
(with exported props interface) so S-031 can extend it cleanly.

Filtering is client-side — full dataset already in React Query cache.
No new Supabase queries per filter interaction.

---

What Was Built

1. i18n — 9 keys added inside EXISTING transactions.filters object

  label · type · allTypes · portfolio · allPortfolios
  dateFrom · dateTo · clearAll · showing

---

2. TransactionsFilters — src/components/transactions/TransactionsFilters.tsx (NEW)

Props interface (exported — consumed by S-031):
```ts
export interface TransactionsFiltersProps {
  filterType / filterPortfolio / filterDateFrom / filterDateTo: state values
  portfolioOptions / hasActiveFilters / resultCount / totalCount: display data
  onTypeChange / onPortfolioChange / onDateFromChange / onDateToChange / onClearAll: handlers
}
```

Layout: single card row (rounded-lg border bg-white) with flex-wrap.
  Type filter: 4 buttons (all + income + expense + transfer)
    "الكل" active: bg-[#1E293B] text-white
    Type active:   typeBadgeClass() colors
    Inactive:      bg-[#F1F5F9] text-[#475569]
  Portfolio filter: Shadcn Select, 'all' sentinel value
  Date From / Date To: <Input type="date"> h-8 w-36
  Results count: t('transactions.filters.showing').replace('{count}').replace('{total}')
  Clear button: shown only when hasActiveFilters=true

---

3. TransactionsPage.tsx — 4 targeted additions

  fetchPortfolioOptions() helper added (checked for pre-existence first)
  ['portfolios-simple'] query — hits warm cache from AddTransactionDialog
  4 filter states + hasActiveFilters + filteredTransactions (useMemo) + handleClearFilters
  TransactionsFilters rendered between header and table
  Table map: transactions → filteredTransactions

---

4. Commits

```
feat(i18n): add transactions.filters.* namespace to ar and en locales
feat(transactions): implement TransactionsFilters component
feat(transactions): wire filter state and filteredTransactions into TransactionsPage
feat(s-030): add transaction filters by type, portfolio and date range
```

---

Issues Encountered & Resolved (S-030)

#   Issue                                   Resolution
1   fetchPortfolioOptions may already        Explicit audit instruction: check first,
    exist in TransactionsPage from           add only if absent. No duplication occurred.
    prior stories

---

Final Verification (S-030): All checks ✅

================================================================================

S-031 — Search Transactions
بحث في المعاملات
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #42 (inferred)
Depends on: S-030 (Filter Transactions)
Blocks: S-032 (Edit and Delete Transaction)

---

Overview

Extends existing filter bar with a free-text search field.
Smallest story in E5: 2 i18n keys, 2 props added to existing component,
4 targeted changes to TransactionsPage.

Search is case-insensitive. Searches: portfolio_name · category · notes.
Works in combination with all type/portfolio/date filters simultaneously.

---

What Was Built

1. i18n — 2 keys added inside EXISTING transactions.filters object

  transactions.filters.search
  transactions.filters.searchPlaceholder

---

2. TransactionsFilters.tsx — 2 targeted changes

  filterSearch: string and onSearchChange: (v: string) => void added to
  TransactionsFiltersProps (interface was already exported from S-030).

  Search Input inserted at the START of the flex row (before type filter):
  h-8 w-52 — same height as other filter controls.

---

3. TransactionsPage.tsx — 4 targeted changes

  filterSearch state · hasActiveFilters extended (|| filterSearch !== '') ·
  search predicate appended inside useMemo filter callback:
    case-insensitive, trims whitespace, searches 3 fields ·
  setFilterSearch('') added to handleClearFilters ·
  2 new props passed to <TransactionsFilters>

---

4. Commits

```
feat(i18n): add transactions.filters.search and searchPlaceholder keys
feat(transactions): add free-text search to TransactionsFilters and TransactionsPage
feat(s-031): add free-text search to transaction filters
```

---

Final Verification (S-031): All checks ✅

================================================================================

S-032 — Edit and Delete Transaction
تعديل وحذف المعاملة
Epic: E5 — المعاملات المالية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
PR: #44
Depends on: S-031 (Search Transactions)
Blocks: Sprint 3 close → STR-005 v1.2

---

Overview

Two deliverables:
  1. EditTransactionDialog — pre-populated form, same fields as Add dialog,
     UPDATE on submit.
  2. Delete confirmation — inline AlertDialog in TransactionsPage, DELETE on
     confirm.

Both wire the previously-disabled Edit/Delete action buttons in the table.
Shadcn AlertDialog installed in this story.

Key edit behaviour: exchange_rate is preserved from the original transaction
when opening the edit dialog. Auto-fill from latest rate only triggers if the
original exchange_rate was NULL.

---

What Was Built

1. i18n — 11 keys added

  Inside EXISTING transactions.dialog (7 keys):
    editTitle · updateSubmit · updating ·
    deleteTitle · deleteDescription · deleteConfirm · deleteCancel

  Inside EXISTING transactions.toast (4 keys):
    updateSuccess · updateError · deleteSuccess · deleteError

---

2. EditTransactionDialog — src/components/transactions/EditTransactionDialog.tsx (NEW)

Schema: editTransactionSchema — identical to addTransactionSchema from S-028
  (same fields, same z.string().refine() for exchange_rate, same .superRefine()).
  Named editTransactionSchema / EditTransactionFormData per STR-005 §7 conventions.

  ⚠️ STR-005 §6.3 was outdated at this story's time — explicitly ignored in
  implementation. §6.3 corrected in STR-005 v1.2 update post-sprint.

Resolver: zodResolver(editTransactionSchema) as unknown as Resolver<EditTransactionFormData>

Two useEffects:
  1. Pre-populate form when transaction prop changes:
     reset({ all fields from transaction, exchange_rate: String(tx.exchange_rate) ?? '' })

  2. Auto-fill exchange_rate only when original was NULL:
     if SYP && latestRate && !transaction?.exchange_rate → setValue(String(latestRate))
     if USD → setValue('')
     Condition !transaction?.exchange_rate preserves user's original rate when editing.

onSubmit: Supabase .update({...}).eq('id', transaction.id)
  journal_entry_id: omitted (stays NULL — Sprint 6 concern)

File is self-contained: fetchPortfolioOptions(), fetchLatestExchangeRate(),
typeBadgeClass(), portfolioTypeBadgeClass(), amountTextClass() all duplicated
locally. No cross-file imports within the transactions components.

---

3. TransactionsPage.tsx — 4 targeted additions

  Imports: useQueryClient + EditTransactionDialog + AlertDialog components
  State: selectedTransaction (Transaction|null) · deleteTransactionId (string|null) ·
    isDeleting (boolean — prevents double-submit during DELETE)
  Edit/Delete buttons: disabled removed, onClick wired
  handleDeleteConfirm: Supabase .delete().eq('id', ...) + cache invalidation
  <EditTransactionDialog> + <AlertDialog> rendered before closing </div>

AlertDialog delete button: bg-[#C0392B] hover:bg-[#922B21] — danger red per STR-004.
isDeleting disables both Cancel and Delete during in-flight request.

---

4. Commits

```
feat(i18n): add transactions dialog edit/delete and toast update/delete keys
feat(transactions): implement EditTransactionDialog with pre-populated form and UPDATE logic
feat(transactions): wire Edit/Delete buttons and AlertDialog in TransactionsPage
feat(s-032): implement edit and delete transaction
```

---

Issues Encountered & Resolved (S-032)

#   Issue                                   Resolution
1   STR-005 §6.3 documented incorrect        §6.3 explicitly overridden in prompt.
    schema patterns (z.coerce.date(),        STR-005 updated to v1.2 post-sprint
    z.coerce.number().optional(),            with correct Transactions schema.
    z.string().uuid() for portfolio_id)

---

Final Verification (S-032): All checks ✅

================================================================================

Post-Sprint Update — STR-005 v1.2

Status: ✅ Updated after Sprint 3 close
Triggered by: Discrepancies between §6.3 and actual implemented code

Changes from v1.1 → v1.2:
  §4.1 NEW  — zodResolver(...) as unknown as Resolver<T> cast rule
  §5.4 FIX  — z.string().min(1) for required dates; z.coerce.date() prohibited
  §5.6 FIX  — z.string().min(1) for Select dropdowns; z.string().uuid() only for free inputs
  §5.7 NEW  — .superRefine() cross-field validation pattern with full example
  §6.3 FIX  — Transactions schema replaced with actual implemented code
  §6.5/6.6  — Date fields corrected to match §5.4
  §8   +4   — New anti-patterns added
  §9   +5   — New decision log entries dated 2026-06-06

================================================================================

E5 — Canonical Rules Established This Sprint

The following rules were discovered or solidified during Sprint 3 and apply
to all future sprints:

1. journal_entry_id = NULL throughout Sprint 3
   All source tables (transactions) have journal_entry_id column. It remains
   NULL until Sprint 6 (E6) builds the accounting posting layer. Never display
   or set this field in the UI before Sprint 6.

2. exchange_rate = NULL for USD transactions
   Always pass null explicitly. Never omit. Makes intent clear in the codebase.

3. zodResolver(...) as unknown as Resolver<T> required with .superRefine()
   When a schema uses .superRefine(), the resolver type inference breaks.
   The cast is the established fix for this project. See STR-005 §4.1.

4. z.string().min(1) for required date fields — NOT z.coerce.date()
   Supabase expects string (yyyy-MM-dd). z.coerce.date() converts to Date
   object which then needs re-serialization. See STR-005 §5.4.

5. Never use <SelectItem value=""> (Radix UI constraint)
   Discovered in E4 hotfix, confirmed in E5 design. Use 'all' as sentinel
   value for "all portfolios" / "all types" states. For empty-data states,
   use a non-interactive <div> instead of <SelectItem value="">.

6. Self-contained transaction components
   Each dialog (Add / Edit) duplicates shared helpers locally (typeBadgeClass,
   portfolioTypeBadgeClass, fetch functions). No cross-file imports between
   transaction components. Consistent with existing portfolio component pattern.

================================================================================

E5 — Deferred Items (Post-MVP Backlog)

---

Deferred Item 1 — Accounting Posting (journal_entry_id)

All transactions recorded in Sprint 3 have journal_entry_id = NULL.
These are "pre-accounting" records — stored but not reflected in any
financial statement (P&L, balance sheet, partner capital).

Implementation scope (Sprint 6, E6):
  - For each transaction: create journal_entry + journal_entry_lines
  - Set transactions.journal_entry_id = journal_entry.id
  - Implement posting status lifecycle: draft → posted → reversed
  - Enforce balance check: Σ debit = Σ credit before posting

Decision: Correct architectural separation. Raw transaction data is captured
now; double-entry logic is built in E6 when capital accounts are also ready.

---

Deferred Item 2 — Portfolio Balance Derived from Transactions

PortfolioDetailPage.tsx (S-025) already calculates balance from transactions
table (income − expense). This works for display purposes. However, the
formal balance — reflected in partner capital accounts — is not updated until
the transaction is posted as a journal entry (Sprint 6).

Decision: S-025 display balance is a convenience aggregate. Authoritative
balance flows from journal_entry_lines in E6.

---

Deferred Item 3 — Search Debounce

S-031 search fires on every keystroke (onChange). For larger datasets this
could cause unnecessary re-renders. A 150–300ms debounce would improve
performance.

Implementation: wrap setFilterSearch in useCallback + setTimeout, or use
a dedicated useDebouncedValue hook.

Decision: Dataset is small (family use case). Debounce deferred until
performance testing reveals a real issue post-MVP.

---

Deferred Item 4 — Transfer Transaction Counterpart

Transfer type inserts one transaction row linked to one portfolio.
A proper inter-portfolio transfer requires two rows: one expense on the
source portfolio and one income on the destination portfolio.

Current behaviour: transfer is recorded as a single row with no counterpart.
This means the source portfolio balance decreases correctly but the
destination portfolio balance does not increase.

Implementation scope (post-MVP):
  - UI: add "destination portfolio" field when type = 'transfer'
  - Logic: insert two transaction rows atomically (Supabase RPC or two inserts)
  - Display: link both rows visually in the list

Decision: Current single-row transfer is acceptable for MVP tracking purposes.
Full double-sided transfer deferred to post-MVP refinement.