EPC-09 — Settings & Exchange Rates
Epic  : E9 — الإعدادات والأسعار
Sprint: Sprint 5
Status: 🔄 In Progress

---

Stories Overview

Story   Title                                          Status
------  -----------------------------------------------  -------
S-044   Exchange Rate Management Page                  ✅ Done
S-045   Add Exchange Rate Form                         ⏳ Pending
S-046   Exchange Rate History View                     ⏳ Pending
S-047   Auto-fetch Latest Rate in Forms                ⏳ Pending

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
    (not @/lib/supabaseClient — note for all future stories in this epic)
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

No other changes to SettingsPage.tsx.

---

4. ExchangeRatesPage — src/pages/ExchangeRatesPage.tsx

Full replacement of S-002 stub.

Helper functions (outside component):
  fetchExchangeRates() — Supabase select('*'),
    ORDER BY date DESC, created_at DESC

React Query: queryKey ['exchange-rates'], staleTime 30_000

Table: 4 columns — date · rate · notes · actions

Date column:
  new Date(rate.date).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

Rate column:
  font-mono tabular-nums — Number(rate.rate).toLocaleString('ar-SA')
  + ' ' + t('exchangeRates.rateUnit')
  First row (index 0) renders "الأحدث" badge:
    plain <span> bg-[#EBF5F0] text-[#1A7D4F]  (STR-004 success-50 / success-400)

Notes column: rate.notes ?? '—'

Actions column: Edit + Delete buttons, both disabled with comingSoon title

Sub-components (in same file):
  ExchangeRatesSkeleton — 5 rows × 4 columns pulse grid (bg-[#E2E8F0])
  ExchangeRatesEmpty    — TrendingUp icon (color #94A3B8) + disabled Add button
  ExchangeRatesError    — outline retry button calling refetch()

STR-004: All hex literals, plain <span> badges (no Shadcn Badge),
  font-mono tabular-nums on all rate values, logical CSS direction
  properties throughout.

---

5. Commits

```
feat(i18n): add exchangeRates.* namespace to ar and en locales
feat(settings): add settings sub-nav for people and exchange-rates pages
feat(exchange-rates): implement ExchangeRatesPage — table, skeleton, empty and error states
```

---

Issues Encountered & Resolved (S-044)

#   Issue                                   Resolution
--  --------------------------------------  ----------------------------------------
1   ExchangeRate interface already existed  Phase 1 was a no-op. Existing interface
    in types/index.ts (pre-created as       verified to match DB schema (id, rate,
    stub in earlier sprint)                 date, notes, created_at). No changes made.

2   supabaseClient import path in prompt    Confirmed correct path @/lib/supabase
    specified as @/lib/supabaseClient       via Phase 0 audit of existing pages.
    (incorrect)                             Noted for all remaining E9 stories.

---

Final Verification (S-044): All checks ✅

================================================================================

E9 — Canonical Rules Established This Sprint

The following rules were confirmed or established during Sprint 5 and apply
to all remaining stories in this epic:

1. supabaseClient import path: @/lib/supabase
   NOT @/lib/supabaseClient — confirmed in S-044 Phase 0 audit.
   All E9 prompts must use this path.

2. ExchangeRate interface: pre-exists in src/types/index.ts
   Do not re-declare in S-045, S-046, or S-047. Verify on audit only.

3. queryKey convention: ['exchange-rates']
   All stories in this epic that query the exchange_rates table must
   use this queryKey for cache consistency with S-044.

4. S-047 cross-cutting scope:
   S-047 modifies AddTransactionDialog.tsx (E5, Sprint 3) which already
   contains fetchLatestExchangeRate() from S-028 using
   queryKey: ['latest-exchange-rate']. S-047 must audit that helper
   first and align it with the ['exchange-rates'] queryKey established
   here — or consciously retain the separate key if invalidation scope
   differs — rather than creating a duplicate query silently.

================================================================================

E9 — Deferred Items (Post-MVP Backlog)

No deferred items recorded at this stage.
This section will be updated as S-045 through S-047 are completed.