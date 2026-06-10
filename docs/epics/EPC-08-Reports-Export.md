EPC-08 — Reports & Export
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done

---

Stories Overview

Story   Title                                             Status
------  ------------------------------------------------  -------
S-068   P&L Report (Profit & Loss Statement)             ✅ Done
S-069   Partner Equity Statement                         ✅ Done
S-070   Partner Account Statement                        ✅ Done
S-071   Simplified Balance Sheet                         ✅ Done
S-072   Period & Entity Filters for Reports              ✅ Done
S-073   PDF Export for All Report Sections               ✅ Done
S-074   PDF RTL Formatting (Print Header + Page Numbers) ✅ Done

---

================================================================================

S-068 — P&L Report (Profit & Loss Statement)
تقرير الأرباح والخسائر
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: Sprint 8 merged to main (S-061–S-067 complete)
Blocks    : S-069 (Partner Equity Statement)

---

Overview

Foundation story for Epic E8. Builds the Reports module scaffold and
implements the first report — Profit & Loss — as the default active tab.

Report computes income and expenses from three raw operational tables
(no journal entry posting layer — journal_entry_id = NULL throughout MVP):
  - transactions (type IN 'income','expense') filtered by date range
  - lease_payments filtered by paid_date
  - property_expenses WHERE paid_date IS NOT NULL filtered by paid_date

Period filter: dateFrom / dateTo with Apply button pattern (committed state).
Default period: first day of current month → today.

Display: 3 summary cards (income / expenses / net P&L) + 2-level breakdown
table with section headers, sub-totals, and a disabled PDF export button
(placeholder wired in S-073).

---

What Was Built

1. Audit Findings (Phase 0)

  - ROUTES.REPORTS, /reports router entry, and nav.reports sidebar item
    were all already in place from prior sprints — no routing work needed.
  - Baseline npx tsc --noEmit: 0 errors.

---

2. i18n — 24 keys added under reports.* namespace

Sub-namespace             Keys
------------------------  -------------------------------------------------------
reports (root)            title
reports.tabs              pl · equity · partnerStatement · balance · comingSoon
reports.pl                title · periodFrom · periodTo · apply · exportPdf
                          sectionIncome · sectionExpenses
                          totalIncome · totalExpenses · netPl
                          portfolioIncome · rentalIncome
                          portfolioExpenses · propertyExpenses
                          uncategorizedIncome · uncategorizedExpense
                          empty · error · retry

---

3. ReportsPage — src/pages/ReportsPage.tsx

Full replacement of existing placeholder stub.
4-tab shell: pl (active) · equity · partnerStatement · balance
Non-active tabs render t('reports.tabs.comingSoon') until respective stories.
activeTab state (default: 'pl').

---

4. PLReportSection — src/components/reports/PLReportSection.tsx (NEW)

6 parallel TanStack Query fetches:
  ['pl-report-transactions',      dateFrom, dateTo]   staleTime: 30s
  ['pl-report-lease-payments',    dateFrom, dateTo]   staleTime: 30s
  ['pl-report-property-expenses', dateFrom, dateTo]   staleTime: 30s
  ['pl-report-portfolios']                            staleTime: 300s
  ['pl-report-leases-properties']                     staleTime: 300s
  ['pl-report-properties']                            staleTime: 300s

useMemo derivation: income grouped by category (portfolio), lease payments
grouped by lease/property, expenses grouped by category, property expenses
grouped by type.

SYP → USD: amount / exchange_rate; null rate → 0.
Apply button commits appliedFrom/appliedTo — queries refetch only on Apply.
Sub-components: PLReportSkeleton (internal), error state, empty state.
Disabled "تصدير PDF" button (placeholder — wired in S-073).

---

5. Commits

```
feat(reports): S-068 — P&L report with period filter
feat(i18n): add reports.* namespace (tabs + pl keys) to ar and en locales
```

---

Issues Encountered & Resolved (S-068)

None. Implementation matched spec exactly.

---

Final Verification (S-068): All checks ✅

================================================================================

S-069 — Partner Equity Statement
قائمة حقوق الشركاء
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-068 merged to feature/sprint-09
Blocks    : S-070 (Partner Account Statement)

---

Overview

Activates the 'equity' tab in ReportsPage. Shows each partner's closing
capital balance across all their accounts (portfolios + properties).
ALL-TIME cumulative — no period filter (that is S-072).

Architecture rules applied:
  Rule 1 — Polymorphic entity join: portfolios and properties fetched
    separately, matched client-side. Separate query keys prevent cache
    pollution of the shared ['portfolios'] / ['properties'] caches.
  Rule 2 — buildCapitalBreakdown() is single source of truth.

Partners sorted by closing balance DESC. Accent color assigned by
post-sort index per STR-004 §2.4.

---

What Was Built

1. Audit Findings (Phase 0)

  Key discoveries that shaped the implementation:

  a. CapitalBreakdown ACTUAL field names:
       injections · profitShares · lossShares · drawings · reductions
     NOT: capitalInjection · profitShare · lossShare · drawing · capitalReduction
     The spec had incorrect field names; code uses correct ones from capital.ts.

  b. buildCapitalBreakdown second parameter typed as 'USD' | 'SYP',
     not string — avoids TypeScript errors without casts.

  c. React.Fragment with key prop required in partner map loop —
     <> shorthand cannot take key props.

  - Baseline: 0 TypeScript errors.

---

2. i18n — 15 keys added under reports.equity.* namespace

Sub-namespace        Keys
-------------------  -------------------------------------------------------
reports.equity       title · totalEquity · colEntity · colOpening
                     colMovements · colClosing · partnerTotal · grandTotal
                     typeBadgePortfolio · typeBadgeProperty · viewPartner
                     empty · error · retry

---

3. EquityReportSection — src/components/reports/EquityReportSection.tsx (NEW)

5 queries with equity-report-* prefix (distinct from shared caches):
  ['equity-report-capital-accounts']      staleTime: 30s
  ['equity-report-capital-transactions']  staleTime: 30s
  ['equity-report-people']                staleTime: 300s
  ['equity-report-portfolios']            staleTime: 300s
  ['equity-report-properties']            staleTime: 300s

Display: 1 grand total summary card + detail table grouped by partner.
Partner header rows: initials avatar, accent by post-sort index, name,
total closing balance, ExternalLink to ROUTES.PARTNER_DETAIL.
Entity detail rows: 4 columns — entity/badge | opening | net movements | closing.
Net movements = closingBalance − openingBalance (derived, no extra query).
Sub-components: EquityReportSkeleton (internal), error state, empty state.

---

4. Commits

```
feat(reports): S-069 — partner equity statement
feat(i18n): add reports.equity.* keys to ar and en locales
```

---

Issues Encountered & Resolved (S-069)

#   Issue                                  Resolution
--  -------------------------------------  ----------------------------------------
1   Spec had wrong CapitalBreakdown field  Phase 0 audit read capital.ts directly.
    names (capitalInjection etc.)          Correct names used: injections ·
                                           profitShares · lossShares · drawings ·
                                           reductions. Spec acknowledged as wrong.

2   buildCapitalBreakdown currency param   Raw interface fields typed as 'USD'|'SYP'
    typed 'USD'|'SYP' not string —         not string. Generalised to STR-005 §5.8
    TypeScript errors without matching     rule: union types for Supabase interfaces
    interface types.                       passed to typed utility functions.

---

Final Verification (S-069): All checks ✅

================================================================================

S-070 — Partner Account Statement
كشف حساب شريك
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-069 merged to feature/sprint-09
Blocks    : S-071 (Simplified Balance Sheet)

---

Overview

Activates 'partnerStatement' tab. A consolidated capital account statement
for a user-selected partner showing ALL their accounts with full transaction
history and per-account breakdown. ALL-TIME (no period filter — that is S-072).

Difference from S-050 (CapitalStatementPage): S-050 is a single-account
operational page at /capital/:accountId. S-070 is a multi-account consolidated
statement in the Reports section for reporting and PDF output.

Partner dropdown built from people who have at least one capital account.
Transactions query conditional: enabled only when partner selected and
account IDs derived (enabled: !!selectedPartnerId && partnerAccountIds.length > 0).
Opening balance row always shown regardless of period (account stored field,
not a transaction).

---

What Was Built

1. Audit Findings (Phase 0)

  a. CapitalBreakdown field names confirmed: injections · profitShares ·
     lossShares · drawings · reductions (same as S-069 finding).
  b. RawCapitalTransaction.type must be typed as full union
     'capital_injection'|'capital_reduction'|'drawing'|'profit_share'|'loss_share'
     (not string) — required for buildCapitalBreakdown type compatibility.
     Same rule as S-069 currency typing. STR-005 §5.8 confirmed.
  c. getSignedAmount pattern confirmed from CapitalStatementPage (S-050):
     ['capital_injection', 'profit_share'] = positive, all others = negative.
  d. Native <select> used for partner dropdown (not Shadcn Select —
     Radix SelectItem does not support value="").
  - Baseline: 0 TypeScript errors.

---

2. i18n — 22 keys added under reports.partnerStatement.* namespace

Sub-namespace              Keys
-------------------------  -------------------------------------------------------
reports.partnerStatement   title · selectPartner · selectPartnerPlaceholder
                           noPartnerPrompt · openingBalance · closingBalance
                           grandTotal · colDate · colType · colReference
                           colNotes · colAmount
                           typeInjection · typeReduction · typeDrawing
                           typeProfitShare · typeLossShare
                           noTransactions · noAccounts · empty · error · retry

---

3. PartnerStatementSection — src/components/reports/PartnerStatementSection.tsx (NEW)

5 queries with statement-report-* prefix:
  ['statement-report-all-accounts']                  staleTime: 30s   — always on
  ['statement-report-people']                        staleTime: 300s  — always on
  ['statement-report-portfolios']                    staleTime: 300s  — always on
  ['statement-report-properties']                    staleTime: 300s  — always on
  ['statement-report-transactions', partnerId]       staleTime: 30s   — conditional

Display: partner selector → period filter (S-072) → partner header → per-account
sections (opening balance row + transactions ASC + closing balance) → grand total.
Signed amounts: injection/profit_share = positive (+#1A7D4F), all others negative
(−#C0392B). '−' is U+2212 minus sign, not hyphen.
buildCapitalBreakdown() per account (canonical rule 2).
Sub-components: PartnerStatementSkeleton (internal), error states, empty states.

---

4. Commits

```
feat(reports): S-070 — partner account statement
feat(i18n): add reports.partnerStatement.* keys to ar and en locales
```

---

Issues Encountered & Resolved (S-070)

#   Issue                                  Resolution
--  -------------------------------------  ----------------------------------------
1   RawCapitalTransaction.type typed as    Full union type applied per STR-005 §5.8.
    string caused TypeScript errors with   Same pattern as S-069 currency fix.
    buildCapitalBreakdown.

---

Final Verification (S-070): All checks ✅

================================================================================

S-071 — Simplified Balance Sheet
الميزانية المبسطة
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-070 merged to feature/sprint-09
Blocks    : S-072 (Period & Entity Filters)

---

Overview

Activates the 'balance' tab. Simplified balance sheet with three independent
sections: Assets / Liabilities / Partners' Equity. ALL-TIME snapshot.

MVP limitation (shown as a note in the UI): without the journal entry
posting layer, Assets ≠ Liabilities + Equity. Both sides are correct
independently — they come from different computation paths. No artificial
balancing applied.

Assets   : portfolio balances (income − expense) + property estimated values
Liabilities: property_expenses WHERE paid_date IS NULL
Equity   : partner closing balances via buildCapitalBreakdown()

---

What Was Built

1. Audit Findings (Phase 0)

  - Portfolio balance formula confirmed from DashboardPage.tsx:
    income(+) / expense(−) / transfer skipped — same as S-061/S-062.
  - Stub condition in ReportsPage (from S-068–S-070) updated to exclude 'balance'.
  - Explicit portfolioTypeLabel() map used instead of dynamic t() key
    construction — avoids TypeScript strict-mode errors with template literal
    key lookup.
  - Baseline: 0 TypeScript errors.

---

2. i18n — 19 keys added under reports.balance.* namespace

Sub-namespace        Keys
-------------------  -------------------------------------------------------
reports.balance      title · sectionAssets · subPortfolios · subProperties
                     totalAssets · sectionLiabilities · noLiabilities
                     totalLiabilities · sectionEquity · totalEquity
                     totalLiabilitiesEquity
                     typeCashUsd · typeCashSyp · typeGold · typeProject
                     mvpNote · empty · error · retry

---

3. BalanceSheetSection — src/components/reports/BalanceSheetSection.tsx (NEW)

7 queries with balance-report-* prefix:
  ['balance-report-transactions']          staleTime: 30s
  ['balance-report-portfolios']            staleTime: 300s
  ['balance-report-properties']            staleTime: 300s
  ['balance-report-unpaid-expenses']       staleTime: 30s   — .is('paid_date', null)
  ['balance-report-capital-accounts']      staleTime: 30s
  ['balance-report-capital-transactions']  staleTime: 30s
  ['balance-report-people']                staleTime: 300s

Display: 3 summary cards (assets/liabilities/equity) + sectioned table
(assets → liabilities → equity → combined L+E footer) + MVP note (Info icon).
Liabilities empty state: "لا توجد التزامات مسجّلة" inline row.
buildCapitalBreakdown() per account; partners sorted DESC; accent by post-sort
index per STR-004 §2.4.
Sub-component: BalanceSheetSkeleton (internal).

---

4. Commits

```
feat(reports): S-071 — simplified balance sheet
feat(i18n): add reports.balance.* keys to ar and en locales
```

---

Issues Encountered & Resolved (S-071)

#   Issue                                  Resolution
--  -------------------------------------  ----------------------------------------
1   Dynamic t() key construction with      Replaced with explicit portfolioTypeLabel()
    template literals caused TypeScript    map object returning the correct translated
    strict-mode errors.                    string per type. Avoids computed keys.

---

Final Verification (S-071): All checks ✅

================================================================================

S-072 — Period & Entity Filters for Reports
فلترة التقارير بالفترة الزمنية والكيان
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-071 merged to feature/sprint-09
Blocks    : S-073 (PDF Export)

---

Overview

Adds filtering to three existing report sections. No new files.

  PLReportSection         → + entity filter (portfolio / property / all)
  PartnerStatementSection → + period filter (dateFrom / dateTo)
  BalanceSheetSection     → + "as of date" filter (single date snapshot)
  EquityReportSection     → no changes (all-time cumulative by design)

Entity filter encoding: "portfolio:{id}" / "property:{id}" / "" (all).
Apply button pattern: controlled input state + committed applied state.
Queries refetch only on Apply click, not on input change.

---

What Was Built

1. Execution Note — Prompt Splitting

Original single prompt caused Claude Code to consume 22k+ tokens over 20+
minutes without completing. Root cause: simultaneous read + modification of
3 large existing files in one context.

Solution: story split into 4 separate focused prompts:
  Prompt 1: ar.ts + en.ts (5 i18n keys only)
  Prompt 2: PLReportSection.tsx (entity filter only)
  Prompt 3: PartnerStatementSection.tsx (period filter only)
  Prompt 4: BalanceSheetSection.tsx (as-of-date filter only)

Each prompt completed in under 3 minutes. This established the rule:
when a story modifies 3+ large existing files, split into one prompt per file.

---

2. i18n — 5 keys added under reports.filters.* namespace

  reports.filters.entityLabel · allEntities · portfolioPrefix
                  propertyPrefix · asOfDate

reports.pl.periodFrom / periodTo / apply REUSED in PartnerStatementSection
— no duplicate keys added.

---

3. PLReportSection.tsx — entity filter added

New state: entityValue (controlled) + appliedEntityValue (committed).
handleApply updated to commit all three: period + entity simultaneously.

Entity value parsing:
  '' → selectedEntityType = 'all'
  'portfolio:{id}' → selectedEntityType = 'portfolio'
  'property:{id}' → selectedEntityType = 'property'

fetchPLTransactions: optional portfolioId parameter → .eq('portfolio_id', id)
fetchPLPropertyExpenses: optional propertyId parameter → .eq('property_id', id)
Query keys: appliedEntityValue added as 4th element.

useMemo: showPortfolioSections / showPropertySections flags control section
visibility. Rental income filtered client-side via leasesQuery (already loaded).

---

4. PartnerStatementSection.tsx — period filter added

New state: dateFrom / dateTo / appliedFrom / appliedTo.
Default: first day of current year → today.
handleApplyPeriod commits the period.

fetchPartnerTransactions: dateFrom + dateTo parameters added.
Supabase: .gte('date', dateFrom).lte('date', dateTo) appended.
Query key: ['statement-report-transactions', partnerId, appliedFrom, appliedTo].

Opening balance row always shown — it is a stored field, not a transaction.

---

5. BalanceSheetSection.tsx — as-of-date filter added

New state: asOfDate (controlled) + appliedAsOf (committed). Default: today.
handleApplyAsOf commits the date.

Three queries updated with appliedAsOf filter + as 4th key element:
  balance-report-transactions:        .lte('date', appliedAsOf)
  balance-report-unpaid-expenses:     .lte('due_date', appliedAsOf)  [+ existing .is('paid_date',null)]
  balance-report-capital-transactions: .lte('date', appliedAsOf)

Static queries (portfolios / properties / people / capital-accounts)
unchanged — no date filter.

---

6. Commits

```
feat(i18n): add reports.filters.* keys for S-072 entity and period filters
feat(reports): S-072 — add entity filter to PLReportSection
feat(reports): S-072 — add period filter to PartnerStatementSection
feat(reports): S-072 — add as-of-date filter to BalanceSheetSection
feat(reports): S-072 — import BalanceSheetSection in ReportsPage
```

---

Issues Encountered & Resolved (S-072)

#   Issue                                  Resolution
--  -------------------------------------  ----------------------------------------
1   Single large prompt caused Claude Code Split into 4 focused prompts — one file
    to freeze at 20+ minutes / 22k tokens. per prompt. Each completed < 3 minutes.
    Modifications to 3 large files in one  Established as project rule: 3+ large
    context exceeded viable planning depth. file modifications → split prompts.

---

Final Verification (S-072): All checks ✅

================================================================================

S-073 — PDF Export for All Report Sections
تصدير التقارير إلى PDF
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-072 merged to feature/sprint-09
Blocks    : S-074 (PDF RTL Formatting)

---

Overview

Wires the "تصدير PDF" button in all four report sections using the
html2canvas + jsPDF approach. html2canvas captures the report DOM as a
2× resolution image; jsPDF embeds it in an A4 PDF with multi-page support.

Arabic RTL renders correctly in the captured image because the browser
already paints RTL — no Arabic font embedding in jsPDF needed.
S-074 adds print headers and page numbers.

---

What Was Built

1. Audit Findings (Phase 0)

  - jsPDF and html2canvas confirmed in package.json (project tech stack
    since project initialization — no install needed).
  - PartnerStatementSection filename uses today's date (no appliedFrom/To
    committed yet at time of capture) — acceptable; S-072 adds period.
  - Baseline: 0 TypeScript errors.

---

2. i18n — 1 key added

  reports.pl.exporting = 'جارٍ التصدير...'  (under existing exportPdf key)

---

3. src/utils/exportToPDF.ts (NEW)

```typescript
export async function exportToPDF(
  element: HTMLElement,
  fileName: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void>
```

html2canvas options: scale 2 · useCORS true · logging false ·
backgroundColor '#ffffff'.

Multi-page loop: imgWidth=210mm · pageHeight=297mm · add pages while
heightLeft > 0. onEnd() called in finally — loading state always clears.

---

4. Section modifications (pattern applied to all 4)

New per-section: useRef<HTMLDivElement>(null) + isExporting state +
handleExport async function + printRef wrapper on report content.

printRef wraps: summary cards + breakdown/detail content only.
Filter bar excluded from printRef (outside the wrapper div).

Button state:
  disabled: isExporting || isLoading || !hasData
  Active:   text-white bg-[#1E5DC4] cursor-pointer
  Disabled: text-[#94A3B8] bg-[#F1F5F9] opacity-60 cursor-not-allowed

EquityReportSection and PartnerStatementSection: export button added
(was not present in S-069/S-070).
PLReportSection and BalanceSheetSection: disabled placeholder replaced.

Filename conventions:
  PL         : pl-report-{appliedFrom}-{appliedTo}.pdf
  Equity     : equity-report-{today}.pdf
  Statement  : statement-{partnerName}-{today}.pdf
  Balance    : balance-sheet-{appliedAsOf}.pdf

---

5. Commits

```
feat(reports): S-073 — PDF export for all report sections
feat(i18n): add reports.pl.exporting key
```

---

Issues Encountered & Resolved (S-073)

None. Implementation matched spec exactly.

---

Final Verification (S-073): All checks ✅

================================================================================

S-074 — PDF RTL Formatting (Print Header + Page Numbers)
تنسيق صفحة PDF للطباعة
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9
Status: ✅ Done
Closed: Sprint 9
Depends on: S-073 merged to feature/sprint-09
Blocks    : Sprint 9 merge → main

---

Overview

Refines PDF output from S-073 with two additions:
  1. Print-only Arabic header per section (FinFamily branding + report
     title + period/date context)
  2. Page numbers centered at bottom of every PDF page

Mechanism: .pdf-show CSS class on hidden header divs.
exportToPDF.ts reveals .pdf-show elements before html2canvas capture
and restores them in finally — no stuck visible headers on error.

No Arabic font embedding required — html2canvas image capture preserves
browser RTL rendering.

---

What Was Built

1. Audit Findings (Phase 0)

  - Confirmed printRef wrapper location in all 4 section files.
  - Confirmed existing try/finally structure in exportToPDF.ts.
  - Baseline: 0 TypeScript errors.

---

2. src/utils/exportToPDF.ts — 2 additions

Addition 1 — .pdf-show reveal/restore:
  pdfShowEls declared OUTSIDE try (so finally can access).
  Before html2canvas: querySelectorAll('.pdf-show') → style.setProperty
    ('display','block','important') on each.
  After canvas captured (before PDF build): style.removeProperty('display').
  finally: safety restore + onEnd?.().

Addition 2 — Page numbers (before pdf.save()):
  Loop over pdf.getNumberOfPages().
  pdf.setFontSize(9) · pdf.setTextColor(148,163,184) [#94A3B8].
  pdf.text(`${i} / ${total}`, 105, 291, { align: 'center' }).

---

3. Print header added to all 4 section printRef divs

Structure: <div className="pdf-show hidden border-b-2 border-[#E2E8F0] pb-4 mb-6">
  Left  : FinFamily + "إدارة الأصول العائلية"
  Right : localized report title + context line + Arabic export date

Context line per section:
  PLReportSection         : "{appliedFrom} — {appliedTo}"
  EquityReportSection     : omitted (all-time report, no period)
  PartnerStatementSection : "{partnerName} · {appliedFrom} — {appliedTo}"
  BalanceSheetSection     : "{t('reports.filters.asOfDate')}: {appliedAsOf}"

Export date: new Date().toLocaleDateString('ar-SA') — Arabic locale format.

Tailwind 'hidden' = display:none. The !important override in
style.setProperty beats Tailwind during capture. style.removeProperty
restores Tailwind control after capture.

---

4. i18n — no new keys

Existing t('reports.pl.title') · t('reports.equity.title') ·
t('reports.partnerStatement.title') · t('reports.balance.title') ·
t('reports.filters.asOfDate') reused in print headers.

---

5. Commits

```
feat(reports): S-074 — print header and page numbers for PDF export
```

---

Issues Encountered & Resolved (S-074)

None. Implementation matched spec exactly.

---

Final Verification (S-074): All checks ✅

================================================================================

Post-Story Update — STR-005 v1.4
Status: ✅ Applied (2026-06-10)

Two additions relative to v1.3:

§5.8 (NEW) — Union Types for Supabase Data Interfaces
  When Supabase query result interfaces are passed to typed utility functions
  (e.g. buildCapitalBreakdown), fields with database CHECK constraints must
  be typed as union types, not string.
  Discovered S-069 / confirmed S-070:
    currency: 'USD' | 'SYP'  (not string)
    capital_transactions.type: full 5-value union  (not string)
  Anti-pattern added to §8.

§6.8–6.13 (NEW) — Missing schemas documented
  Schemas for S-035/S-040/S-041/S-048/S-049/S-052 (Sprints 4–6) were
  absent from §6. All six added with exact field types and cast notes.

================================================================================

E8 — Canonical Rules Established This Sprint

1. Report query key prefixes — cache isolation
   Every report section uses a unique prefix for its query keys to prevent
   cache pollution of shared operational caches:
     PLReportSection         : pl-report-*
     EquityReportSection     : equity-report-*
     PartnerStatementSection : statement-report-*
     BalanceSheetSection     : balance-report-*
   Using generic keys ['portfolios'] or ['capital-accounts'] in report
   sections overwrites the shared cache used by operational pages with
   date-filtered or column-reduced subsets — a silent data bug.

2. buildCapitalBreakdown() — correct field names
   Return fields: injections · profitShares · lossShares · drawings ·
   reductions · openingBalance · closingBalance
   NOT: capitalInjection · profitShare · lossShare · drawing · capitalReduction
   These field names appear correctly only in src/utils/capital.ts —
   specs and prompts must be validated against the source file in Phase 0.

3. Union types for Supabase interfaces (→ STR-005 §5.8)
   Fields with CHECK IN (...) constraints in DB must be typed as union types
   in TypeScript interfaces, not string, when data is passed to typed utility
   functions. Failure is a TypeScript error at the call site, not the
   interface definition — harder to trace.

4. Apply button pattern — committed state
   All report filters follow: controlled input state + separate applied/committed
   state. queryKey includes the applied value. Queries refetch only on Apply,
   not on every keystroke.

5. Large prompt splitting rule
   When a single story requires modifying 3+ large existing files, split into
   one focused prompt per file. Single combined prompts on large contexts cause
   Claude Code to stall (20+ minutes, 22k+ tokens). Each focused prompt
   completes in under 3 minutes.

6. html2canvas image-based PDF — RTL handling
   The html2canvas approach captures the browser's visual output as a 2×
   resolution image. Arabic RTL text is preserved automatically — the browser
   renders it correctly and the image captures it as-is. No Arabic font
   embedding in jsPDF is needed. This is the canonical approach for RTL PDF
   export in this project.

7. .pdf-show reveal mechanism
   Print-only elements use Tailwind class 'hidden' (display:none) in the browser.
   exportToPDF.ts overrides with style.setProperty('display','block','important')
   before html2canvas, then style.removeProperty('display') restores Tailwind
   control. pdfShowEls array declared outside try so finally can safely restore
   even on error.

8. CapitalBreakdown signed amount convention (confirmed from S-050)
   capital_injection + profit_share → positive amounts (+, #1A7D4F)
   capital_reduction + drawing + loss_share → negative amounts (−, #C0392B)
   '−' is U+2212 minus sign, not ASCII hyphen '-'.

================================================================================

E8 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — Dashboard Period Selector

EPC-07 Deferred Item 1 called for a period selector on the Dashboard once
Sprint 9 established the filtering patterns. The Apply-button committed-state
pattern from S-072 is now the canonical approach.

Scope: add dateFrom/dateTo committed state to DashboardPage; wire PLIndicatorCard
(S-067) and possibly RecentTransactionsTable (S-064) to filter by period.
Depends on: Apply-button pattern (S-072) — now available.

Deferred Item 2 — Equity Report Period Filter

EquityReportSection was intentionally left without a period filter in S-072
(all-time by design for the MVP equity statement). A future enhancement could
add a "as of date" filter that filters capital_transactions by date, showing
equity at a historical point in time.

Scope: same as BalanceSheetSection as-of filter (S-072) but applied to
equity-report-capital-transactions query.

Deferred Item 3 — PDF Filename with Applied Period (PartnerStatement)

In S-073, PartnerStatementSection PDF filename uses today's date because
appliedFrom/appliedTo were committed state from S-072 — the two stories
ran sequentially and the filename was designed before S-072 landed.
A future cleanup should update the filename to use appliedFrom/appliedTo.

Scope: one-line change in PartnerStatementSection handleExport.

Deferred Item 4 — Balance Sheet Reconciliation Note

The MVP balance sheet does not balance (Assets ≠ Liabilities + Equity)
because each section draws from an independent data source without the
journal entry posting layer. A mvpNote is displayed in the UI.

Once the double-entry posting layer is activated (post-MVP), all transactions
will flow through journal_entries → the balance sheet will balance naturally.
The mvpNote should be removed at that point.

Deferred Item 5 — Report Data Entry Propagation

Three architectural gaps discovered during Sprint 9 testing:
  a. capital_injection does not increase portfolio balance
  b. drawing does not decrease portfolio balance
  c. property_expenses and lease_payments do not affect portfolio balance
All three require the journal entry posting layer (STR-006) for automatic
propagation. Dual manual entry (capital transaction + transactions table)
is the workaround until post-MVP.