EPC-01 — Infrastructure & Setup
Epic: E1 — البنية التحتية والإعداد
Sprint: Sprint 0 — الإعداد والبنية التحتية
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-001	Development Environment & External Tools Setup	✅ Done
S-002	React Router DOM Setup, Page Structure & i18n Infrastructure	✅ Done
S-003	Main RTL/LTR Layout (Sidebar + Header + Content)	✅ Done
S-004	Authentication System (Login + Protected Routes)	✅ Done
S-005	Dinero.js Setup & Currency Logic (USD/SYP)	✅ Done
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
---
S-005 — Dinero.js Setup & Currency Logic (USD/SYP)
Status: ✅ Done
Closed: Sprint 0
What Was Built
1. Currency Constants & Types — `src/lib/currency.ts`
New file created at `src/lib/currency.ts` — pure utility layer, no UI components
`USD` re-exported from `@dinero.js/currencies`
`SYP` defined as a custom const with `exponent: 0` — ISO 4217 defines exponent 2
(piastres) but piastres are obsolete in this system; confirmed at implementation
time that `@dinero.js/currencies@2.0.0-alpha.1` ships `SYP.exponent === 2`,
so the custom definition was required
`SupportedCurrency` type: `'USD' | 'SYP'` — single source of truth for the
currency domain type across the entire codebase
`ShareFraction` interface: `{ numerator: number; denominator: number }` — used
by share validation and profit allocation logic
All exported symbols carry JSDoc blocks (18 JSDoc blocks total)
No `any` types — full TypeScript strict compliance
`Dinero<number>` throughout — BigInt variant not used
2. Core Factory — `makeMoney`
Accepts a human-readable decimal amount and a `SupportedCurrency` code
Determines scale from `currencyObj.exponent` (`100` for USD, `1` for SYP)
Uses `Math.round(amount * scale)` before passing to `dinero()` — eliminates
floating-point precision errors at construction time
Examples:
  `makeMoney(1500.50, 'USD')` → Dinero { amount: 150050, currency: USD }
  `makeMoney(250000, 'SYP')` → Dinero { amount: 250000, currency: SYP }
3. Conversion & Formatting
`dineroToNumber(d)` — extracts plain decimal from a Dinero object via
`toDecimal()`, used for Supabase storage and non-Dinero contexts
`toUSD(amount, currency, exchangeRate)` — pure number utility, not Dinero-based:
  USD passthrough returns amount unchanged
  SYP: `Math.round((amount / exchangeRate) * 100) / 100` — rounds to 2 decimal
  places, avoids raw float imprecision
`formatCurrency(amount, currency)` — display-only, never used in calculations:
  Uses `Intl.NumberFormat` with locale `'ar-SY'` (not `'ar-SA'` — intentional
  correction from the competing implementation in `utils.ts`)
  USD: `style: 'currency'`, `minimumFractionDigits: 2`
  SYP: `style: 'decimal'`, `maximumFractionDigits: 0`, suffix `' س.ل'`
4. Arithmetic Helpers
`addMoney(a, b)` — wraps Dinero's `add()`, same-currency operands required
`subtractMoney(a, b)` — wraps Dinero's `subtract()`, same-currency operands required
`zeroDinero(currency)` — returns `makeMoney(0, currency)`
`isZero(d)` — delegates to Dinero's `isZero()` to avoid float comparison
5. Share Validation — `validateShares`
Validates that an array of `ShareFraction` objects sums to exactly 1
Uses LCM integer arithmetic — zero floating-point comparison risk:
  a) Compute LCM of all denominators (Euclidean GCD → LCM(a,b) = a*b/GCD(a,b))
  b) Scale each numerator: `numerator * (LCM / denominator)`
  c) Sum scaled numerators — must equal LCM exactly
Returns `false` for empty arrays
This is the same check enforced in UI forms before every save in future sprints
6. Share Allocation — `allocateByShares`
Distributes a total Dinero amount across partners by fractional shares
Calls `validateShares()` internally and throws on invalid input
Converts fractions to integer ratios via LCM before passing to Dinero's
`allocate()` — guarantees no rounding loss (indivisible remainder assigned
to first share per Dinero's allocate contract)
Example: distributing $100 as [2/3, 1/3] → [$66.67, $33.33], total = $100.00
7. Types Update — `src/types/index.ts`
Added import: `import type { SupportedCurrency } from '@/lib/currency'`
Replaced `Transaction.currency: 'USD' | 'SYP'` (line 28) with `SupportedCurrency`
Replaced `Lease.currency: 'USD' | 'SYP'` (line 58) with `SupportedCurrency`
`SupportedCurrency` is now the authoritative type — all future interfaces
(portfolio balance, property valuation, exchange rates) will reference it
8. Project Structure after S-005
```
src/
├── lib/
│   ├── supabase.ts              ← UNCHANGED
│   ├── utils.ts                 ← UNCHANGED (formatCurrency/toUSD coexist;
│   │                               will be superseded by consuming pages)
│   └── currency.ts              ← NEW
└── types/
    └── index.ts                 ← UPDATED (SupportedCurrency in Transaction + Lease)
```
9. Commits
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
1	`@dinero.js/currencies` SYP.exponent === 2 (ISO 4217 standard — piastres)	Defined custom `SYP` const with `exponent: 0`; package import not used for SYP
2	Smoke test case `validateShares mixed denom` had arithmetic error in expected value	1/3 + 2/6 + 1/2 = 7/6, not 1 — corrected test to 1/3 + 1/6 + 1/2 = 1; `currency.ts` was not changed
3	`allocate()` return type inference — TypeScript strict mode required explicit annotation	Added `const result: Dinero<number>[] = allocate(amount, ratios)` explicit type
4	`src/lib/utils.ts` exports `formatCurrency` and `toUSD` with same names — import collision risk	`currency.ts` consumers must import from `@/lib/currency`, not `@/lib/utils`; documented in integration surface notes
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
`src/lib/currency.ts` exists at correct path	✅
`src/lib/__currency_test.ts` deleted before commit	✅
All 14 exports present	✅ USD, SYP, SupportedCurrency, ShareFraction, makeMoney, dineroToNumber, formatCurrency, toUSD, addMoney, subtractMoney, zeroDinero, isZero, validateShares, allocateByShares
18 JSDoc blocks present	✅
No `any` types	✅ Verified — only appears in comment text
`Dinero<number>` throughout (not bigint)	✅
SYP defined with exponent: 0	✅ Package has 2; custom const overrides
`types/index.ts` Transaction + Lease use SupportedCurrency	✅ Both lines updated
All 16 smoke tests passed	✅ (one test had bad expected value — fixed in test, not in currency.ts)
`src/lib/utils.ts` unmodified	✅
Squash commit pushed to `main`	✅ 5c39024