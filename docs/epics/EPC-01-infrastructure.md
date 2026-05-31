# EPC-01 — Infrastructure & Setup
**Epic:** E1 — البنية التحتية والإعداد
**Sprint:** Sprint 0 — الإعداد والبنية التحتية
**Status:** 🟡 In Progress

---

## Stories Overview

| Story | Title | Status |
|-------|-------|--------|
| S-001 | Development Environment & External Tools Setup | ✅ Done |
| S-002 | React Router DOM Setup & Page Structure | ⬜ Pending |
| S-003 | Main RTL Layout (Sidebar + Header + Content) | ⬜ Pending |
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
