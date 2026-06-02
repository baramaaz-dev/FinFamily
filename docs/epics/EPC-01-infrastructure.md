EPC-01 — Infrastructure & Setup
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 0 & 1 — الإعداد والبنية التحتية
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-001	Development Environment & External Tools Setup			✅ Done
S-002	React Router DOM Setup, Page Structure & i18n Infrastructure	✅ Done
S-003	Main RTL/LTR Layout (Sidebar + Header + Content)		✅ Done
S-004	Authentication System (Login + Protected Routes)		✅ Done
S-005	Dinero.js Setup & Currency Logic (USD/SYP)			✅ Done
S-006	Apply Database Migrations for All Tables			✅ Done
S-007	Verify & Document RLS Policies for All Tables			✅ Done
S-008	Create Seed Data for Development & Testing			✅ Done
---
S-001 — Development Environment & External Tools Setup
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Vite + React + TypeScript
Project initialized with `react-ts` template
Runs on `localhost:5173` (dev) / `localhost:5174` (with port conflict)
Boilerplate removed: `App.css`, default `App.tsx` content, duplicate CSS files
`npx tsc --noEmit` → Zero errors
2. TypeScript Configuration
`tsconfig.json` created with `"strict": true`
`"ignoreDeprecations": "6.0"` added for `baseUrl` compatibility
`paths` configured: `@/*` → `./src/*`
`src/vite-env.d.ts` created with `/// <reference types="vite/client" />`
All source files migrated: `.js` → `.ts`, `.jsx` → `.tsx`
3. Tailwind CSS v3 + Shadcn/UI
Tailwind v4 downgraded to `^3.4.19`
`tailwind.config.ts` generated with correct `content` array
`npx shadcn@latest init` completed (Style: Default, Base: Slate, CSS vars: Yes)
`components.json` present at project root
`@radix-ui/*` packages installed
4. Supabase
Project created at `https://amvsvragnchbqwsycgyt.supabase.co`
Email Auth only — all OAuth providers disabled
Single admin user created manually via Dashboard
`src/lib/supabase.ts` exports `supabaseClient`
`VITE_SUPABASE_URL` corrected (base URL only, no `/rest/v1/` suffix)
Connection verified: `getSession()` returns no errors
Login flow tested end-to-end ✅
5. RLS
RLS enabled on all tables in `public` schema
Policies present on every table: `SELECT`, `INSERT`, `DELETE`
Verified via Supabase Dashboard → Authentication → Policies
6. Environment Variables
`.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
`.env.local` listed in `.gitignore` (covered by `*.local` rule)
`.env.example` committed with placeholder values only
7. Installed Packages
Package	Version	Purpose
`@supabase/supabase-js`	^2.106.2	Database & Auth
`@tanstack/react-query`	^5.100.14	Server state management
`react-router-dom`	^7.16.0	Client-side routing
`react-hook-form`	latest	Form management
`zod`	latest	Schema validation
`@hookform/resolvers`	latest	RHF + Zod bridge
`dinero.js`	^2.0.2	Monetary calculations
`@dinero.js/currencies`	^2.0.0-alpha.1	Currency definitions
`recharts`	^3.8.1	Charts & visualizations
`jspdf`	latest	PDF generation
`html2canvas`	latest	PDF screenshot capture
`date-fns`	^4.4.0	Date formatting & utils
`clsx`	latest	Conditional classnames
`tailwind-merge`	latest	Tailwind class merging
`lucide-react`	^1.17.0	Icon library
`zustand`	latest	Client state management
8. Project Structure
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
9. GitHub Repository
Repository: `finfamily` (Private)
Branch strategy:
```
  main      ← production (Vercel watches this)
  develop   ← integration
  feature/* ← new features
  fix/*     ← bug fixes
  ```
Commits follow Conventional Commits standard
10. Vercel Deployment
Project: `fin-family-maaz`
Production URL: `https://fin-family-maaz.vercel.app`
Source branch: `main`
Status: Ready ✅
Environment variables configured in Vercel Dashboard
`vercel.json` present with SPA rewrite rule:
```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  ```
Issues Encountered & Resolved
#	Issue	Resolution
1	Tailwind v4 installed instead of v3	Uninstalled v4, installed `tailwindcss@^3`
2	`VITE_SUPABASE_URL` had `/rest/v1/` suffix	Removed suffix, base URL only
3	Project was JavaScript, not TypeScript	Full migration `.js/.jsx` → `.ts/.tsx`
4	`vite.config.js` instead of `.ts`	Renamed to `vite.config.ts`
5	`supabase` export name instead of `supabaseClient`	Renamed export and all importers
6	`@tanstack/react-query` missing	Installed `^5.100.14`
7	`@dinero.js/currencies` missing	Installed `^2.0.0-alpha.1`
8	`TS5101` — `baseUrl` deprecated in TS6	Added `"ignoreDeprecations": "6.0"`
9	`TS2339` — `import.meta.env` unknown	Created `src/vite-env.d.ts`
10	`TS7006` — implicit `any` in event handler	Typed as `React.FormEvent<HTMLFormElement>`
11	Duplicate CSS: `src/styles/index.css`	Consolidated into `src/index.css`, deleted duplicate
12	`App.css` boilerplate not removed	Deleted `src/App.css`
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
`npm run dev`	✅ Ready in ~1800ms
Tailwind CSS version	✅ ^3.4.19
`tsconfig.json` strict mode	✅
Supabase connection	✅ No errors in console
Login flow (local)	✅ Authenticated successfully
RLS on all tables	✅ Verified via Dashboard
Vercel deployment	✅ Status: Ready
Production URL accessible	✅ `fin-family-maaz.vercel.app`
---
S-002 — React Router DOM Setup, Page Structure & i18n Infrastructure
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Router Configuration — `src/router/index.tsx`
Built with `createBrowserRouter` (Data API) — not the legacy `<BrowserRouter>`
Prepares the project for `loader` and `action` usage in future sprints
`/login` is the only public route, outside `AppLayout`
All protected routes nested under `AppLayout` as `children`
`/settings` has its own `children` with `index: true` pointing to `PeoplePage`
Catch-all `path: '*'` renders `NotFoundPage`
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
2. Route Constants — `src/router/routes.ts`
Exports a single `ROUTES` object typed `as const`
Eliminates magic strings across the entire codebase
Dynamic routes (`PORTFOLIO`, `PROPERTY`, `PARTNER`) are arrow functions accepting `id: string`
3. App.tsx — RouterProvider only
Entire previous content replaced
`<RouterProvider router={router} />` is the only JSX
Existing auth logic (`useAuthStore`, `ProtectedRoute`, `useEffect`) intentionally removed — reimplemented correctly in S-004 inside `src/components/auth/ProtectedRoute.tsx`
4. Layout — `src/layouts/AppLayout.tsx`
Pass-through `<Outlet />` with dynamic `dir` attribute driven by i18n state
No auth logic (added in S-004)
Full Sidebar + Header wired in S-003
```tsx
const { direction } = useDirection();
<div className="min-h-screen bg-background" dir={direction}>
  <Outlet />
</div>
```
5. i18n Infrastructure
Installed Packages
Package	Version	Purpose
`i18next`	latest	Translation engine
`react-i18next`	latest	React bindings
`i18next-browser-languagedetector`	latest	Auto language detection
File Structure
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
Translation Key Namespaces
Namespace	Contents
`nav.*`	Sidebar navigation links (7 items)
`settings.*`	Settings sub-pages
`pages.*`	Page titles + shared states (underConstruction, id)
`common.*`	Shared UI labels (save, cancel, delete, search…)
`language.*`	Language toggle button label
`useDirection` Hook — `src/hooks/useDirection.ts`
Returns `{ direction, language, isRTL, toggleLanguage }`:
`direction`: `'rtl' | 'ltr'` derived from active language
`toggleLanguage()`: calls `i18n.changeLanguage()` and updates `document.documentElement` attributes (`dir`, `lang`) immediately
Persistence
Language stored in `localStorage` under key `finfamily-lang`
`main.tsx` reads the stored value and sets `dir`/`lang` on `<html>` before first render — prevents direction flash on page load
6. Page Structure — `src/pages/`
Flattened: all pages at `src/pages/*.tsx` — zero subdirectories
14 files total: 8 moved from subdirectories + 6 created new
All pages use `useTranslation()` — no hardcoded Arabic or English strings
Detail pages (`PortfolioDetailPage`, `PropertyDetailPage`, `PartnerDetailPage`) use `useParams<{ id: string }>()`
`NotFoundPage` uses `ROUTES.DASHBOARD` constant for the back link
File	Type
`DashboardPage.tsx`	Moved + i18n
`TransactionsPage.tsx`	Moved + i18n
`PortfoliosPage.tsx`	Moved + i18n
`PortfolioDetailPage.tsx`	New — useParams
`PropertiesPage.tsx`	Moved + i18n
`PropertyDetailPage.tsx`	New — useParams
`PartnersPage.tsx`	Moved + i18n
`PartnerDetailPage.tsx`	New — useParams
`ReportsPage.tsx`	Moved + i18n
`SettingsPage.tsx`	Moved + i18n
`PeoplePage.tsx`	New
`ExchangeRatesPage.tsx`	New
`LoginPage.tsx`	Moved + i18n
`NotFoundPage.tsx`	New — Link to ROUTES.DASHBOARD
7. main.tsx Updates
`import '@/i18n'` added as first import — initializes i18next before any render
`<QueryClientProvider>` wraps `<App />` with `defaultOptions` (`retry: 1`, `staleTime: 5min`)
`document.documentElement` `dir` and `lang` set from `localStorage` before `createRoot`
8. Project Structure after S-002
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
9. Commits
```
feat(router): add ROUTES constants
feat(i18n): add i18next infrastructure with Arabic and English locales
feat(pages): flatten structure, add missing pages, integrate i18n
feat(layouts): add AppLayout with dynamic RTL/LTR direction
feat(router): implement createBrowserRouter with all routes
refactor(app): replace BrowserRouter with RouterProvider — auth deferred to S-004
feat(main): add QueryClientProvider, initialize i18n and document direction
```
Issues Encountered & Resolved
#	Issue	Resolution
1	Pages existed in subdirectories (`/pages/dashboard/` etc.) instead of flat structure	Moved all to `src/pages/*.tsx` and deleted empty subdirectories
2	`App.tsx` contained `<BrowserRouter>` + S-004 auth logic added prematurely	Removed entirely, replaced with `RouterProvider` only — auth deferred to S-004
3	`AppLayout` existed at wrong path `src/components/layout/`	Created correct `src/layouts/AppLayout.tsx` — old file preserved for S-003 evaluation
4	`main.tsx` missing `QueryClientProvider`	Added with `defaultOptions` (retry, staleTime)
5	`dir="rtl"` hardcoded in layout breaks English support	Replaced with `dir={direction}` from `useDirection()`
6	i18n initialisation after first render caused direction flash	`import '@/i18n'` placed first in `main.tsx` + `documentElement` set before `createRoot`
7	LF/CRLF warnings on Windows during `git add`	Added `.gitattributes` with `* text=auto eol=lf`
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
`npm run dev`	✅ Ready in 2243ms, zero console errors
`src/pages` flat structure (14 files, 0 subdirectories)	✅
`src/router/index.tsx` + `routes.ts` present	✅
`src/layouts/AppLayout.tsx` present	✅
`src/i18n/` (index + ar + en) present	✅
`src/hooks/useDirection.ts` present	✅
No `BrowserRouter` references in codebase	✅
All 14 routes navigable in browser	✅
i18n AR ↔ EN switch via localStorage	✅
`dir` + `lang` on `<html>` updates at runtime	✅
Pushed to `main` on GitHub	✅ `d85753a..485e780`
---
S-003 — Main RTL/LTR Layout (Sidebar + Header + Content)
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Pre-flight Fixes (Phase 0)
Four blocking issues discovered during a pre-implementation audit were resolved
before any layout code was written.
Fix 0-A — `src/index.css`
Replaced all 18 CSS variable values in `:root` and `.dark` with the exact
values from `STR-004-brand-strategy.md` §8
Added Google Fonts `@import` for IBM Plex Sans Arabic (400/500) + IBM Plex Mono
as the first line of the file
Updated `font-family` on `body` to `IBM Plex Sans Arabic, system-ui, sans-serif`
Removed `direction: rtl` from both `body` and `html` selectors — these static
rules were silently overriding the dynamic `dir` attribute set by `main.tsx`
and breaking English (LTR) mode
Fix 0-B — `tailwind.config.ts`
Replaced `primary` (was single `hsl(var(--primary))`) with a 7-stop hex scale
(50 / 100 / 200 / 400 / 600 / 800 / 900) per STR-004 §7
Added `success`, `danger`, `warning` as 4-stop hex scales (50 / 200 / 400 / 600)
— `danger` was entirely absent; `success` and `warning` were single hsl values
Added `fontFamily` extension: `font-sans` → IBM Plex Sans Arabic, `font-mono`
→ IBM Plex Mono
Fix 0-C — `src/components/layout/AppLayout.tsx` deleted
File was an orphaned sidebar implementation not wired into the router
Exported the same name (`AppLayout`) as `src/layouts/AppLayout.tsx`
Used off-brand Tailwind color names (`bg-gray-50`, `text-blue-600`, `text-red-500`…)
Hardcoded `dir="rtl"` and ignored i18n keys (hardcoded Arabic nav labels)
Sidebar width was 240px — STR-004 §4 specifies 260px
Fix 0-D — `src/pages/LoginPage.tsx`
Removed gradient background (`bg-gradient-to-br from-blue-50 to-indigo-100`)
— gradients are banned in STR-004 §6; replaced with `bg-background`
Replaced all off-brand color names with STR-004 hex values:
`bg-blue-600` → `bg-[#1E5DC4]`, `text-gray-*` → `text-foreground` /
`text-muted-foreground`, `bg-red-50 text-red-700` → `bg-[#FEF0EF] text-[#C0392B]`
Removed `shadow-xl` / `shadow-lg` — not in STR-004 spec
Replaced `dir="rtl"` with `dir={direction}` from `useDirection()`
Fixed directional utilities: `pl-10` → `ps-10`, `left-3` → `start-3`
Moved three hardcoded Arabic strings into `auth.*` i18n keys
2. Layout Shell (Phase 1)
`src/hooks/useSidebarState.ts` — NEW
Returns `{ collapsed: boolean, toggle: () => void }`
Reads initial state from `localStorage` key `finfamily-sidebar-collapsed`
Writes on every toggle — state survives page refresh
`src/layouts/components/navItems.ts` — NEW
Single source of truth for all 7 navigation items
Each entry: `{ key, icon, route }` — imported by both Sidebar and MobileSidebar
Eliminates duplication and guarantees both components stay in sync
`src/layouts/components/Sidebar.tsx` — NEW
Fixed position, full height, right side in RTL / left side in LTR
(`start-0` logical property — never `left-0` or `right-0`)
Width: `260px` expanded / `64px` collapsed — `transition-all duration-300`
Brand block at top: Building2 icon + "FinFamily" text (text hidden when collapsed)
7 nav items from `navItems.ts`, labels via `useTranslation()` `nav.*` keys
Active state: `bg-[#E8F0FB] text-[#1E5DC4]` (primary-50 / primary-400)
Inactive hover: `bg-[#F1F5F9]` (slate-100)
Collapsed mode: icons centered, labels hidden — no overflow artifacts
Sidebar border: `border-e border-[#E2E8F0]` (logical property, slate-200)
Chevron toggle button at bottom — rotation formula accounts for both
`isRTL` and `collapsed` state
`src/layouts/components/Header.tsx` — NEW
Height: `56px` (`h-14`), `sticky top-0 z-10`
Background: `bg-background`, `border-b border-[#E2E8F0]`
Start side: current page title derived from `useLocation()` via
a `pathname → pages.*.title` i18n key map; graceful empty fallback
End side: language toggle button (shows `EN` / `ع`) calling
`toggleLanguage()`, followed by placeholder avatar circle
(32px, `bg-[#E8F0FB] text-[#1E5DC4]`, initials `م` — no handler, wired in S-004)
Mobile only (`md:hidden`): hamburger Menu icon on start side
that sets `mobileOpen` state in AppLayout
`src/layouts/components/MobileSidebar.tsx` — NEW
Wraps Shadcn `<Sheet>` component
`side` prop: `"right"` when `isRTL`, `"left"` when LTR — dynamic, no hardcoding
Renders nav items from shared `navItems.ts`
Auto-closes on any nav item click
Props: `{ open: boolean; onClose: () => void }`
`src/layouts/AppLayout.tsx` — REPLACED
Outer div: `dir={direction}`, `min-h-screen`, `bg-[#F8FAFC]` (slate-50)
Flex row layout — Sidebar fixed, main area uses logical margin offset:
`md:ms-[260px]` expanded / `md:ms-[64px]` collapsed with `transition-all duration-300`
— never `ml-*` or `mr-*`
Content area: `flex-1 overflow-y-auto p-6` (desktop) / `p-4` (mobile)
`<MobileSidebar>` open state managed here via `mobileOpen` / `setMobileOpen`
No auth logic — deferred to S-004
3. i18n Updates
Added keys to both `src/i18n/locales/ar.ts` and `src/i18n/locales/en.ts`:
Namespace	Keys added
`auth.*`	`email`, `password`, `invalidCredentials`
`nav.*`	`expand`, `collapse`
`pages.*.title`	All 7 routes: dashboard, transactions, portfolios, properties, partners, reports, settings
4. Project Structure after S-003
```
src/
├── hooks/
│   ├── useDirection.ts
│   └── useSidebarState.ts          ← NEW
├── layouts/
│   ├── AppLayout.tsx               ← REPLACED
│   └── components/
│       ├── navItems.ts             ← NEW
│       ├── Sidebar.tsx             ← NEW
│       ├── Header.tsx              ← NEW
│       └── MobileSidebar.tsx       ← NEW
├── components/
│   └── ui/
│       └── sheet.tsx               ← NEW (Shadcn Sheet)
├── pages/
│   └── LoginPage.tsx               ← UPDATED (brand fixes)
├── i18n/
│   └── locales/
│       ├── ar.ts                   ← UPDATED (auth.* + pages.*.title)
│       └── en.ts                   ← UPDATED (auth.* + pages.*.title)
├── index.css                       ← UPDATED (STR-004 tokens + fonts)
└── tailwind.config.ts              ← UPDATED (STR-004 color scales)
docs/
└── strategy/
    └── STR-004-brand-strategy.md   ← NEW
```
5. Commits
```
fix(styles): apply STR-004 CSS variables, IBM Plex fonts, remove hardcoded RTL direction
fix(tailwind): apply STR-004 color scales and fontFamily tokens
fix(layout): delete orphaned src/components/layout/AppLayout.tsx
fix(login): apply STR-004 brand tokens, dynamic direction, move strings to i18n
feat(layout): add navItems shared config
feat(layout): add useSidebarState hook with localStorage persistence
feat(layout): build Sidebar component with nav items and collapse toggle
feat(layout): build Header component with page title and language toggle
feat(layout): build MobileSidebar using Shadcn Sheet
feat(layout): integrate full shell into AppLayout
feat(i18n): add auth.* and pages.*.title keys to ar and en locales
```
Squashed into single commit on `main`:
```
feat(s-003): implement main RTL/LTR layout shell — ed201fc
```
Issues Encountered & Resolved
#	Issue	Resolution
1	`index.css` CSS variables were default Shadcn init values — all tokens rendering wrong colors	Replaced all 18 variables with STR-004 §8 exact values
2	Google Fonts import for IBM Plex Sans Arabic + Mono entirely absent	Added `@import` as first line of `index.css`
3	`direction: rtl` hardcoded in CSS overriding dynamic `dir` attribute — LTR mode broken	Removed from both `body` and `html` selectors
4	`tailwind.config.ts` had no hex color scales — `bg-primary-50`, `text-danger-400` etc. would error	Replaced with full STR-004 §7 hex scales
5	`danger` scale missing from Tailwind config entirely	Added as 4-stop hex scale
6	Orphaned `src/components/layout/AppLayout.tsx` — same export name, wrong colors, unrouted	Deleted before Phase 1 began
7	`LoginPage.tsx` used gradient, shadow, `gray-*` / `blue-*` / `red-*` color names	Full rewrite applying STR-004 hex tokens
8	`pl-10` and `left-3` in LoginPage — directional utilities breaking LTR	Replaced with `ps-10` and `start-3` (logical properties)
9	Sidebar border used `border-l` (directional)	Replaced with `border-e` (logical property)
10	Chevron icon direction logic — must account for both `isRTL` and `collapsed` simultaneously	Formula: `rotate(${isRTL !== collapsed ? 180 : 0}deg)`
Final Verification
Check	Result
`npx tsc --noEmit` (after Phase 0)	✅ Zero errors
`npx tsc --noEmit` (after Phase 1)	✅ Zero errors
IBM Plex Sans Arabic loaded in browser	✅
Sidebar expands / collapses with animation	✅
Collapse state persists across page refresh	✅
Active nav item highlights correctly on all 7 routes	✅
Language toggle switches AR ↔ EN	✅
Layout flips RTL ↔ LTR without page reload	✅
Mobile: hamburger visible below `md`, Sheet opens/closes	✅
No hardcoded `left-*` / `right-*` / `pl-*` / `pr-*` in layout files	✅
No raw Arabic or English strings in JSX	✅
`STR-004-brand-strategy.md` committed to `docs/strategy/`	✅
Pushed to `main` on GitHub	✅ `ed201fc`
---
S-004 — Authentication System (Login + Protected Routes)
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Auth Store — `src/store/authStore.ts`
Already existed from pre-sprint work with a complete Zustand implementation
Interface: `{ session, loading, error, init(), login(), logout() }`
`init()`: calls `supabaseClient.auth.getSession()`, sets session and loading: false,
subscribes to `onAuthStateChange` for reactive session updates
`login(email, password)`: sets loading: true, calls `signIn()`, sets session on
success, sets error and throws on failure
`logout()`: calls `signOut()`, sets session: null
Critical gap resolved: `init()` was never called anywhere — wired in `main.tsx` (Step 3)
Store path: `src/store/` (singular) — not `src/stores/`
2. Type Definitions — `src/types/index.ts`
`AuthUser` interface appended after existing types (line 71):
```ts
export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}
```
Decouples UI layer from Supabase's internal `User` type
`@supabase/supabase-js` `Session` type already in use in authStore — no
additional package installation required
3. i18n Updates
Added `auth.signOut` key to both locale files (line 21 in each):
- `ar.ts`: `signOut: 'تسجيل الخروج'`
- `en.ts`: `signOut: 'Sign out'`
Used as `aria-label` on the Header avatar button
4. main.tsx — Session Initialization
`useAuthStore.getState().init()` called as fire-and-forget before `createRoot(...).render(...)`
Placed after `import '@/i18n'` — i18n initializes first
Ensures session hydration from Supabase's persisted `localStorage` session
before first render — prevents ProtectedRoute from hanging in loading state
5. ProtectedRoute — `src/components/auth/ProtectedRoute.tsx`
New file; creates `src/components/auth/` directory
No props — reads `{ session, loading }` from `useAuthStore()` directly
Three-state guard logic:
`loading === true` → full-screen centered spinner:
```tsx
<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-[#1E5DC4]" />
</div>
```
`loading === false` + `session === null` → `<Navigate to={ROUTES.LOGIN} replace />`
`loading === false` + `session !== null` → `<Outlet />`
STR-004 compliant: `bg-[#F8FAFC]` (slate-50), `text-[#1E5DC4]` (primary-400)
6. Router — `src/router/index.tsx`
`'/'` route restructured: `ProtectedRoute` as outer layout route, `AppLayout`
as inner pathless layout route
```
Before:  path:'/'  element:<AppLayout />  children:[all pages]
After:   path:'/'  element:<ProtectedRoute />  children:[
           { element:<AppLayout />  children:[all pages] }
         ]
```
`AppLayout` route has NO `path` prop — pathless layout route pattern
All existing child routes (index, /transactions, /portfolios, /properties,
/partners, /reports, /settings, *) moved one level deeper, paths unchanged
`/login` route and `'*'` catch-all route unchanged
7. LoginPage — `src/pages/LoginPage.tsx`
Redirect-if-authenticated guard added after all hook calls:
```tsx
const { session, loading: authLoading } = useAuthStore();
if (!authLoading && session) return <Navigate to={ROUTES.DASHBOARD} replace />;
```
`authLoading` alias used to avoid shadowing the existing `loading` variable
`!authLoading` guard prevents flash-of-login-page during session hydration
No changes to existing form, error display, or button logic — all were already
STR-004 compliant and fully wired from S-003
8. Header — `src/layouts/components/Header.tsx`
Avatar `<div>` (placeholder from S-003) replaced with interactive `<button>`:
```tsx
<button
  onClick={handleSignOut}
  aria-label={t('auth.signOut')}
  className="w-8 h-8 rounded-full bg-[#E8F0FB] text-[#1E5DC4] flex items-center
             justify-center text-sm font-medium select-none
             hover:bg-[#B8CFF5] transition-colors cursor-pointer"
>
  {userInitial}
</button>
```
`handleSignOut`: awaits `logout()` then calls `navigate(ROUTES.LOGIN, { replace: true })`
`userInitial`: derived from `session?.user?.email?.charAt(0).toUpperCase() ?? 'م'`
Hover color `#B8CFF5` = `primary-100` from STR-004 §2.1 — compliant
Unused `language` variable removed from `useDirection()` destructuring (dead code cleanup)
No dropdown or confirmation dialog — direct sign-out on click
9. Project Structure after S-004
```
src/
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx      ← NEW
├── store/
│   └── authStore.ts                ← UNCHANGED (pre-existing)
├── layouts/
│   └── components/
│       └── Header.tsx              ← UPDATED (avatar → sign-out button)
├── pages/
│   └── LoginPage.tsx               ← UPDATED (redirect-if-authenticated guard)
├── router/
│   └── index.tsx                   ← UPDATED (ProtectedRoute wraps AppLayout)
├── types/
│   └── index.ts                    ← UPDATED (AuthUser interface added)
├── i18n/
│   └── locales/
│       ├── ar.ts                   ← UPDATED (auth.signOut added)
│       └── en.ts                   ← UPDATED (auth.signOut added)
└── main.tsx                        ← UPDATED (authStore.init() called)
```
10. Commits
```
feat(types): add AuthUser interface
feat(i18n): add auth.signOut key to ar and en locales
feat(main): call authStore.init before first render
feat(auth): add ProtectedRoute component
feat(router): wrap AppLayout with ProtectedRoute
feat(login): add redirect-if-authenticated guard
feat(header): wire avatar to signOut with dynamic initials
```
Squashed into single commit on `main`:
```
feat(s-004): implement authentication system and protected routes
```
Issues Encountered & Resolved
#	Issue	Resolution
1	`init()` never called — `loading` stuck at `true` indefinitely once ProtectedRoute added	Called `useAuthStore.getState().init()` in `main.tsx` before `createRoot`
2	`loading` variable name conflict in `LoginPage.tsx` — two `loading` values in same scope	Destructured auth store loading as `authLoading` to avoid shadowing
3	`auth.signOut` i18n key missing from both locale files — Header aria-label would error	Added `signOut` key to `auth` namespace in `ar.ts` and `en.ts`
4	Avatar element was `<div>` — not keyboard accessible, no click handler	Replaced with `<button>` with `onClick`, `aria-label`, and `hover:bg-[#B8CFF5]`
5	Unused `language` variable in Header — dead code from S-003 destructuring	Removed from `useDirection()` destructuring
6	`src/stores/` (plural) path assumed in story — actual path is `src/store/` (singular)	All imports use `@/store/authStore` — no directory created or renamed
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors after every step
`src/components/auth/ProtectedRoute.tsx` exists	✅
`src/store/authStore.ts` unchanged	✅
`init()` called in `main.tsx` before `createRoot`	✅ Line 25
Unauthenticated → any protected route	✅ Redirects to `/login`
Correct credentials → login	✅ Lands on `/` Dashboard
Page refresh while logged in	✅ Session restored, no redirect
`/login` while authenticated	✅ Redirects to `/`
Avatar click → signs out → redirects to `/login`	✅
Loading spinner visible during session hydration	✅
No off-brand color names in any modified file	✅ Grep scan clean
`auth.signOut` key in both `ar.ts` and `en.ts`	✅ Line 21 in each file
`AuthUser` type in `src/types/index.ts`	✅ Line 71
Pushed to `main` on GitHub	✅


================================================

S-005 — Dinero.js Setup & Currency Logic (USD/SYP)
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Currency Constants & Types — `src/lib/currency.ts`
New file created — pure utility layer, zero UI components, zero Supabase queries
`USD` re-exported from `@dinero.js/currencies`
`SYP` defined as a custom const — ISO 4217 defines exponent 2 (piastres) but
piastres are obsolete in this system; confirmed at implementation time that
`@dinero.js/currencies@2.0.0-alpha.1` ships `SYP.exponent === 2`, so the
custom definition with `exponent: 0` was required
`SupportedCurrency` type: `'USD' | 'SYP'` — single authoritative source for
the currency domain type across the entire codebase
`ShareFraction` interface: `{ numerator: number; denominator: number }` — used
by share validation and profit allocation logic
`Dinero<number>` throughout — BigInt variant not used
No `any` types — full TypeScript strict compliance
18 JSDoc blocks covering every exported symbol
2. Core Factory — `makeMoney`
```ts
export function makeMoney(amount: number, currency: SupportedCurrency): Dinero<number>
```
Determines scale from `currencyObj.exponent` (`100` for USD, `1` for SYP)
Uses `Math.round(amount * scale)` before passing to `dinero()` — eliminates
floating-point precision errors at object construction time
Examples:
  `makeMoney(1500.50, 'USD')` → Dinero { amount: 150050, currency: USD }
  `makeMoney(250000, 'SYP')` → Dinero { amount: 250000, currency: SYP }
3. Conversion Utilities
`dineroToNumber(d)` — extracts plain decimal via `toDecimal()`, used for
Supabase storage and non-Dinero arithmetic contexts
`toUSD(amount, currency, exchangeRate)` — pure number utility, not Dinero-based:
  USD passthrough: returns `amount` unchanged
  SYP: `Math.round((amount / exchangeRate) * 100) / 100` — avoids raw float
  imprecision, rounds to 2 decimal places
  Example: `toUSD(250000, 'SYP', 15000)` → `16.67`
4. Formatting — `formatCurrency`
```ts
export function formatCurrency(amount: number, currency: SupportedCurrency): string
```
Display-only — never used in calculations
Uses `Intl.NumberFormat` with locale `'ar-SY'` — intentional correction from
the competing implementation in `utils.ts` which incorrectly uses `'ar-SA'`
USD: `style: 'currency'`, `minimumFractionDigits: 2`, `maximumFractionDigits: 2`
SYP: `style: 'decimal'`, `maximumFractionDigits: 0`, suffix `' س.ل'` appended
5. Arithmetic Helpers
`addMoney(a, b)` — wraps Dinero's `add()`, same-currency operands required
`subtractMoney(a, b)` — wraps Dinero's `subtract()`, same-currency operands required
`zeroDinero(currency)` — returns `makeMoney(0, currency)`
`isZero(d)` — delegates to Dinero's `isZero()` imported as `dineroIsZero` to
avoid name collision with the exported wrapper
6. Share Validation — `validateShares`
```ts
export function validateShares(shares: ShareFraction[]): boolean
```
Validates that a `ShareFraction[]` sums to exactly 1
Uses LCM integer arithmetic — zero floating-point comparison risk:
  a) Returns `false` immediately for empty arrays
  b) Computes LCM of all denominators via Euclidean GCD algorithm
  c) Scales each numerator: `numerator * (LCM / denominator)`
  d) Sums scaled numerators — must equal LCM exactly
This check is enforced internally by `allocateByShares` and will be called
from every share-input form in future sprints before any save operation
7. Share Allocation — `allocateByShares`
```ts
export function allocateByShares(
  total: Dinero<number>,
  shares: ShareFraction[]
): Dinero<number>[]
```
Calls `validateShares()` at the top — throws on invalid input
Converts fractions to integer ratios via LCM, passes to Dinero's `allocate()`
Dinero's `allocate()` assigns any indivisible remainder to the first share —
guarantees no cent is ever lost
Example: distributing $100 as [2/3, 1/3]:
  → [Dinero($66.67), Dinero($33.33)] — $66.67 + $33.33 = $100.00, zero loss
8. Types Update — `src/types/index.ts`
Added import at top of file:
```ts
import type { SupportedCurrency } from '@/lib/currency';
```
Replaced `Transaction.currency: 'USD' | 'SYP'` (line 28) → `SupportedCurrency`
Replaced `Lease.currency: 'USD' | 'SYP'` (line 58) → `SupportedCurrency`
`SupportedCurrency` is now the single source of truth — all future interfaces
(portfolio balance, property valuation, capital accounts) will reference it
9. Project Structure after S-005
```
src/
├── lib/
│   ├── supabase.ts          ← UNCHANGED
│   ├── utils.ts             ← UNCHANGED (competing formatCurrency/toUSD
│   │                           coexist until consuming pages are built;
│   │                           future sprint work must import from
│   │                           @/lib/currency, not @/lib/utils)
│   └── currency.ts          ← NEW
└── types/
    └── index.ts             ← UPDATED (SupportedCurrency in Transaction + Lease)
```
10. Commits
```
feat(currency): add USD and SYP currency definitions with Dinero.js v2
feat(currency): implement makeMoney factory and dineroToNumber utility
feat(currency): add formatCurrency with Arabic locale (ar-SY)
feat(currency): add toUSD conversion helper
feat(currency): add addMoney and subtractMoney arithmetic helpers
feat(currency): add allocateByShares with LCM-based ratio calculation
feat(currency): add validateShares integer arithmetic check
feat(currency): add zeroDinero and isZero helpers
refactor(types): replace inline USD|SYP literals with SupportedCurrency
```
Squashed into single commit on `main`:
```
feat(s-005): implement Dinero.js currency layer — USD/SYP formatting, conversion, and allocation — 5c39024
```
Issues Encountered & Resolved
#	Issue	Resolution
1	`@dinero.js/currencies` SYP.exponent === 2 per ISO 4217 (piastres)	Defined custom `SYP` const with `exponent: 0`; package import not used for SYP
2	`allocate()` return type — TypeScript strict mode required explicit annotation	Added `const result: Dinero<number>[] = allocate(amount, ratios)` explicit type
3	Smoke test case `validateShares mixed denom` had arithmetic error in expected value	1/3 + 2/6 + 1/2 = 7/6 ≠ 1 — corrected test input to 1/3 + 1/6 + 1/2 = 1; `currency.ts` unchanged
4	`src/lib/utils.ts` exports `formatCurrency` and `toUSD` with same names — import collision risk	Documented in integration surface notes; no file currently imports both
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
`src/lib/currency.ts` exists at correct path	✅
`src/lib/__currency_test.ts` deleted before commit	✅
All 14 exports present	✅ USD, SYP, SupportedCurrency, ShareFraction, makeMoney, dineroToNumber, formatCurrency, toUSD, addMoney, subtractMoney, zeroDinero, isZero, validateShares, allocateByShares
18 JSDoc blocks present	✅
No `any` types in currency.ts	✅ Grep scan clean
`Dinero<number>` throughout (not bigint)	✅
SYP defined with exponent: 0	✅ Package has 2; custom const overrides
`types/index.ts` Transaction + Lease use SupportedCurrency	✅ Lines 28 and 58 updated
All 16 smoke tests passed	✅ (one test had bad expected value — fixed in test, not in currency.ts)
`src/lib/utils.ts` unmodified	✅
Squash commit pushed to `main`	✅ 5c39024

================================================

S-006 — Apply Database Migrations for All Tables
Status: ✅ Done
Closed: Sprint 1

---

What Was Built

1. Migration M-01 — Fix Existing Schema — `20260601000001_fix_existing_schema.sql`

Corrected 15 tables that existed from the original migration but contained defects discovered during the pre-sprint audit (AUDIT-S006-report.md).

Numeric precision fix — 4 columns upgraded from NUMERIC(12,4) to NUMERIC(18,4)
per STR-002 §6.2:
  exchange_rates.rate
  transactions.exchange_rate
  lease_payments.exchange_rate
  property_expenses.exchange_rate

ON DELETE behavior fix — 5 foreign keys corrected from CASCADE to RESTRICT
to prevent silent data destruction:
  transactions.portfolio_id
  lease_payments.lease_id
  property_expenses.property_id
  capital_transactions.capital_account_id
  settlement_shares.partner_id
Dynamic constraint discovery used information_schema.table_constraints with
LIKE patterns inside DO $$ blocks — handles any auto-generated constraint names
from the original migration without assuming exact names.

entity_type CHECK fix — 3 tables had CHECK IN ('portfolio','property') missing
the 'project' value required by STR-002 §1.5:
  partner_capital_accounts.entity_type
  profit_settlements.entity_type
  distributions.entity_type
Old CHECK constraints dropped dynamically, new constraints added with the
correct three-value CHECK IN ('portfolio','property','project').

journal_entry_id column added — 4 existing tables received the bare UUID column
as preparation for the FK constraint added in M-03 once journal_entries exists:
  transactions.journal_entry_id
  lease_payments.journal_entry_id
  property_expenses.journal_entry_id
  capital_transactions.journal_entry_id

Share-sum triggers created for the 2 existing join tables:
  trg_portfolio_share_sum on portfolio_members (AFTER INSERT OR UPDATE)
  trg_property_share_sum  on property_owners   (AFTER INSERT OR UPDATE)
Both triggers use PostgreSQL 13+ built-in gcd(bigint, bigint) for pure integer
LCM arithmetic — zero floating-point rounding risk.
Both declared DEFERRABLE INITIALLY DEFERRED — allows inserting multiple partners
in a single transaction before validation fires at COMMIT.

---

2. Migration M-02 — Projects & WBS — `20260601000002_add_projects_wbs.sql`

Created 4 new tables for the v1.1 project management group per STR-002 §2.6:

`projects`
  Master project record with status lifecycle:
  planning → active → on_hold → completed → cancelled
  Optional budget fields (budget_amount + budget_currency) follow STR-002 §6.2
  financial column pattern.

`project_members`
  Implements the Effective Dates pattern (STR-002 §1.6) for share history.
  effective_from / effective_to date pair allows full audit trail of share
  changes over project lifetime.
  Current shares query: WHERE effective_to IS NULL
  UNIQUE (project_id, person_id, effective_from) prevents duplicate rows.

`wbs_items`
  Self-referencing hierarchy: parent_id FK added via DO $$ block after CREATE
  TABLE to avoid circular dependency error (STR-002 §4 creation order rule).
  UNIQUE (project_id, code) enforces WBS code uniqueness per project.
  PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS — DO $$ pattern
  used for all idempotent constraint additions in this migration and all
  subsequent ones.

`project_transactions`
  journal_entry_id included at creation time as bare UUID; FK constraint
  added in M-03 after journal_entries table exists (STR-002 §7.6 two-phase
  pattern).

Share-sum trigger created for project_members:
  trg_project_share_sum (AFTER INSERT OR UPDATE, DEFERRABLE INITIALLY DEFERRED)
  Validates active shares only (effective_to IS NULL).
  Allows 0-member state (project under construction) — check fires only when
  total_num > 0.

RLS enabled and authenticated_full_access policy created on all 4 tables.

---

3. Migration M-03 — Accounting Core — `20260601000003_add_accounting_core.sql`

Created 4 new tables for the v1.2 double-entry accounting system per STR-002 §2.7:

`accounting_periods`
  Fiscal year + month structure with UNIQUE (fiscal_year, period_number).
  Three-state status: open → closed → locked.
  Locked periods reject all new journal entry postings.

`accounts`
  Chart of Accounts with full hierarchy via self-referencing parent_id.
  is_postable boolean distinguishes control accounts (false) from detail
  accounts that accept journal lines (true).
  normal_balance stored explicitly as 'debit' | 'credit' alongside account_class
  for query performance — derived logically but stored for speed.
  Self-referencing FK added via DO $$ block after table creation.

`journal_entries`
  Header record for every accounting entry.
  source_type + source_id polymorphic pattern links each entry back to its
  originating document (transaction, lease_payment, property_expense,
  capital_transaction, project_transaction, or manual).
  reversal_of self-reference allows chaining of reversal entries.
  Status lifecycle: draft → posted → reversed.
  Self-referencing FK on reversal_of added via DO $$ block after table creation.

`journal_entry_lines`
  Separate debit_amount and credit_amount columns (both DEFAULT 0).
  CHECK constraint enforces mutual exclusivity:
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0)
  No line may carry both a debit and credit amount simultaneously.

FK constraints wired — 7 DO $$ blocks added journal_entry_id FK on all 5 source
tables (columns existed as bare UUIDs from M-01 and M-02):
  transactions, lease_payments, property_expenses,
  capital_transactions, project_transactions

Balance-check trigger created:
  trg_journal_balance on journal_entry_lines
  (AFTER INSERT OR UPDATE, DEFERRABLE INITIALLY DEFERRED)
  Fires only when parent entry status = 'posted'.
  Rejects posting if Σ debit ≠ Σ credit for the journal_entry_id.
  DEFERRABLE allows building up all lines within one transaction before the
  balance check fires at COMMIT.

general_ledger VIEW created:
  Read-only projection joining journal_entry_lines → journal_entries →
  accounts → accounting_periods.
  Filters to posted entries only (je.status = 'posted').
  Not a table — cannot be out of balance by construction.

RLS enabled and authenticated_full_access policy created on all 4 tables.

---

4. Migration M-04 — Seed: Chart of Accounts — `20260601000004_seed_chart_of_accounts.sql`

Inserted 27 default accounts for a شركة أشخاص (partnership) structure.
ON CONFLICT (code) DO NOTHING ensures idempotency on re-run.
Parent UUIDs resolved via subquery JOIN on code — no hardcoded UUIDs required.
Inserted in parent-before-child order to satisfy the parent_id FK.

Account structure seeded:
  1000  الأصول           (asset     · debit  · level 1 · not postable)
  1100  الأصول المتداولة  (asset     · debit  · level 2 · not postable)
  1110  النقدية USD       (asset     · debit  · level 3 · postable)
  1120  النقدية SYP       (asset     · debit  · level 3 · postable)
  1130  الذمم المدينة     (asset     · debit  · level 3 · postable)
  1200  الأصول الثابتة   (asset     · debit  · level 2 · not postable)
  1210  العقارات          (asset     · debit  · level 3 · postable)
  1220  الاستثمارات       (asset     · debit  · level 3 · postable)
  2000  الخصوم            (liability · credit · level 1 · not postable)
  2100  الخصوم المتداولة  (liability · credit · level 2 · not postable)
  2110  الذمم الدائنة     (liability · credit · level 3 · postable)
  2120  مصروفات مستحقة   (liability · credit · level 3 · postable)
  3000  حقوق الشركاء      (equity    · credit · level 1 · not postable)
  3100  رأس المال         (equity    · credit · level 2 · not postable)
  3110  رأس مال — شريك أ  (equity    · credit · level 3 · postable)
  3120  رأس مال — شريك ب  (equity    · credit · level 3 · postable)
  3200  المسحوبات          (equity    · debit  · level 2 · not postable)
  3210  مسحوبات — شريك أ  (equity    · debit  · level 3 · postable)
  3220  مسحوبات — شريك ب  (equity    · debit  · level 3 · postable)
  4000  الإيرادات          (revenue   · credit · level 1 · not postable)
  4100  إيرادات الإيجار   (revenue   · credit · level 2 · postable)
  4200  إيرادات المشاريع  (revenue   · credit · level 2 · postable)
  4300  إيرادات المحافظ   (revenue   · credit · level 2 · postable)
  5000  المصروفات          (expense   · debit  · level 1 · not postable)
  5100  مصروفات التشغيل   (expense   · debit  · level 2 · postable)
  5200  مصروفات العقارات  (expense   · debit  · level 2 · postable)
  5300  مصروفات المشاريع  (expense   · debit  · level 2 · postable)

---

5. Migration M-05 — Seed: Accounting Periods — `20260601000005_seed_accounting_periods.sql`

Inserted 12 monthly periods for fiscal year 2026.
ON CONFLICT (fiscal_year, period_number) DO NOTHING ensures idempotency.
All periods seeded with status = 'open'.
Period names in Arabic: يناير through ديسمبر.

---

6. TypeScript Types — `src/types/index.ts`

Added 9 new interfaces for the tables introduced in M-02 and M-03:
  Project
  ProjectMember
  WbsItem
  ProjectTransaction
  AccountingPeriod
  Account
  JournalEntry
  JournalEntryLine
  GeneralLedgerRow    (maps to general_ledger VIEW columns)

Updated 5 existing interfaces with journal_entry_id: string | null:
  Transaction
  LeasePayment
  PropertyExpense
  CapitalTransaction

Updated 7 interfaces that existed without proper typing (discovered during
audit — not present in original types file):
  Portfolio, PortfolioMember, Property, PropertyOwner,
  Lease, ExchangeRate, Distribution

All currency fields use SupportedCurrency from '@/lib/currency'.
All CHECK IN columns use TypeScript union types matching STR-002 §6.4 exactly.
Nullable database columns typed as Type | null throughout.

---

7. Strategy Document — `STR-002-database-schema.md`

Created as the canonical database reference for the project (v1.3).
Covers all 23 tables with full column definitions, FK relationships,
ON DELETE behavior, creation order, canonical column naming dictionary
(§6), migration file strategy (§7), and double-entry accounting conventions (§1.7).
Mandatory reference: any new table must consult this document before
the first line of SQL is written.

---

8. Project Structure after S-006

```
supabase/
└── migrations/
    ├── 20260601000001_fix_existing_schema.sql      ← M-01
    ├── 20260601000002_add_projects_wbs.sql         ← M-02
    ├── 20260601000003_add_accounting_core.sql      ← M-03
    ├── 20260601000004_seed_chart_of_accounts.sql   ← M-04
    └── 20260601000005_seed_accounting_periods.sql  ← M-05

src/
└── types/
    └── index.ts    ← UPDATED (16 interfaces added, 5 updated)

docs/  (or project root)
└── STR-002-database-schema.md   ← NEW (v1.3)
```

---

9. Commits

```
feat(db): fix numeric precision, ON DELETE, entity_type CHECK on 15 tables
feat(db): add journal_entry_id column to 4 source tables
feat(db): add share-sum triggers for portfolio_members and property_owners
feat(db): create projects, project_members, wbs_items, project_transactions
feat(db): add share-sum trigger for project_members (effective dates aware)
feat(db): create accounting_periods, accounts, journal_entries, journal_entry_lines
feat(db): wire journal_entry_id FK constraints on 5 source tables
feat(db): add balance-check trigger on journal_entry_lines
feat(db): create general_ledger VIEW
feat(db): seed chart of accounts — 27 rows
feat(db): seed accounting periods 2026 — 12 rows
feat(types): add 9 new interfaces for project and accounting tables
feat(types): add journal_entry_id to 5 existing interfaces
docs: add STR-002-database-schema.md v1.3
```

Squashed into single commit on main:
```
feat(s-006): apply full database schema migrations with RLS, triggers, and accounting core
```

---

Issues Encountered & Resolved

#   Issue                                                        Resolution
1   ADD CONSTRAINT IF NOT EXISTS not supported in PostgreSQL     Replaced all 9 occurrences across M-02 and M-03 with
    (affects self-ref FKs and journal_entry_id FKs)             DO $$ IF NOT EXISTS ... ALTER TABLE ... END $$ pattern
2   M-01 could not assume auto-generated FK constraint names     Used information_schema.table_constraints with LIKE
    from original migration                                      pattern inside DO $$ for dynamic constraint discovery
3   project_members share-sum trigger must ignore closed         Added AND effective_to IS NULL filter to both FOR loops;
    history rows (effective_to IS NOT NULL)                      added guard: IF total_num > 0 THEN check fires
4   wbs_items and accounts self-ref FKs require table to        Created tables without the FK column constraint, then
    exist before the FK can reference itself                     added FK via DO $$ block after CREATE TABLE
5   journal_entry_id FK on source tables cannot reference       M-01/M-02 add bare UUID columns; M-03 adds FK constraints
    journal_entries before that table exists                     after journal_entries is created — two-phase pattern
6   COA seed parent_id cannot use hardcoded UUIDs               Used subquery: (SELECT id FROM accounts WHERE code = 'XXXX')
    (gen_random_uuid() produces different UUIDs each run)        to resolve parent_id dynamically at INSERT time

---

Final Verification

Check                              Result
Total tables in public schema      ✅ 23 / 23
RLS enabled on all tables          ✅ 23 / 23 (rowsecurity = true)
Share-sum triggers                 ✅ 3 — portfolio_members, property_owners, project_members
Balance trigger                    ✅ 1 — journal_entry_lines
general_ledger VIEW                ✅ present in pg_views
COA rows                           ✅ 27
Accounting period rows             ✅ 12
npx tsc --noEmit                   ✅ Zero errors
Squash commit pushed to main       ✅

=======================================================

S-007 — Verify & Document RLS Policies for All Tables
Status: ✅ Done
Closed: Sprint 1

---

What Was Built

1. RLS Audit — Full Policy Verification

Ran a targeted audit query against pg_class and pg_policy in the public
schema to produce a complete map of every table's RLS status and its
associated policies.

Audit query used:

  SELECT
    c.relname        AS table_name,
    c.relrowsecurity AS rls_enabled,
    p.polname        AS policy_name,
    p.polcmd         AS command
  FROM pg_class c
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND c.relkind = 'r'
  ORDER BY c.relname, p.polcmd;

Audit results — 23 / 23 tables verified clean:
  No table found with rls_enabled = true AND policy_name = NULL.
  No table found with rls_enabled = false.
  All 23 tables carry at least one policy covering SELECT, INSERT,
  UPDATE, and DELETE.

Two policy patterns confirmed in use across the schema:

  Pattern A — Wildcard (*): single policy covers all four operations.
  Applied to 8 tables created in M-02 and M-03:
    accounting_periods, accounts, journal_entries, journal_entry_lines,
    project_members, project_transactions, projects, wbs_items

  Pattern B — Granular (4 policies): one dedicated policy per operation
  (r · a · w · d). Applied to 15 tables created in M-01:
    capital_transactions, distributions, exchange_rates, lease_payments,
    leases, partner_capital_accounts, people, portfolio_members,
    portfolios, profit_settlements, properties, property_expenses,
    property_owners, settlement_shares, transactions

Both patterns are functionally equivalent for a single-admin-user
application. No gaps, no silent-deny risks.

---

2. Incident Note — Wrong Supabase Project

During the audit, the first query result returned tables belonging to a
different application running on the same Supabase organisation
(ap_invoices, ar_invoices, customers, entities, licenses, invitations…).

Root cause: the SQL Editor was connected to the wrong project.

Resolution: switched to the correct project URL
  https://amvsvragnchbqwsycgyt.supabase.co
and re-ran the audit query. The correct results confirmed all 23 FinFamily
tables are clean.

Action item documented: always verify the active project URL in the
Supabase Dashboard header before running any SQL in future sprints.

---

3. Documentation — `docs/security/RLS-POLICY-MATRIX.md`

Created the canonical RLS reference document for the project.

Contents:
  - Audit summary table (23/23 ✅)
  - Explanation of Pattern A vs Pattern B with SQL templates
  - Full 23-row matrix: table · rls_enabled · pattern · S/I/U/D coverage
  - Reproducible audit query for future verification
  - Maintenance rule: any new table added in a future sprint must be
    added to this matrix in the same PR that introduces the migration

File path: docs/security/RLS-POLICY-MATRIX.md

---

4. Project Structure after S-007

  docs/
  └── security/
      └── RLS-POLICY-MATRIX.md    ← NEW

  supabase/migrations/            ← UNCHANGED (no gaps found, no patch needed)

---

5. Commits

  docs(s-007): add RLS policy matrix — 23/23 tables verified

---

Issues Encountered & Resolved

#   Issue                                             Resolution
1   Audit query initially ran on wrong Supabase       Identified by presence of foreign tables
    project — returned tables from another app        (ap_invoices, customers, entities…).
                                                      Switched to correct project URL
                                                      (amvsvragnchbqwsycgyt.supabase.co)
                                                      and re-ran query.

---

Final Verification

Check                                        Result
Total tables audited                         ✅ 23 / 23
RLS enabled on all tables                    ✅ 23 / 23
Tables with rls_enabled = true + no policy   ✅ 0
Tables with rls_enabled = false              ✅ 0
Pattern A tables (wildcard *)                ✅ 8
Pattern B tables (4 granular policies)       ✅ 15
RLS-POLICY-MATRIX.md committed               ✅ docs/security/
No migration patch file required             ✅ Schema was already complete

============================================================================

S-008 — Create Seed Data for Development & Testing
Status: ✅ Done
Closed: Sprint 1

---

## What Was Built

### 1. Seed Migration File — `supabase/migrations/20260602000002_seed_dev_data.sql`

New file created — dev-only seed data, zero schema changes, zero RLS changes.
All 23 tables already covered by S-006 and S-007; this file only inserts rows.

File follows STR-002 §7.4 Rule 5: seed data in a dedicated `_seed` migration
file, never mixed with schema structure files.

Naming convention `_dev_data` distinguishes this file from operational seed
files (M-04 `_seed_chart_of_accounts`, M-05 `_seed_accounting_periods`) that
must never be wiped.

File is wrapped in `BEGIN / COMMIT` per STR-002 §7.3.

---

### 2. Guard Block — Idempotency on Re-run

```sql
IF EXISTS (SELECT 1 FROM people LIMIT 1) THEN
  RAISE NOTICE '[seed_dev_data] Data already present — skipping.';
  RETURN;
END IF;
```

Running the file a second time emits a NOTICE and exits cleanly without
inserting duplicate rows. No `ON CONFLICT` clauses needed — the guard covers
all tables in a single check since `people` is the root dependency for all
relational data in this seed.

---

### 3. People — 4 Rows

```sql
INSERT INTO people (id, name, relation, notes) VALUES
  (p_khalid, 'خالد العمر',  'شريك مؤسس', NULL),
  (p_ahmad,  'أحمد العمر',  'شريك مؤسس', NULL),
  (p_sara,   'سارة العمر',  'وارثة',      NULL),
  (p_omar,   'عمر العمر',   'وارث',       NULL);
```

Two founding partners (خالد, أحمد) and two heirs (سارة, عمر) — covers the
full range of `relation` values expected in the UI.

---

### 4. Portfolios — 3 Rows

| Name | Type | Purpose |
|------|------|---------|
| الصندوق النقدي USD | `cash_usd` | Primary USD cash reserve |
| الصندوق النقدي SYP | `cash_syp` | SYP cash reserve |
| محفظة الذهب | `gold` | Family gold reserve |

One portfolio per `type` value (excluding `project`) — sufficient to exercise
all portfolio-related UI paths.

---

### 5. Portfolio Members — 7 Rows

Share sets validated by the `trg_portfolio_share_sum` trigger at COMMIT.
All three sets sum to exactly 1 using LCM integer arithmetic (same algorithm
as `validateShares` in `src/lib/currency.ts`):

| Portfolio | Partner | Share | Decimal |
|-----------|---------|-------|---------|
| USD | خالد | 1/2 | 0.5000 |
| USD | أحمد | 1/3 | 0.3333… |
| USD | سارة | 1/6 | 0.1666… |
| SYP | خالد | 2/3 | 0.6666… |
| SYP | أحمد | 1/3 | 0.3333… |
| Gold | أحمد | 1/2 | 0.5000 |
| Gold | عمر  | 1/2 | 0.5000 |

USD portfolio uses three unequal fractions with different denominators
(2, 3, 6) — the hardest case for LCM validation; chosen deliberately to
stress-test the trigger.

---

### 6. Properties — 2 Rows

| Name | Type | Status | Estimated Value |
|------|------|--------|-----------------|
| شقة المزة | `residential` | `rented` | $120,000 |
| محل الميدان | `commercial` | `vacant` | $85,000 |

One rented and one vacant property — covers both `status` values and allows
testing of lease-related UI paths on the rented property only.

---

### 7. Property Owners — 4 Rows

Share sets validated by the `trg_property_share_sum` trigger at COMMIT:

| Property | Owner | Share | Basis |
|----------|-------|-------|-------|
| شقة المزة | خالد | 1/2 | إرث |
| شقة المزة | أحمد | 1/2 | إرث |
| محل الميدان | خالد | 2/3 | شراء |
| محل الميدان | عمر  | 1/3 | شراء |

Two `ownership_basis` values exercised: `إرث` and `شراء`.

---

### 8. Lease — 1 Row

Active lease on شقة المزة only (محل الميدان is vacant — no lease by design):

```
tenant_name : محمد الحسن
rent_amount : 500.0000 USD
frequency   : monthly
start_date  : 2025-01-01
end_date    : 2026-12-31
```

Lease spans into the current fiscal year (2026) so it appears in
upcoming-obligations queries on the Dashboard (S-063).

---

### 9. Exchange Rates — 3 Rows

Three consecutive monthly rates covering Q2 2026:

| Date | Rate (SYP per 1 USD) |
|------|----------------------|
| 2026-04-01 | 13,500 |
| 2026-05-01 | 13,750 |
| 2026-06-01 | 14,000 |

The most recent rate (14,000) is the one auto-fetched by transaction forms
per S-047. Progressive values test rate-history display in the exchange-rates
page (S-046).

---

### 10. Transactions — 10 Rows

Mix of all three `type` values across both currencies:

| # | Portfolio | Type | Amount | Currency | Category |
|---|-----------|------|--------|----------|----------|
| 1 | USD | income | 500 | USD | إيجار |
| 2 | USD | income | 500 | USD | إيجار |
| 3 | USD | income | 500 | USD | إيجار |
| 4 | SYP | income | 2,800,000 | SYP | إيجار |
| 5 | USD | income | 1,200 | USD | أرباح مشروع |
| 6 | USD | expense | 150 | USD | صيانة |
| 7 | SYP | expense | 420,000 | SYP | فواتير |
| 8 | USD | expense | 80 | USD | رسوم |
| 9 | USD | transfer | 300 | USD | تحويل |
| 10 | SYP | transfer | 5,600,000 | SYP | تحويل |

SYP transactions (rows 4, 7, 10) carry `exchange_rate = 14000.0000` per
STR-002 §1.3. USD transactions carry `exchange_rate = NULL` — USD is the
reference currency and requires no conversion.

---

### 11. UUID Strategy

All IDs declared as `DECLARE` variables at the top of the `DO $$` block:

```sql
DECLARE
  p_khalid  uuid := gen_random_uuid();
  p_ahmad   uuid := gen_random_uuid();
  ...
```

This approach allows cross-table references (e.g. `portfolio_members` →
`portfolios` → `people`) within a single anonymous block without hardcoding
UUIDs. No UUIDs are hardcoded anywhere in the file — re-running after a wipe
generates fresh UUIDs with no conflicts.

---

### 12. Wipe Instructions

Documented as a SQL comment block at the end of the migration file.
Safe execution order respects FK RESTRICT constraints:

```sql
TRUNCATE
  transactions,
  lease_payments,
  property_expenses,
  leases,
  portfolio_members,
  property_owners,
  properties,
  portfolios,
  exchange_rates,
  people
RESTART IDENTITY CASCADE;
```

Tables NOT included in the wipe (operational seed — never delete):
- `accounts` — seeded in M-04
- `accounting_periods` — seeded in M-05

---

### 13. Project Structure after S-008

```
supabase/
└── migrations/
    ├── 20260601000001_fix_existing_schema.sql       ← M-01 (S-006)
    ├── 20260601000002_add_projects_wbs.sql          ← M-02 (S-006)
    ├── 20260601000003_add_accounting_core.sql       ← M-03 (S-006)
    ├── 20260601000004_seed_chart_of_accounts.sql    ← M-04 (S-006) — DO NOT WIPE
    ├── 20260601000005_seed_accounting_periods.sql   ← M-05 (S-006) — DO NOT WIPE
    └── 20260602000002_seed_dev_data.sql             ← NEW (S-008) — safe to wipe
```

---

### 14. Verification Queries

Run after applying the migration to confirm row counts:

```sql
-- Primary tables
SELECT 'people'             AS tbl, COUNT(*) FROM people
UNION ALL
SELECT 'portfolios',                COUNT(*) FROM portfolios
UNION ALL
SELECT 'transactions',              COUNT(*) FROM transactions
UNION ALL
SELECT 'exchange_rates',            COUNT(*) FROM exchange_rates;
-- Expected: 4 · 3 · 10 · 3

-- Relational tables
SELECT 'portfolio_members'  AS tbl, COUNT(*) FROM portfolio_members
UNION ALL
SELECT 'property_owners',           COUNT(*) FROM property_owners
UNION ALL
SELECT 'properties',                COUNT(*) FROM properties
UNION ALL
SELECT 'leases',                    COUNT(*) FROM leases;
-- Expected: 7 · 4 · 2 · 1
```

Both queries returned expected values ✅

---

### 15. Commit

```
feat(s-008): add dev seed data — people, portfolios, properties, transactions

- 4 people, 3 portfolios, 7 portfolio_members
- 2 properties, 4 property_owners, 1 lease
- 3 exchange_rates, 10 transactions
- Guard prevents duplicate inserts on re-run
- Wipe instructions included as SQL comment

Closes S-008
```

Squashed into single commit on `main`:
```
feat(s-008): add dev seed data — people, portfolios, properties, transactions — aa7680d
```

---

## Issues Encountered & Resolved

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Migration filename saved with spaces from Cursor (`20260602000002 seed dev data.sql`) | Renamed via PowerShell `Rename-Item` before staging — Supabase requires underscores in migration filenames |
| 2 | `git push origin main` merged with `git log` command in terminal — push not executed | Re-ran `git push origin main` separately; confirmed `main` updated to `aa7680d` |
| 3 | USD portfolio shares (1/2 + 1/3 + 1/6) risk floating-point false negative if trigger used float comparison | Trigger uses PostgreSQL built-in `gcd(bigint, bigint)` for pure LCM arithmetic — zero float risk; all three fractions accepted at COMMIT ✅ |

---

## Final Verification

| Check | Result |
|-------|--------|
| Migration file at correct path | ✅ `supabase/migrations/20260602000002_seed_dev_data.sql` |
| File wrapped in `BEGIN / COMMIT` | ✅ |
| Guard block present | ✅ |
| `people` count = 4 | ✅ |
| `portfolios` count = 3 | ✅ |
| `portfolio_members` count = 7 | ✅ |
| `properties` count = 2 | ✅ |
| `property_owners` count = 4 | ✅ |
| `leases` count = 1 | ✅ |
| `exchange_rates` count = 3 | ✅ |
| `transactions` count = 10 | ✅ |
| Share-sum triggers accepted all sets | ✅ (no trigger violation at COMMIT) |
| `accounts` and `accounting_periods` untouched | ✅ |
| Wipe instructions documented in file | ✅ |
| Filename uses underscores (no spaces) | ✅ |
| Squash commit pushed to `main` | ✅ `aa7680d` |
