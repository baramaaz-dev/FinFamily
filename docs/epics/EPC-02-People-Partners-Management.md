EPC-02 — People & Partners Management
Epic: E2 — إدارة الأشخاص والشركاء
Sprint: Sprint 1 & 7 — الأشخاص والشركاء
Status: 🔄 In Progress
---
Stories Overview
Story	Title	Status
S-015	People List Page					✅ Done
S-016	Add Person Form					⏳ Pending
S-017	Edit Person Form				⏳ Pending
S-018	Delete Person (with dependency check)		⏳ Pending
S-056	Partner Detail Page (all entities)		⏳ Pending
S-057	Partner share per portfolio and property	⏳ Pending
S-058	Partner withdrawals log				⏳ Pending
S-059	Add new withdrawal form (distributions)		⏳ Pending
S-060	Partner capital summary across all entities	⏳ Pending
---
S-015 — People List Page
Status: ✅ Done
Closed: Sprint 1
What Was Built
1. Shadcn Components Installed
`src/components/ui/table.tsx` — installed via `npx shadcn@latest add table`
`src/components/ui/button.tsx` — installed via `npx shadcn@latest add button`
Note: button.tsx was listed as pre-existing in S-001 documentation but was
never explicitly installed. S-003 and S-004 used native `<button>` HTML
elements styled with Tailwind throughout, so the gap was invisible until
S-015 was the first story to import Shadcn `<Button>`.
2. TypeScript Types — `src/types/index.ts`
`Person` interface verified and corrected to exactly match the DB schema:
```ts
export interface Person {
  id: string;
  name: string;
  relation: string | null;
  notes: string | null;
  created_at: string;
}
```
Pre-existing version had incorrect non-nullable fields for `relation` and
`notes` and was missing `created_at` — all three corrected.
3. i18n — `src/i18n/locales/ar.ts` and `src/i18n/locales/en.ts`
Added `people` namespace to both locale files (14 keys + comingSoon):
Namespace	Keys
`people.pageTitle`		"الأشخاص" / "People"
`people.pageSubtitle`		"إدارة أعضاء العائلة والشركاء" / "Manage family members and partners"
`people.addPerson`		"إضافة شخص" / "Add Person"
`people.columns.name`		"الاسم" / "Name"
`people.columns.relation`	"صلة القرابة" / "Relation"
`people.columns.notes`		"الملاحظات" / "Notes"
`people.columns.addedAt`	"تاريخ الإضافة" / "Date Added"
`people.columns.actions`	"الإجراءات" / "Actions"
`people.actions.edit`		"تعديل" / "Edit"
`people.actions.delete`		"حذف" / "Delete"
`people.empty.title`		"لا يوجد أشخاص مسجّلون" / "No people registered"
`people.empty.subtitle`		"ابدأ بإضافة أول شخص للنظام" / "Start by adding the first person to the system"
`people.error.title`		"تعذّر تحميل البيانات" / "Failed to load data"
`people.error.retry`		"إعادة المحاولة" / "Try Again"
4. People List Page — `src/pages/PeoplePage.tsx` (full replacement of stub)
The stub created in S-002 was replaced with a complete production-ready
implementation. All logic split into four units: the page component, and
three sub-components for loading / empty / error states.
Data Fetching
`fetchPeople()` extracted outside the component as a standalone async function:
```ts
async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
```
`useQuery` with `queryKey: ['people']` and `staleTime: 60_000`
Default value `data: people = []` prevents undefined access during loading
Page Header
Title: `text-xl font-medium text-[#1E293B]` — from `t('people.pageTitle')`
Subtitle: `mt-0.5 text-sm text-[#475569]` — from `t('people.pageSubtitle')`
"إضافة شخص" Button: `bg-[#1E5DC4] text-white hover:bg-[#164399]` with Plus icon
Button is `disabled` and `aria-label` notes "قريباً" — wired in S-016
Table (rendered when data exists)
Wrapped in `<div role="region" aria-label={t('people.pageTitle')}>` for accessibility
Shadcn `<Table>` component used — not native `<table>`
Header row: `bg-[#F1F5F9] hover:bg-[#F1F5F9]`
All `<TableHead>` cells use `text-start` (logical) — never `text-left`
Actions column uses `text-end` (logical) — never `text-right`
5 columns: الاسم · صلة القرابة · الملاحظات · تاريخ الإضافة · الإجراءات
Body rows: `text-sm text-[#1E293B] hover:bg-[#F1F5F9]`
Null `relation` and `notes` cells display `—` (em dash)
`notes` cell: `truncate max-w-[200px] block` with `title` for full text on hover
`created_at` formatted with `date-fns`: `format(new Date(person.created_at), 'dd/MM/yyyy')`
`created_at` cell: `font-mono tabular-nums text-[#475569]`
Edit button: native `<button disabled>` with `Pencil` icon, `text-[#1E5DC4] opacity-40`
Delete button: native `<button disabled>` with `Trash2` icon, `text-[#C0392B] opacity-40`
Both action buttons use `aria-label` from `t()` and `title="قريباً"` — wired in S-017/S-018
`PeopleSkeleton` Sub-component
`aria-busy="true"` on wrapper div
One header-like row with `bg-[#F1F5F9]` + 5 data rows
All bars: `animate-pulse rounded bg-[#E2E8F0]` — built inline, no Shadcn Skeleton import
Proportional widths: 1/4 · 1/6 · 1/3 · auto for data columns
`PeopleEmpty` Sub-component
`flex flex-col items-center justify-center gap-3 py-16`
`Users` icon from lucide-react: `h-12 w-12 text-[#94A3B8]` (slate-400)
Heading: `text-base font-medium text-[#1E293B]`
Sub-text: `text-sm text-[#475569]`
Disabled "إضافة شخص" Button — same styling as header button
`PeopleError` Sub-component
Props: `{ onRetry: () => void, t: (key: string) => string }`
Error message: `text-sm font-medium text-[#C0392B]`
Retry Button: `variant="outline"` with `border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]`
`onClick` calls `refetch()` from React Query
5. STR-004 Compliance
All colors expressed as hex values — no Tailwind color names (gray-*, blue-*, etc.)
All directional utilities are logical properties: `text-start`, `text-end`, `ms-*`, `ps-*`
No gradients anywhere in the file
No hardcoded Arabic or English strings in JSX — all resolved through `t()`
Card container: `overflow-hidden rounded-lg border border-[#E2E8F0] bg-white`
Page background handled by AppLayout (`bg-[#F8FAFC]`) — no bg class on page div
6. Project Structure after S-015
```
src/
├── components/
│   └── ui/
│       ├── button.tsx           ← NEW (Shadcn Button — was missing from S-001)
│       └── table.tsx            ← NEW (Shadcn Table)
├── i18n/
│   └── locales/
│       ├── ar.ts                ← UPDATED (people.* namespace added)
│       └── en.ts                ← UPDATED (people.* namespace added)
├── pages/
│   └── PeoplePage.tsx           ← REPLACED (stub → full implementation)
├── types/
│   └── index.ts                 ← UPDATED (Person interface corrected)
└── package.json / package-lock  ← UPDATED (table + button deps)
```
7. Commits
```
feat(ui): add Shadcn Table component
feat(types): verify Person interface matches people table schema
feat(i18n): add people.* namespace to ar and en locales
feat(people): implement People list page — table, skeleton, empty and error states
chore(deps): add shadcn table and button components
```
Merged via `--no-ff` into `feature/sprint-01`:
```
feat(s-015): implement People list page
```
---
Issues Encountered & Resolved
#	Issue	Resolution
1	`button.tsx` missing from `src/components/ui/` despite S-001 listing Shadcn as "installed"	Installed via `npx shadcn@latest add button`. Root cause: `npx shadcn@latest init` only sets up configuration — each component requires an explicit `add` command. S-001 documentation updated with a note clarifying this distinction.
2	`Person` interface had non-nullable `relation` and `notes` and missing `created_at`	Corrected all three fields to match the DB schema exactly: `relation: string | null`, `notes: string | null`, `created_at: string`
3	`package.json` and `package-lock.json` modified by Shadcn installs but not staged in the S-015 commits	Discovered via `git status` after merging to `feature/sprint-01`. Committed separately: `chore(deps): add shadcn table and button components`
---
Final Verification
Check	Result
`npx tsc --noEmit`	✅ Zero errors
Brand scan clean	✅ `grep -n "text-gray\|text-blue\|text-red\|text-green\|bg-gray\|bg-blue\|text-left\|text-right\|pl-\|pr-\|ml-\|mr-"` → empty
Arabic string scan clean	✅ `grep -n '="[أ-ي]'` → empty
4 seed people render in table	✅ خالد · أحمد · سارة · عمر
Skeleton visible on Slow 3G (DevTools)	✅
Error state visible on broken Supabase URL	✅ Retry button functional
Empty state visible after TRUNCATE people	✅
`feature/sprint-01` up to date	✅ `fdcbc2d`
`feature/s-015-people-list-page` deleted	✅ Local + remote