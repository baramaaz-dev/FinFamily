EPC-07 — Main Dashboard
Epic  : E7 — لوحة التحكم الرئيسية
Sprint: Sprint 8
Status: ✅ Done

---

Stories Overview

Story         Title                                         Status
-----------   -------------------------------------------   -------
S-061         Net Worth Summary Card                        ✅ Done
S-062         Portfolio Balance Cards                       ✅ Done
S-063         Upcoming Obligations Section                  ✅ Done
S-064         Recent Transactions Table                     ✅ Done
S-065         Partner Shares Section                        ✅ Done
S-066         Asset Distribution Chart (Recharts)           ✅ Done
S-067         P&L Indicator — Current Month                 ✅ Done
fix/partners  Partners List Page Hotfix (S-056 gap)         ✅ Done

---

Pre-Sprint Work

fix/partners-list-page — Partners List Page Hotfix
  Discovered before S-067: PartnersPage.tsx at /partners was still the
  S-002 stub ("قيد الإنشاء"). Sprint 7 had built PartnerDetailPage (/partners/:id)
  but never replaced PartnersPage (/partners).
  The "عرض الكل" link in PartnerSharesSection (S-065) navigated to the stub.
  Fixed as a targeted hotfix on main before S-067 began:
    PartnersPage.tsx replaced with a real partners list.
    Fetches all people (id, name, relation), ['people'] query.
    Eye button per row → navigate(ROUTES.PARTNER_DETAIL(person.id)).
    Loading skeleton, empty state, error + retry.
    All STR-004 rules applied.
  Commit: fix(partners): replace stub with real partners list page

react-is peer dependency — Recharts runtime fix (applied mid-sprint after S-066)
  Recharts v2 requires react-is as a peer dependency.
  Not installed by default in the project — caused Vite HMR crash on first
  load after AssetDistributionChart was mounted.
  Fix: npm install react-is
  Commit: fix(deps): add react-is peer dependency for recharts
  Rule going forward: any new Recharts usage in future sprints requires
  confirming react-is is present.

================================================================================

S-061 — Net Worth Summary Card
بطاقة صافي الثروة الإجمالي
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: Sprint 7 merged to main (S-056 → S-060 complete)
Blocks    : S-062

---

Overview

First story of Sprint 8. Two deliverables:
  A. Scaffolded DashboardPage layout grid — structural foundation for all
     Sprint 8 stories (S-062 → S-067 each replace one TODO placeholder).
  B. NetWorthCard — total family net worth in USD.

Net Worth formula (asset view — NOT capital-account view):
  Net Worth (USD) = Σ portfolio_balance_USD + Σ property_estimated_value_USD

  Portfolio balance: income transactions (+) minus expense transactions (−),
    transfer transactions excluded entirely.
  SYP conversion: amount / exchange_rate (null rate → 0, never throw).
  Property value: Σ properties.estimated_value (assumed USD — no currency column).

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - dashboard top-level key absent from ar.ts and en.ts
  - DashboardPage.tsx was a 12-line stub from S-002
  - src/components/dashboard/ directory did not exist — created

---

2. i18n — 7 keys added per locale under top-level dashboard.* namespace

  dashboard.title
  dashboard.netWorth.title · subtitle · portfolios · properties ·
  currencyNote · error · retry

---

3. Files Created

  src/components/dashboard/NetWorthCardSkeleton.tsx
    - 5 animate-pulse lines matching card shape
    - ms-4 for RTL-safe spacing

  src/components/dashboard/NetWorthCard.tsx
    - Props: portfolioBalanceUSD · propertyValueUSD · isLoading · isError · onRetry
    - Computes total = portfolioBalanceUSD + propertyValueUSD internally
    - signColor() + formatUSD() (Intl.NumberFormat) defined inline
    - Routes to skeleton or error state before normal render
    - font-mono on all financial figures · hex colors only

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - Replaced stub with <div className="p-6 space-y-3"> outer wrapper
    - fetchNetWorthTransactions() + fetchPropertyValues() outside component
    - ['dashboard-net-worth-transactions'] staleTime 60s
    - ['dashboard-property-values'] staleTime 60s
    - portfolioBalanceUSD useMemo (income − expense, SYP converted)
    - propertyValueUSD useMemo (sum of estimated_value, null-safe)
    - TODO placeholders S-062 → S-067 as comments

  src/i18n/locales/ar.ts + en.ts — dashboard.* top-level key added

---

Issues Encountered & Resolved (S-061)

None. Implementation matched spec exactly.

---

Final Verification (S-061): All checks ✅

================================================================================

S-062 — Portfolio Balance Cards
بطاقات المحافظ المالية مع الأرصدة
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: S-061
Blocks    : S-063

---

Overview

Adds a portfolio balance cards section below NetWorthCard. One card per
portfolio showing type badge, name, net USD balance, and members count.
Clicking a card navigates to /portfolios/:id.

['portfolios'] query key reused — shared cache with PortfoliosPage.
typeBadgeClass() hex map replicated from PortfoliosPage exactly.

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - Portfolio + PortfolioStats interfaces confirmed in src/types/index.ts
  - typeBadgeClass() hex map confirmed in PortfoliosPage — replicated exactly
  - dashboard.portfolios absent from ar.ts
  - ROUTES.PORTFOLIOS and ROUTES.PORTFOLIO(id) confirmed in routes.ts

---

2. i18n — 7 keys added per locale under dashboard.portfolios.*

  title · viewAll · netBalance · members · empty · error · retry
  {count} in members resolved via .replace() at call site (project convention)

---

3. Files Created

  src/components/dashboard/PortfolioBalanceCardSkeleton.tsx
    - 4-line skeleton: type badge pill, name line, balance block, members line

  src/components/dashboard/PortfolioBalanceCard.tsx
    - Exports PortfolioBalanceCardProps interface
    - typeBadgeClass() replicates PortfoliosPage exact hex map per type
    - signColor() + formatUSD() inline
    - navigate(ROUTES.PORTFOLIO(id)) on card click
    - cursor-pointer + hover:border-[#B8CFF5] + hover:shadow-sm

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - fetchPortfoliosForDashboard() — id, name, type, portfolio_members(count)
    - fetchPortfolioTransactions() — portfolio_id, type, amount, currency, exchange_rate
    - ['portfolios'] staleTime 60s (shared cache)
    - ['dashboard-portfolio-transactions'] staleTime 60s
    - portfolioBalanceMap useMemo — Map<portfolioId, balanceUSD>
    - Replaced {/* TODO S-062 */} with full section including
      loading/error/empty/cards-grid states and "عرض الكل" Link

  src/i18n/locales/ar.ts + en.ts — dashboard.portfolios.* sub-key added

---

Issues Encountered & Resolved (S-062)

None. Implementation matched spec exactly.

---

Final Verification (S-062): All checks ✅

================================================================================

S-063 — Upcoming Obligations Section
قسم الالتزامات القادمة
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: S-062
Blocks    : S-064

---

Overview

Two-panel obligations section: active leases (Panel A) and unpaid property
expenses sorted by due_date ASC (Panel B). Overdue badge in section header
when any expense has due_date < today.

Three separate Supabase queries — no embedded joins (E6 Canonical Rule 4).
Active leases: DB-filtered by start_date <= today, end_date IS NULL OR >= today
applied client-side. Unpaid expenses: paid_date IS NULL + due_date NOT NULL,
ordered ascending so overdue appear first naturally.

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - properties.obligations.* confirmed at ar.ts:596 — different namespace,
    not touched. dashboard.obligations absent — added fresh.
  - today variable not yet present in DashboardPage — added in this story.
  - All S-061/S-062 components confirmed.

---

2. i18n — 14 keys added per locale under dashboard.obligations.*

  title · overdueBadge · leasesTitle · expensesTitle · noLeases · noExpenses ·
  moreItems · openEnd · statusOverdue · statusPending · freqMonthly · freqAnnual ·
  error · retry
  {count} tokens resolved via .replace() at call site

---

3. Files Created

  src/components/dashboard/UpcomingObligationsSection.tsx
    - Exports ActiveLease + UnpaidExpense interfaces
    - ObligationsSkeleton internal sub-component (not exported)
    - MAX_ROWS = 5 cap with "+N أخرى" muted footer
    - Panel A: property name, tenant, amount, frequency badge, end date / "مفتوح"
    - Panel B: property name, due date, amount, overdue/pending badge
    - isOverdue = expense.due_date < today (string comparison, YYYY-MM-DD)
    - today passed as prop from parent (not derived internally)
    - ms-3 for RTL-safe column spacing

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - today constant: new Date().toISOString().split('T')[0]
    - fetchActiveLeases(): .lte('start_date', today) — DB-level filter
    - fetchUnpaidExpenses(): .is('paid_date', null) + .not('due_date', 'is', null)
      + .order('due_date', { ascending: true })
    - fetchObligationPropertyNames(): id, name — staleTime 300s
    - activeLeases useMemo (client-side end_date filter)
    - propertyNameMap useMemo — Map<propertyId, name>
    - Replaced {/* TODO S-063 */} with <UpcomingObligationsSection>

  src/i18n/locales/ar.ts + en.ts — dashboard.obligations.* sub-key added

---

Issues Encountered & Resolved (S-063)

None. Implementation matched spec exactly.

---

Final Verification (S-063): All checks ✅

================================================================================

S-064 — Recent Transactions Table
جدول آخر 5 معاملات
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: S-063
Blocks    : S-065

---

Overview

Compact 5-column table showing the 5 most recent transactions across all
portfolios. SYP rows show "≈ X USD" secondary line when exchange_rate is set.
"عرض الكل" link navigates to /transactions.

Uses portfolios(name) embedded join (standard FK — safe, unlike S-053's
people!partner_id alias which required the two-step pattern).

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - Transaction interface confirmed in src/types/index.ts (from S-026)
  - amountTextClass() in TransactionsPage uses text-[#475569] for transfer —
    dashboard spec uses text-[#1E293B]. Plan followed for the new component.
    Discrepancy noted for Sprint 10 standardization (S-079).
  - typeLabel explicit map pattern used (safe vs dynamic key construction)
  - as unknown as { name: string } | null cast needed for Supabase embed

---

2. i18n — 15 keys added per locale under dashboard.recentTx.*

  title · viewAll · colDate · colType · colAmount · colPortfolio · colCategory ·
  approxUsd · noCategory · empty · error · retry ·
  typeIncome · typeExpense · typeTransfer

---

3. Files Created

  src/components/dashboard/RecentTransactionsTable.tsx
    - Exports DashboardTransaction interface (slim — only fields needed for display)
    - typeBadgeClass() + amountTextClass() + formatAmount() + formatApproxUsd() inline
    - RecentTransactionsSkeleton internal sub-component (5 rows × 5 columns)
    - typeLabel explicit map — not dynamic t(`...${type}`) construction
    - ps-3 on all td/th (never pl-)
    - text-start on all th elements (never text-left)
    - as unknown as { name: string } | null for portfolios embed cast

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - fetchRecentTransactions(): portfolios(name) embed, ORDER date DESC +
      created_at DESC, LIMIT 5
    - ['dashboard-recent-transactions'] staleTime 30s
    - Replaced {/* TODO S-064 */} with <RecentTransactionsTable>

  src/i18n/locales/ar.ts + en.ts — dashboard.recentTx.* sub-key added

---

Issues Encountered & Resolved (S-064)

#   Issue                                       Resolution
--  ------------------------------------------  ----------------------------------------
1   Supabase embed portfolios(name) returns     Resolved via:
    TypeScript error — inferred type unknown.   as unknown as { name: string } | null
                                                Standard project cast pattern.

---

Final Verification (S-064): All checks ✅

================================================================================

S-065 — Partner Shares Section
عرض نصيب كل شريك من الثروة الإجمالية
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: S-064
Blocks    : S-066

---

Overview

Shows each partner's total capital in USD and their percentage share of the
family total, sorted by totalCapitalUSD DESC. Progress bar per partner
shows share proportion visually.

Total per partner = Σ closing balances across ALL their capital accounts
(all entities). Uses buildCapitalBreakdown() from src/utils/capital.ts —
single source of truth (E6 Canonical Rule 2).

Three query keys REUSED for cache sharing:
  ['capital-accounts']         — shared with CapitalAccountsPage
  ['capital-transactions-all'] — shared with CapitalAccountsPage
  ['people-slim']              — shared with other pages

Accent colours assigned by partner's sorted index (not by person identity)
per STR-004 §2.4:
  Index 0 → Blue  #1E5DC4 / #E8F0FB
  Index 1 → Green #1A7D4F / #EBF5F0
  Index 2+ → Amber #B45309 / #FEF7EC

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - ROUTES.PARTNERS confirmed in routes.ts
  - buildCapitalBreakdown() signature confirmed in src/utils/capital.ts
  - ['capital-accounts'] and ['capital-transactions-all'] query shapes confirmed
    in CapitalAccountsPage — reused with matching fetch functions
  - dashboard.partnerShares absent from ar.ts

---

2. i18n — 7 keys added per locale under dashboard.partnerShares.*

  title · viewAll · totalLabel · shareLabel · empty · error · retry
  {percent} in shareLabel resolved via .replace() at call site

---

3. Files Created

  src/components/dashboard/PartnerSharesSection.tsx
    - Exports PartnerShareRow interface
    - getAccentColors(index) — returns bg, text, bar hex per index
    - getInitials(name) — first two words, first char each
    - signColor() + formatUSD() inline
    - PartnerSharesSkeleton internal sub-component (3 animated rows)
    - Avatar circle with initials via style={{ backgroundColor, color }}
    - Horizontal progress bar via style={{ width: `${pct}%`, backgroundColor }}
    - Grand total footer: bg-[#F8FAFC] border-t, negative margin for full-width

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - fetchCapitalAccountsForDashboard() — queryKey ['capital-accounts']
    - fetchCapitalTransactionsForDashboard() — queryKey ['capital-transactions-all']
    - fetchPeopleSlimForDashboard() — queryKey ['people-slim']
    - partnerShareRows + grandTotal useMemo:
        Step 1: closingBalanceMap via buildCapitalBreakdown per account
        Step 2: partnerTotalMap grouping by partner_id
        Step 3: grandTotal sum
        Step 4: rows — only partners with capital accounts, sorted DESC,
                accentIndex assigned post-sort
    - Replaced {/* TODO S-065 */} with <PartnerSharesSection>

  src/i18n/locales/ar.ts + en.ts — dashboard.partnerShares.* sub-key added

---

Issues Encountered & Resolved (S-065)

None. Implementation matched spec exactly.

---

Final Verification (S-065): All checks ✅

================================================================================

S-066 — Asset Distribution Chart
رسم بياني توزيع الأصول
Epic  : E7
Sprint: Sprint 8
Status: ✅ Done
Depends on: S-065
Blocks    : S-067

---

Overview

Donut chart (Recharts PieChart innerRadius=60 outerRadius=100) showing
proportional asset distribution across portfolios and total property value.

ZERO new Supabase queries — all data derived from values already computed
in DashboardPage by S-061 and S-062:
  portfoliosData + portfolioBalanceMap → per-portfolio slices
  propertyValueUSD → single combined properties slice

Only portfolios and properties with value > 0 appear as slices.
Colours assigned by portfolio type (not position):
  cash_usd #1A7D4F · cash_syp #B45309 · gold #854009 ·
  project #1E5DC4 · property #0D2D6B · fallback #94A3B8

Custom tooltip and custom legend (not Recharts default Legend component).
t() included in chartSlices useMemo dependency array (used for propertiesLabel).

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - recharts confirmed in package.json
  - portfoliosData, portfolioBalanceMap, propertyValueUSD confirmed in DashboardPage
  - dashboard.assetChart absent from ar.ts

---

2. i18n — 5 keys added per locale under dashboard.assetChart.*

  title · propertiesLabel · empty · tooltipValue · tooltipPercent

---

3. Files Created

  src/components/dashboard/AssetDistributionChart.tsx
    - Exports AssetSlice interface (name, value, type)
    - SLICE_COLOR map: 5 types + fallback
    - AssetChartSkeleton — pulse circle + 3 legend placeholders
    - CustomTooltip — explicit CustomTooltipProps interface (avoids Recharts
      v3 type generics issue with TooltipProps<number, string>)
      Shows name + USD amount + percentage. total injected into each chartData
      entry so tooltip can access via entry.payload.total.
    - Recharts: ResponsiveContainer → PieChart → Pie → Cell per slice
    - Custom legend below chart: coloured dot + name + percentage

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - chartSlices useMemo — one slice per positive-balance portfolio +
      one combined properties slice if > 0; t in dependency array
    - Replaced {/* TODO S-066 */} with <AssetDistributionChart>

  src/i18n/locales/ar.ts + en.ts — dashboard.assetChart.* sub-key added

---

Issues Encountered & Resolved (S-066)

#   Issue                                       Resolution
--  ------------------------------------------  ----------------------------------------
1   Vite HMR crash on first load after chart    npm install react-is
    mounted:                                     react-is is a Recharts peer dependency
    "Failed to resolve import 'react-is'"        not installed by default. Added to
                                                 project as explicit dependency.
                                                 Commit: fix(deps): add react-is peer
                                                 dependency for recharts

2   Recharts TooltipProps<number, string>        Replaced with explicit interface:
    caused TypeScript error with v3 generic      CustomTooltipProps { active?: boolean;
    inference.                                   payload?: Array<{ name: string;
                                                 value: number; payload: { total: number } }> }

---

Final Verification (S-066): All checks ✅

================================================================================

S-067 — P&L Indicator — Current Month
مؤشر الأرباح والخسائر للشهر الحالي
Epic  : E7
Sprint: Sprint 8 — Final Story
Status: ✅ Done
Depends on: S-066
Blocks    : Sprint 8 merge to main

---

Overview

Monthly P&L indicator card — final section of DashboardPage.
Shows total income, total expense, and net P&L for the current calendar
month (date >= YYYY-MM-01 of today's date, computed at query time).

Period label generated via Intl.DateTimeFormat('ar-SA', { month: 'long',
year: 'numeric' }) — native Arabic month names, no custom i18n keys.

Visual: income/expense rows + two-segment comparison bar +
large net P&L footer with signColor() and directional icon.

One new query: ['dashboard-pl-current-month'] filtered by current month.
DashboardPage computes incomeUSD/expenseUSD/netPL in useMemo.

---

What Was Built

1. Audit Findings (Phase 0)

  - 0 TypeScript errors baseline
  - today constant confirmed present from S-063
  - All previous dashboard sub-keys confirmed
  - dashboard.pl absent from ar.ts

---

2. i18n — 7 keys added per locale under dashboard.pl.*

  title · income · expense · netPL · empty · error · retry

---

3. Files Created

  src/components/dashboard/PLIndicatorCard.tsx
    - Props: incomeUSD · expenseUSD · netPL · periodLabel · isLoading · isError · onRetry
    - signColor() — positive=#1A7D4F, negative=#C0392B, zero=#94A3B8
    - formatUSD() via Intl.NumberFormat
    - PLIndicatorSkeleton internal sub-component
    - Income row: TrendingUp icon + label + green value
    - Expense row: TrendingDown icon + label + red value
    - Comparison bar: flex container, income green fill + expense red fill
      proportional to incomeBarPct / expenseBarPct (dynamic via style={{ width }})
    - Net P&L footer: directional icon (TrendingUp/TrendingDown/none) + large value

---

4. Files Modified

  src/pages/DashboardPage.tsx
    - getFirstDayOfMonth(): returns YYYY-MM-01 string — outside component
    - fetchPLCurrentMonth(): .in('type',['income','expense']) + .gte('date', firstDay)
    - ['dashboard-pl-current-month'] staleTime 30s
    - periodLabel: Intl.DateTimeFormat('ar-SA', { month:'long', year:'numeric' })
      .format(new Date()) — declared inside component
    - incomeUSD + expenseUSD + netPL useMemo (SYP → USD via per-tx exchange_rate)
    - Replaced {/* TODO S-067 */} with <PLIndicatorCard>

  src/i18n/locales/ar.ts + en.ts — dashboard.pl.* sub-key added

---

Issues Encountered & Resolved (S-067)

None. Implementation matched spec exactly.

---

Final Verification (S-067): All checks ✅

================================================================================

E7 — Canonical Rules Established This Sprint

1. DashboardPage as single data hub — presentational component pattern
   All data fetching, query hooks, and useMemo derivations live exclusively
   in DashboardPage. Dashboard sub-components are purely presentational —
   they receive pre-computed props and contain no Supabase calls.
   This pattern keeps each component independently testable and prevents
   query proliferation across the component tree.

2. Zero-query sections via useMemo derivation (S-066, S-067)
   Not every dashboard section requires a new Supabase query.
   S-066 derives chartSlices entirely from portfoliosData and portfolioBalanceMap
   computed in S-062. S-067 derives incomeUSD/expenseUSD from a new query but
   the component itself is data-free.
   When adding future dashboard sections: check whether existing DashboardPage
   data can satisfy the need before adding a new query.

3. Recharts peer dependency — react-is must be explicit
   Recharts requires react-is but does not always install it transitively.
   Any project using Recharts must have react-is as an explicit dependency:
     npm install react-is
   Future sprints adding new chart components must verify this is present.

4. Recharts custom tooltip — explicit props interface over TooltipProps generic
   Recharts v3 TooltipProps<number, string> causes TypeScript inference errors
   in strict mode. Pattern established in S-066:
   Define an explicit interface for custom tooltip props instead of using
   the Recharts generic:
     interface CustomTooltipProps {
       active?: boolean;
       payload?: Array<{ name: string; value: number; payload: { total: number } }>;
     }
   Apply this pattern to any future Recharts custom tooltip component.

5. t() in useMemo dependency array
   When a useMemo builds translated strings (e.g. propertiesLabel in S-066
   chartSlices), t must be included in the dependency array even though the
   language rarely changes. Omitting it causes stale translations on language
   switch. Established in S-066 — apply to any useMemo using t().

6. Dynamic runtime colours via style={{ }} — not className
   STR-004 requires hex literals. For colours determined at runtime (partner
   accent by index, chart slice by type, progress bar fill), use inline style:
     style={{ backgroundColor: '#1A7D4F' }}
   Never generate dynamic Tailwind classes like `text-[${color}]` — they are
   not included in the build output and silently fail.

7. amountTextClass transfer colour — pending standardization
   TransactionsPage uses text-[#475569] for transfer type amounts.
   DashboardPage RecentTransactionsTable uses text-[#1E293B] per design spec.
   These values are inconsistent. The canonical value is text-[#1E293B]
   (neutral dark — transfer is neither income nor expense).
   TransactionsPage will be updated to match in Sprint 10 (S-079 RTL/consistency
   review).

8. Query key cache sharing across pages
   Dashboard intentionally reuses query keys from other pages to benefit from
   warm cache:
     ['portfolios']              — shared with PortfoliosPage
     ['capital-accounts']        — shared with CapitalAccountsPage
     ['capital-transactions-all']— shared with CapitalAccountsPage
     ['people-slim']             — shared across multiple pages
   When adding future dashboard sections, check if a needed query key already
   exists in the project before creating a new one.

================================================================================

E7 — Project Structure After Sprint 8

src/
├── components/
│   └── dashboard/
│       ├── AssetDistributionChart.tsx       ← S-066 (Recharts donut)
│       ├── NetWorthCard.tsx                 ← S-061
│       ├── NetWorthCardSkeleton.tsx         ← S-061
│       ├── PLIndicatorCard.tsx              ← S-067
│       ├── PartnerSharesSection.tsx         ← S-065
│       ├── PortfolioBalanceCard.tsx         ← S-062
│       ├── PortfolioBalanceCardSkeleton.tsx ← S-062
│       ├── RecentTransactionsTable.tsx      ← S-064
│       └── UpcomingObligationsSection.tsx   ← S-063
├── pages/
│   ├── DashboardPage.tsx                    ← REBUILT S-061 → S-067
│   └── PartnersPage.tsx                     ← REPLACED fix/partners
└── i18n/locales/
    ├── ar.ts    ← dashboard.{netWorth · portfolios · obligations ·
    │              recentTx · partnerShares · assetChart · pl} added
    └── en.ts    ← same

DashboardPage.tsx query inventory (end of Sprint 8):
  ['dashboard-net-worth-transactions']     staleTime 60s  (S-061)
  ['dashboard-property-values']            staleTime 60s  (S-061)
  ['portfolios']                           staleTime 60s  (S-062, shared)
  ['dashboard-portfolio-transactions']     staleTime 60s  (S-062)
  ['dashboard-active-leases']              staleTime 60s  (S-063)
  ['dashboard-unpaid-expenses']            staleTime 60s  (S-063)
  ['dashboard-obligation-property-names']  staleTime 300s (S-063)
  ['dashboard-recent-transactions']        staleTime 30s  (S-064)
  ['capital-accounts']                     staleTime 30s  (S-065, shared)
  ['capital-transactions-all']             staleTime 30s  (S-065, shared)
  ['people-slim']                          staleTime 300s (S-065, shared)
  ['dashboard-pl-current-month']           staleTime 30s  (S-067)

================================================================================

E7 — Deferred Items (Post-MVP Backlog)

Deferred Item 1 — Dashboard Period Selector

The P&L indicator (S-067) and recent transactions (S-064) are hardcoded
to current month and last 5 records respectively. No period-switching UI exists.
When Sprint 9 builds the formal reporting layer (S-068 → S-072), a shared
DateRangePicker component will be introduced. The dashboard should then expose
a period selector that feeds both PLIndicatorCard and potentially a filtered
transactions view.

Deferred Item 2 — Portfolio Cards Pagination

PortfolioBalanceCards (S-062) renders ALL portfolios with no upper limit.
For large numbers of portfolios (unlikely in MVP, but possible post-launch),
a "عرض الكل" collapse with max 6 visible cards would improve layout.
Acceptable post-MVP given the private family context.

Deferred Item 3 — Dashboard Auto-Refresh

No polling or real-time subscription exists. Data refreshes only on page
reload or when the user navigates away and back (staleTime expiry).
For a single-user private app this is acceptable. A future enhancement
could add refetchInterval: 300_000 (5 min) on the highest-frequency queries
(['dashboard-pl-current-month'], ['dashboard-recent-transactions']).

Deferred Item 4 — amountTextClass Standardization

TransactionsPage uses text-[#475569] for transfer type amounts.
RecentTransactionsTable uses text-[#1E293B] (correct per STR-004 neutral).
To be standardized in Sprint 10 S-079 (RTL and visual consistency review).
Canonical value: text-[#1E293B].

Deferred Item 5 — Mobile Dashboard Layout

DashboardPage uses a single-column layout on mobile (grid-cols-1 fallback).
No specific mobile-optimized layout has been designed for the dashboard.
Addressed in Sprint 10 S-081 (Mobile Responsive review).

Deferred Item 6 — Dashboard Loading Coordination

Each section has its own independent loading state. On first load, sections
appear progressively as their queries resolve — this can cause layout shift.
A future improvement: a single isInitialLoading guard that shows the full
skeleton until all queries complete their first fetch.