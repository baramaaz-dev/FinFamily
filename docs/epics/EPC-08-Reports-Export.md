EPC-08 — Reports & Export
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 9 & 13
Status: 🔄 In Progress (Sprint 13)

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
S-102   Trial Balance Page                               ✅ Done
S-104   Rebuild Reports from General Ledger              ✅ Done

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

feat(reports): S-068 — P&L report with period filter
feat(i18n): add reports.* namespace (tabs + pl keys) to ar and en locales

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

feat(reports): S-069 — partner equity statement
feat(i18n): add reports.equity.* keys to ar and en locales

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

feat(reports): S-070 — partner account statement
feat(i18n): add reports.partnerStatement.* keys to ar and en locales

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

feat(reports): S-071 — simplified balance sheet
feat(i18n): add reports.balance.* keys to ar and en locales

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
  balance-report-transactions:         .lte('date', appliedAsOf)
  balance-report-unpaid-expenses:      .lte('due_date', appliedAsOf)
  balance-report-capital-transactions: .lte('date', appliedAsOf)

Static queries (portfolios / properties / people / capital-accounts)
unchanged — no date filter.

---

6. Commits

feat(i18n): add reports.filters.* keys for S-072 entity and period filters
feat(reports): S-072 — add entity filter to PLReportSection
feat(reports): S-072 — add period filter to PartnerStatementSection
feat(reports): S-072 — add as-of-date filter to BalanceSheetSection
feat(reports): S-072 — import BalanceSheetSection in ReportsPage

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

  reports.pl.exporting = 'جارٍ التصدير...'

---

3. src/utils/exportToPDF.ts (NEW)

export async function exportToPDF(
  element: HTMLElement,
  fileName: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void>

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

Filename conventions:
  PL         : pl-report-{appliedFrom}-{appliedTo}.pdf
  Equity     : equity-report-{today}.pdf
  Statement  : statement-{partnerName}-{today}.pdf
  Balance    : balance-sheet-{appliedAsOf}.pdf

---

5. Commits

feat(reports): S-073 — PDF export for all report sections
feat(i18n): add reports.pl.exporting key

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
  After canvas captured: style.removeProperty('display').
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

Export date: new Date().toLocaleDateString('ar-SA').

---

4. Commits

feat(reports): S-074 — print header and page numbers for PDF export

---

Issues Encountered & Resolved (S-074)

None. Implementation matched spec exactly.

---

Final Verification (S-074): All checks ✅

================================================================================

Post-Story Update — STR-005 v1.4
Status: ✅ Applied (2026-06-10)

§5.8 (NEW) — Union Types for Supabase Data Interfaces
  When Supabase query result interfaces are passed to typed utility functions,
  fields with database CHECK constraints must be typed as union types, not string.
  Discovered S-069 / confirmed S-070.

§6.8–6.13 (NEW) — Missing schemas documented
  Schemas for S-035/S-040/S-041/S-048/S-049/S-052 added with exact field
  types and cast notes.

================================================================================

E8 — Canonical Rules Established in Sprint 9

1. Report query key prefixes — cache isolation
   Every report section uses a unique prefix for its query keys:
     PLReportSection         : pl-report-*
     EquityReportSection     : equity-report-*
     PartnerStatementSection : statement-report-*
     BalanceSheetSection     : balance-report-*

2. buildCapitalBreakdown() — correct field names
   injections · profitShares · lossShares · drawings · reductions ·
   openingBalance · closingBalance

3. Union types for Supabase interfaces (→ STR-005 §5.8)
   Fields with CHECK IN (...) constraints must be union types, not string.

4. Apply button pattern — committed state
   Queries refetch only on Apply, not on every keystroke.

5. Large prompt splitting rule
   3+ large existing files in one story → one focused prompt per file.

6. html2canvas image-based PDF — RTL handling
   Browser renders RTL correctly; image captures it as-is. No Arabic font
   embedding in jsPDF needed.

7. .pdf-show reveal mechanism
   'hidden' overridden with style.setProperty('display','block','important').
   Declared outside try so finally can safely restore on error.

8. CapitalBreakdown signed amount convention
   capital_injection + profit_share → positive (+, #1A7D4F)
   capital_reduction + drawing + loss_share → negative (−, #C0392B)
   '−' is U+2212 minus sign, not ASCII hyphen.

================================================================================

============================================================================
Sprint 13 — GL-Based Reports (E8 Stories)
============================================================================

S-102 — Trial Balance Page (ميزان المراجعة)
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-100 (entries must be posted to appear in general_ledger)
            S-101 (reversal entries must appear in general_ledger)
            S-095 (general_ledger VIEW rebuilt with entry_status)
Blocks: S-103 (Period Closing — reads trial balance for validation)
        S-104 (Rebuild Reports — same data source)

---

Overview

Builds a standalone trial balance page at /reports/trial-balance reading
exclusively from the general_ledger VIEW (posted entries only). Lists every
account with total debits, total credits, and net balance for a selected date
range, grouped by account class. Verifies Σ debits = Σ credits automatically.
Includes PDF export via jsPDF + html2canvas.

This is the first report in the project to query the general_ledger VIEW
directly — establishing the GL-query pattern used by S-104.

---

What Was Built

1. New Files (4)

  src/types/trialBalance.ts
    AccountClass union type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    NormalBalance union type: 'debit' | 'credit'
    TrialBalanceRow interface: account_code, account_name, account_class,
      normal_balance, total_debit, total_credit, net_balance
    TrialBalanceSummary interface: rows[], grand_total_debit, grand_total_credit,
      is_balanced, as_of_date, period_label

  src/lib/supabase/trialBalance.ts
    getTrialBalance(dateFrom, dateTo): Promise<TrialBalanceSummary>
      Queries general_ledger VIEW with .gte/.lte on entry_date.
      Client-side aggregation by account_code via Map (Supabase does not
      support GROUP BY on Views via the JS client).
      Sorts by account_code ASC; computes net_balance and is_balanced.
    getCurrentPeriodRange(): Promise<{ from: string; to: string }>
      Finds open accounting_period for today's date.
      Fallback: current calendar year start → today.

  src/hooks/useTrialBalance.ts
    useTrialBalance(dateFrom, dateTo): staleTime 30_000
    queryKey: ['trial-balance', dateFrom, dateTo]
    enabled: Boolean(dateFrom && dateTo)

  src/pages/TrialBalancePage.tsx
    applied state pattern (dateFrom/dateTo controlled + appliedFrom/appliedTo
      committed) — same as all other report pages.
    useEffect on mount: calls getCurrentPeriodRange() to set default range.
    Three quick-select buttons: الفترة الحالية · هذا العام · هذا الشهر
    Balance banner:
      is_balanced → success green bg-[#EBF5F0] text-[#1A7D4F]
      not balanced → danger red  bg-[#FEF0EF] text-[#C0392B] + difference amount
    Grouped table: 5 account class groups (CLASS_ORDER constant) with group
      header rows (bg-slate-100) and subtotal columns.
    Footer totals row: grand totals + net column (green if balanced, red if not).
    Zero amounts displayed as "—" not "0.00".
    PDF export: landscape A4, scale 2, printRef excludes filter bar.
    Filename: trial-balance-{dateTo}.pdf
    Loading skeleton: 8 animated rows × 5 columns.
    Empty state: Scale icon + "لا توجد قيود مُرحَّلة في هذه الفترة".
    React.Fragment with key={group.class} on grouped tbody rows.

2. Modified Files (5)

  src/router/routes.ts — TRIAL_BALANCE: '/reports/trial-balance'
  src/router/index.tsx — { path: 'reports/trial-balance', element: <TrialBalancePage /> }
  src/pages/ReportsPage.tsx — "ميزان المراجعة" card with Scale icon
  src/i18n/locales/ar.ts — full trialBalance.* namespace
  src/i18n/locales/en.ts — English mirror

---

Key Decisions

- general_ledger VIEW only — no direct table queries.
- Client-side aggregation (not GROUP BY): Supabase JS client does not
  support aggregate functions on Views; Map-based accumulation used instead.
- applied state pattern: queries re-fetch only on "تحديث" click or
  quick-select button — not on every date input keystroke.
- net_balance = total_debit - total_credit (raw, no sign flip by
  normal_balance) — unambiguous for audit purposes.
- staleTime 30s: trial balance changes only on new postings.

---

Issues Encountered & Resolved (S-102)

None. Implementation matched spec exactly.

---

Final Verification (S-102)

Check	Result
/reports/trial-balance renders	✅
Defaults to current open period date range	✅
Table grouped by 5 account classes with subtotals	✅
Balance banner: green when balanced, red with diff when not	✅
Footer totals match column sums	✅
Quick-select buttons update date range	✅
PDF export: landscape A4, filename includes dateTo	✅
Empty state when no posted entries in range	✅
"ميزان المراجعة" card on ReportsPage	✅
npx tsc --noEmit	✅ Zero errors
9 files, new + modified	✅

================================================================================

S-104 — Rebuild Reports from General Ledger
إعادة بناء التقارير من الأستاذ العام
Epic  : E8 — التقارير والتصدير
Sprint: Sprint 13
Status: ✅ Done
Closed: Sprint 13
Depends on: S-102 (GL query pattern established)
            S-103 (closed periods must appear in reports)
Blocks: Sprint 13 merge → main

---

Overview

Rebuilds three financial statement pages (P&L, Partners Equity, Balance Sheet)
to read from the general_ledger VIEW instead of source tables. Reports now
reflect only formally posted, auditable data — not raw table records.

Old source-table helpers preserved (not deleted) — safe rollback path.
New GL-based helpers added alongside them.

Architecture change per report:
  P&L (S-068):          transactions/lease_payments/property_expenses tables
                        → general_ledger WHERE account_class IN ('revenue','expense')
  Partners Equity (S-069): capital_accounts/capital_transactions tables
                        → general_ledger WHERE account_class = 'equity'
  Balance Sheet (S-071): portfolios/properties/capital_accounts tables
                        → general_ledger cumulative (entry_date <= asOfDate, no lower bound)

---

What Was Built

1. New Files (3)

  src/types/reportsGL.ts
    IFRSCategory: 'operating' | 'investing' | 'financing'
    PLAccountRow: account_code, account_name, account_class, ifrs_category,
      net (absolute value), is_income
    PLCategory: category, revenues[], expenses[], total_revenue, total_expense, profit
    PLSummary: categories[], operating_profit, investing_profit, financing_profit,
      net_profit, dateFrom, dateTo
    EquityAccountRow: account_code, account_name, total_debit, total_credit, net_balance
    EquityPartnerSection: label, capital_rows (31XX), current_rows (32XX), net_equity
    EquitySummary: partners[], retained_earnings (3300 | null), total_equity, dateFrom, dateTo
    BSAccountRow: account_code, account_name, account_class, net_balance
    BSSummary: assets[], liabilities[], equity[], total_assets, total_liabilities,
      total_equity, total_liabilities_and_equity, is_balanced, asOfDate

  src/lib/supabase/reportsGL.ts
    getIFRSCategory(accountCode): IFRSCategory
      Code ranges: 4000–4999 = operating rev · 5000–5999 = investing rev ·
      6000–6999 = financing rev · 7000–7999 = operating exp · 8000–8999 =
      investing exp · 9000–9999 = financing exp.

    getProfitLossGL(dateFrom, dateTo): Promise<PLSummary>
      Queries general_ledger WHERE account_class IN ('revenue','expense'),
      entry_date between range. Client-side Map aggregation by account_code.
      Revenue net = credit - debit; expense net = debit - credit (both positive).
      Groups into 3 IFRS categories via getIFRSCategory(). Builds PLSummary
      with operating/investing/financing profit + net_profit.

    getPartnersEquityGL(dateFrom, dateTo): Promise<EquitySummary>
      Queries general_ledger WHERE account_class = 'equity', date range.
      Separates account 3300 (retained earnings) from partner accounts.
      Groups partners by 2-digit suffix (3101/3201 → suffix '01' = same partner).
      net_balance = total_credit - total_debit (equity is credit-normal).

    getBalanceSheetGL(asOfDate): Promise<BSSummary>
      Queries general_ledger WHERE entry_date <= asOfDate (cumulative, no lower bound).
      Asset net = debit - credit; liability/equity net = credit - debit.
      is_balanced = |total_assets - (total_liabilities + total_equity)| < 0.01.

  src/hooks/useReportsGL.ts
    useProfitLossGL(dateFrom, dateTo): queryKey ['pl-gl', dateFrom, dateTo]
    usePartnersEquityGL(dateFrom, dateTo): queryKey ['equity-gl', dateFrom, dateTo]
    useBalanceSheetGL(asOfDate): queryKey ['balance-sheet-gl', asOfDate]
    All: staleTime 30_000, enabled: Boolean(params)

2. Modified Components (3)

  PLReportSection (src/components/reports/PLReportSection.tsx)
    Switched to useProfitLossGL(). Entity filter removed (GL does not filter
    by portfolio/property — entries are booked to accounts, not entities).
    Date filter kept. Old fetch functions preserved via void calls (not deleted).
    Display restructured: 3 IFRS 18 category sections (التشغيل / الاستثمار /
    التمويل) each with revenue sub-table and expense sub-table + category profit.
    Footer: net_profit card (green if positive, red if negative).

  EquityReportSection (src/components/reports/EquityReportSection.tsx)
    Switched to usePartnersEquityGL(). Date filter added (was absent in Sprint 9
    — all-time; now period-aware via GL query). Partner sections derived from
    31XX/32XX account suffixes; retained earnings (3300) shown separately.
    Old source-table queries preserved.

  BalanceSheetSection (src/components/reports/BalanceSheetSection.tsx)
    Switched to useBalanceSheetGL(). asOfDate filter kept (same UX as S-072).
    Balance check banner added (matching trial balance design from S-102):
      is_balanced → green "الميزانية متوازنة ✓"
      not balanced → red "⚠ ميزانية غير متوازنة — الفرق: {diff}"
    MVP note removed (GL data is formally posted — balance equation now holds).
    Old source-table queries preserved.

3. i18n — src/i18n/locales/ar.ts + en.ts

  reportsGL.pl.*      (IFRS category labels, profit/loss labels)
  reportsGL.equity.*  (capital/current account labels, retained earnings, totals)
  reportsGL.bs.*      (section labels, balance check banner, as-of-date label)
  reportsGL.empty / emptyHint

---

Key Decisions

- Old source-table helpers preserved (not deleted): safe rollback; comparison
  baseline during transition to live GL data.
- New helpers in separate files (reportsGL.ts, useReportsGL.ts): zero risk of
  breaking Sprint 9 code paths.
- Balance sheet: cumulative query (entry_date <= asOfDate, no dateFrom) — a
  balance sheet is a snapshot of ALL history, not a period range.
- IFRS category derived from account_code ranges (4000–9999) client-side:
  no new DB column needed; ranges already mandated by STR-006 chart of accounts.
- Partner identification from 31XX/32XX suffix: no people table join needed;
  account_name from accounts table already contains the partner's name.
- Balance sheet MVP note removed: with GL as source, posted entries balance
  naturally (Σ debits = Σ credits in any double-entry system).

---

Issues Encountered & Resolved (S-104)

None. Implementation matched spec exactly.
TypeScript: 0 errors.

---

Final Verification (S-104)

Check	Result
PLReportSection reads from general_ledger	✅
P&L grouped into IFRS 18 operating/investing/financing	✅
EquityReportSection reads equity accounts from GL	✅
Partner sections grouped by 31XX/32XX suffix	✅
BalanceSheetSection uses cumulative GL query (lte only)	✅
Balance check banner on BalanceSheetSection	✅
MVP note removed from balance sheet	✅
Old source-table helpers preserved (not deleted)	✅
PDF export working on all three pages	✅
reportsGL.* i18n keys (ar + en)	✅
npx tsc --noEmit	✅ Zero errors

============================================================================

Sprint 13 E8 Stories — Complete ✅

Story   Deliverable
------  -------------------------------------------------------------------
S-102   Standalone trial balance page at /reports/trial-balance
        First page in project to query general_ledger VIEW directly.
        Establishes GL-query + client-side Map aggregation pattern.
S-104   Three financial statements rebuilt from general_ledger VIEW.
        P&L: IFRS 18 three-category display.
        Equity: partner sections from 31XX/32XX account suffixes.
        Balance Sheet: cumulative GL query + balance check banner.
        Old source-table helpers preserved for rollback.

================================================================================

E8 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — Dashboard Period Selector
  Scope: add dateFrom/dateTo committed state to DashboardPage; wire
  PLIndicatorCard (S-067) and RecentTransactionsTable (S-064) to filter.
  Depends on: Apply-button pattern (S-072) — available.

Deferred Item 2 — Equity Report Period Filter (Sprint 9 version)
  The Sprint 9 EquityReportSection had no period filter by design.
  Sprint 13 S-104 added a date filter to the GL-based version.
  This item is now RESOLVED for the GL version.
  Remaining: Sprint 9 source-table version (preserved but not updated).

Deferred Item 3 — PDF Filename with Applied Period (PartnerStatement)
  PartnerStatementSection PDF filename uses today's date, not appliedFrom/To.
  Scope: one-line change in handleExport. Deferred: low priority.

Deferred Item 4 — Balance Sheet Reconciliation Note (RESOLVED)
  The mvpNote (Assets ≠ Liabilities + Equity) was removed in S-104.
  With GL as data source, posted double-entry transactions balance naturally.
  STATUS: Resolved in Sprint 13.

Deferred Item 5 — Report Data Entry Propagation (RESOLVED)
  Sprint 9 gaps (capital_injection not updating portfolio balance, etc.)
  required the journal entry posting layer (STR-006).
  Sprint 11–13 delivered the full double-entry engine.
  S-104 rebuilt reports from GL — all propagation now flows correctly.
  STATUS: Resolved in Sprint 13.