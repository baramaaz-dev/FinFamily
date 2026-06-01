# EPC-01 — Infrastructure & Setup
**Epic:** E1 — البنية التحتية والإعداد
**Sprint:** Sprint 0 — الإعداد والبنية التحتية
**Status:** 🟡 In Progress

---

## Stories Overview

| Story | Title | Status |
|-------|-------|--------|
| S-001 | Development Environment & External Tools Setup | ✅ Done |
| S-002 | React Router DOM Setup, Page Structure & i18n Infrastructure | ✅ Done |
| S-003 | Main RTL/LTR Layout (Sidebar + Header + Content) | ⬜ Pending |
| S-004 | Authentication System (Login + Protected Routes) | ⬜ Pending |
| S-005 | Dinero.js Setup & Currency Logic (USD/SYP) | ⬜ Pending |

---

## S-001 — Development Environment & External Tools Setup
**Status:** ✅ Done
**Closed:** Sprint 0

### What Was Built

#### 1. Vite + React + TypeScript
- Project initialized with `react-ts` template
- Runs on `localhost:5173` (dev) / `localhost:5174` (with port conflict)
- Boilerplate removed: `App.css`, default `App.tsx` content, duplicate CSS files
- `npx tsc --noEmit` → Zero errors

#### 2. TypeScript Configuration
- `tsconfig.json` created with `"strict": true`
- `"ignoreDeprecations": "6.0"` added for `baseUrl` compatibility
- `paths` configured: `@/*` → `./src/*`
- `src/vite-env.d.ts` created with `/// <reference types="vite/client" />`
- All source files migrated: `.js` → `.ts`, `.jsx` → `.tsx`

#### 3. Tailwind CSS v3 + Shadcn/UI
- Tailwind v4 downgraded to `^3.4.19`
- `tailwind.config.ts` generated with correct `content` array
- `npx shadcn@latest init` completed (Style: Default, Base: Slate, CSS vars: Yes)
- `components.json` present at project root
- `@radix-ui/*` packages installed

#### 4. Supabase
- Project created at `https://amvsvragnchbqwsycgyt.supabase.co`
- Email Auth only — all OAuth providers disabled
- Single admin user created manually via Dashboard
- `src/lib/supabase.ts` exports `supabaseClient`
- `VITE_SUPABASE_URL` corrected (base URL only, no `/rest/v1/` suffix)
- Connection verified: `getSession()` returns no errors
- Login flow tested end-to-end ✅

#### 5. RLS
- RLS enabled on all tables in `public` schema
- Policies present on every table: `SELECT`, `INSERT`, `DELETE`
- Verified via Supabase Dashboard → Authentication → Policies

#### 6. Environment Variables
- `.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `.env.local` listed in `.gitignore` (covered by `*.local` rule)
- `.env.example` committed with placeholder values only

#### 7. Installed Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.106.2 | Database & Auth |
| `@tanstack/react-query` | ^5.100.14 | Server state management |
| `react-router-dom` | ^7.16.0 | Client-side routing |
| `react-hook-form` | latest | Form management |
| `zod` | latest | Schema validation |
| `@hookform/resolvers` | latest | RHF + Zod bridge |
| `dinero.js` | ^2.0.2 | Monetary calculations |
| `@dinero.js/currencies` | ^2.0.0-alpha.1 | Currency definitions |
| `recharts` | ^3.8.1 | Charts & visualizations |
| `jspdf` | latest | PDF generation |
| `html2canvas` | latest | PDF screenshot capture |
| `date-fns` | ^4.4.0 | Date formatting & utils |
| `clsx` | latest | Conditional classnames |
| `tailwind-merge` | latest | Tailwind class merging |
| `lucide-react` | ^1.17.0 | Icon library |
| `zustand` | latest | Client state management |

#### 8. Project Structure

```
finfamily/
├── public/
├── src/
│   ├── components/
│   │   └── ui/                  ← Shadcn components
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client (exports supabaseClient)
│   │   └── utils.ts             ← cn() helper
│   ├── pages/                   ← Page components (populated per sprint)
│   ├── types/
│   │   └── index.ts             ← TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts            ← Vite type reference
├── .env.example
├── .env.local                   ← git-ignored
├── .gitignore
├── components.json              ← Shadcn config
├── index.html                   ← dir="rtl" lang="ar"
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                  ← SPA rewrite rule
├── vite.config.ts
└── package.json
```

#### 9. GitHub Repository
- Repository: `finfamily` (Private)
- Branch strategy:
  ```
  main      ← production (Vercel watches this)
  develop   ← integration
  feature/* ← new features
  fix/*     ← bug fixes
  ```
- Commits follow Conventional Commits standard

#### 10. Vercel Deployment
- Project: `fin-family-maaz`
- Production URL: `https://fin-family-maaz.vercel.app`
- Source branch: `main`
- Status: **Ready** ✅
- Environment variables configured in Vercel Dashboard
- `vercel.json` present with SPA rewrite rule:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  ```

### Issues Encountered & Resolved

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Tailwind v4 installed instead of v3 | Uninstalled v4, installed `tailwindcss@^3` |
| 2 | `VITE_SUPABASE_URL` had `/rest/v1/` suffix | Removed suffix, base URL only |
| 3 | Project was JavaScript, not TypeScript | Full migration `.js/.jsx` → `.ts/.tsx` |
| 4 | `vite.config.js` instead of `.ts` | Renamed to `vite.config.ts` |
| 5 | `supabase` export name instead of `supabaseClient` | Renamed export and all importers |
| 6 | `@tanstack/react-query` missing | Installed `^5.100.14` |
| 7 | `@dinero.js/currencies` missing | Installed `^2.0.0-alpha.1` |
| 8 | `TS5101` — `baseUrl` deprecated in TS6 | Added `"ignoreDeprecations": "6.0"` |
| 9 | `TS2339` — `import.meta.env` unknown | Created `src/vite-env.d.ts` |
| 10 | `TS7006` — implicit `any` in event handler | Typed as `React.FormEvent<HTMLFormElement>` |
| 11 | Duplicate CSS: `src/styles/index.css` | Consolidated into `src/index.css`, deleted duplicate |
| 12 | `App.css` boilerplate not removed | Deleted `src/App.css` |

### Final Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm run dev` | ✅ Ready in ~1800ms |
| Tailwind CSS version | ✅ ^3.4.19 |
| `tsconfig.json` strict mode | ✅ |
| Supabase connection | ✅ No errors in console |
| Login flow (local) | ✅ Authenticated successfully |
| RLS on all tables | ✅ Verified via Dashboard |
| Vercel deployment | ✅ Status: Ready |
| Production URL accessible | ✅ `fin-family-maaz.vercel.app` |

---

## S-002 — React Router DOM Setup, Page Structure & i18n Infrastructure
**Status:** ✅ Done
**Closed:** Sprint 0

### What Was Built

#### 1. Router Configuration — `src/router/index.tsx`

- Built with `createBrowserRouter` (Data API) — not the legacy `<BrowserRouter>`
- Prepares the project for `loader` and `action` usage in future sprints
- `/login` is the only public route, outside `AppLayout`
- All protected routes nested under `AppLayout` as `children`
- `/settings` has its own `children` with `index: true` pointing to `PeoplePage`
- Catch-all `path: '*'` renders `NotFoundPage`

Route map:

```
/login                        → LoginPage              (public)
/                             → AppLayout              (Outlet)
  /                           → DashboardPage
  /transactions               → TransactionsPage
  /portfolios                 → PortfoliosPage
  /portfolios/:id             → PortfolioDetailPage
  /properties                 → PropertiesPage
  /properties/:id             → PropertyDetailPage
  /partners                   → PartnersPage
  /partners/:id               → PartnerDetailPage
  /reports                    → ReportsPage
  /settings                   → SettingsPage
    /settings         (index) → PeoplePage
    /settings/people          → PeoplePage
    /settings/exchange-rates  → ExchangeRatesPage
  *                           → NotFoundPage
```

#### 2. Route Constants — `src/router/routes.ts`

- Exports a single `ROUTES` object typed `as const`
- Eliminates magic strings across the entire codebase
- Dynamic routes (`PORTFOLIO`, `PROPERTY`, `PARTNER`) are arrow functions accepting `id: string`

#### 3. App.tsx — RouterProvider only

- Entire previous content replaced
- `<RouterProvider router={router} />` is the only JSX
- Existing auth logic (`useAuthStore`, `ProtectedRoute`, `useEffect`) intentionally removed — reimplemented correctly in S-004 inside `src/components/auth/ProtectedRoute.tsx`

#### 4. Layout — `src/layouts/AppLayout.tsx`

- Pass-through `<Outlet />` with dynamic `dir` attribute driven by i18n state
- No auth logic (added in S-004)
- Full Sidebar + Header wired in S-003

```tsx
const { direction } = useDirection();
<div className="min-h-screen bg-background" dir={direction}>
  <Outlet />
</div>
```

#### 5. i18n Infrastructure

##### Installed Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `i18next` | latest | Translation engine |
| `react-i18next` | latest | React bindings |
| `i18next-browser-languagedetector` | latest | Auto language detection |

##### File Structure

```
src/
├── i18n/
│   ├── index.ts              ← i18next config + type exports
│   └── locales/
│       ├── ar.ts             ← Arabic strings
│       └── en.ts             ← English strings
└── hooks/
    └── useDirection.ts       ← direction + language + toggleLanguage()
```

##### Translation Key Namespaces

| Namespace | Contents |
|-----------|----------|
| `nav.*` | Sidebar navigation links (7 items) |
| `settings.*` | Settings sub-pages |
| `pages.*` | Page titles + shared states (underConstruction, id) |
| `common.*` | Shared UI labels (save, cancel, delete, search…) |
| `language.*` | Language toggle button label |

##### `useDirection` Hook — `src/hooks/useDirection.ts`

Returns `{ direction, language, isRTL, toggleLanguage }`:
- `direction`: `'rtl' | 'ltr'` derived from active language
- `toggleLanguage()`: calls `i18n.changeLanguage()` and updates `document.documentElement` attributes (`dir`, `lang`) immediately

##### Persistence

- Language stored in `localStorage` under key `finfamily-lang`
- `main.tsx` reads the stored value and sets `dir`/`lang` on `<html>` before first render — prevents direction flash on page load

#### 6. Page Structure — `src/pages/`

- **Flattened**: all pages at `src/pages/*.tsx` — zero subdirectories
- **14 files** total: 8 moved from subdirectories + 6 created new
- All pages use `useTranslation()` — no hardcoded Arabic or English strings
- Detail pages (`PortfolioDetailPage`, `PropertyDetailPage`, `PartnerDetailPage`) use `useParams<{ id: string }>()`
- `NotFoundPage` uses `ROUTES.DASHBOARD` constant for the back link

| File | Type |
|------|------|
| `DashboardPage.tsx` | Moved + i18n |
| `TransactionsPage.tsx` | Moved + i18n |
| `PortfoliosPage.tsx` | Moved + i18n |
| `PortfolioDetailPage.tsx` | New — useParams |
| `PropertiesPage.tsx` | Moved + i18n |
| `PropertyDetailPage.tsx` | New — useParams |
| `PartnersPage.tsx` | Moved + i18n |
| `PartnerDetailPage.tsx` | New — useParams |
| `ReportsPage.tsx` | Moved + i18n |
| `SettingsPage.tsx` | Moved + i18n |
| `PeoplePage.tsx` | New |
| `ExchangeRatesPage.tsx` | New |
| `LoginPage.tsx` | Moved + i18n |
| `NotFoundPage.tsx` | New — Link to ROUTES.DASHBOARD |

#### 7. main.tsx Updates

- `import '@/i18n'` added as first import — initializes i18next before any render
- `<QueryClientProvider>` wraps `<App />` with `defaultOptions` (`retry: 1`, `staleTime: 5min`)
- `document.documentElement` `dir` and `lang` set from `localStorage` before `createRoot`

#### 8. Project Structure after S-002

```
src/
├── hooks/
│   └── useDirection.ts         ← NEW
├── i18n/
│   ├── index.ts                ← NEW
│   └── locales/
│       ├── ar.ts               ← NEW
│       └── en.ts               ← NEW
├── layouts/
│   └── AppLayout.tsx           ← NEW
├── pages/                      ← RESTRUCTURED — flat, 14 files
│   ├── DashboardPage.tsx
│   ├── TransactionsPage.tsx
│   ├── PortfoliosPage.tsx
│   ├── PortfolioDetailPage.tsx ← NEW
│   ├── PropertiesPage.tsx
│   ├── PropertyDetailPage.tsx  ← NEW
│   ├── PartnersPage.tsx
│   ├── PartnerDetailPage.tsx   ← NEW
│   ├── ReportsPage.tsx
│   ├── SettingsPage.tsx
│   ├── PeoplePage.tsx          ← NEW
│   ├── ExchangeRatesPage.tsx   ← NEW
│   ├── LoginPage.tsx
│   └── NotFoundPage.tsx        ← NEW
├── router/
│   ├── index.tsx               ← NEW
│   └── routes.ts               ← NEW
├── App.tsx                     ← UPDATED
└── main.tsx                    ← UPDATED
```

#### 9. Commits

```
feat(router): add ROUTES constants
feat(i18n): add i18next infrastructure with Arabic and English locales
feat(pages): flatten structure, add missing pages, integrate i18n
feat(layouts): add AppLayout with dynamic RTL/LTR direction
feat(router): implement createBrowserRouter with all routes
refactor(app): replace BrowserRouter with RouterProvider — auth deferred to S-004
feat(main): add QueryClientProvider, initialize i18n and document direction
```

### Issues Encountered & Resolved

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Pages existed in subdirectories (`/pages/dashboard/` etc.) instead of flat structure | Moved all to `src/pages/*.tsx` and deleted empty subdirectories |
| 2 | `App.tsx` contained `<BrowserRouter>` + S-004 auth logic added prematurely | Removed entirely, replaced with `RouterProvider` only — auth deferred to S-004 |
| 3 | `AppLayout` existed at wrong path `src/components/layout/` | Created correct `src/layouts/AppLayout.tsx` — old file preserved for S-003 evaluation |
| 4 | `main.tsx` missing `QueryClientProvider` | Added with `defaultOptions` (retry, staleTime) |
| 5 | `dir="rtl"` hardcoded in layout breaks English support | Replaced with `dir={direction}` from `useDirection()` |
| 6 | i18n initialisation after first render caused direction flash | `import '@/i18n'` placed first in `main.tsx` + `documentElement` set before `createRoot` |
| 7 | LF/CRLF warnings on Windows during `git add` | Added `.gitattributes` with `* text=auto eol=lf` |

### Final Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm run dev` | ✅ Ready in 2243ms, zero console errors |
| `src/pages` flat structure (14 files, 0 subdirectories) | ✅ |
| `src/router/index.tsx` + `routes.ts` present | ✅ |
| `src/layouts/AppLayout.tsx` present | ✅ |
| `src/i18n/` (index + ar + en) present | ✅ |
| `src/hooks/useDirection.ts` present | ✅ |
| No `BrowserRouter` references in codebase | ✅ |
| All 14 routes navigable in browser | ✅ |
| i18n AR ↔ EN switch via localStorage | ✅ |
| `dir` + `lang` on `<html>` updates at runtime | ✅ |
| Pushed to `main` on GitHub | ✅ `d85753a..485e780` |
