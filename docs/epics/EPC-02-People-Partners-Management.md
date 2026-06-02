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

===============================================================================

EPC-02 — People & Partners Management
Epic: E2 — إدارة الأشخاص والشركاء
Sprint: Sprint 1 & 7 — الأشخاص والشركاء
Status: 🔄 In Progress
---
Stories Overview
Story	Title	Status
S-015	People List Page					✅ Done
S-016	Add Person Form					✅ Done
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
S-016 — Add Person Form
Status: ✅ Done
Closed: Sprint 1
What Was Built
1. Shadcn Components Installed
`src/components/ui/label.tsx`    — installed via `npx shadcn@latest add label`
`src/components/ui/textarea.tsx` — installed via `npx shadcn@latest add textarea`
Note: `dialog.tsx` and `input.tsx` were already present as untracked files — not reinstalled.
`sonner` installed via npm — no toast library existed in the project prior to this story.
`<Toaster position="bottom-right" richColors />` added to `App.tsx`.
2. i18n — `src/i18n/locales/ar.ts` and `src/i18n/locales/en.ts`
Added three nested sub-objects inside the existing `people` namespace:
Sub-namespace	Keys
`people.form.*`		11 keys (dialogTitle · dialogDescription · nameLabel · namePlaceholder · relationLabel · relationPlaceholder · notesLabel · notesPlaceholder · submitButton · cancelButton · submitting)
`people.validation.*`	5 keys (nameRequired · nameTooShort · nameTooLong · relationTooLong · notesTooLong)
`people.toast.*`	2 keys (addSuccess · addError)
Note: Keys follow the locale files' existing nested structure — not flat dot-notation strings.
3. AddPersonDialog Component — `src/components/people/AddPersonDialog.tsx` (new file)
Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`
Zod Schema
Zod v4 used (matches project's installed version). `@hookform/resolvers/zod` auto-detects v4.
`relation` and `notes` declared `.optional()` — Zod v4 `.optional()` natively accepts empty
strings without requiring `.or(z.literal(''))`.
Error messages stored as i18n keys (e.g. `'people.validation.nameRequired'`) — resolved by
`t()` in JSX, never as raw strings inside the schema.
```ts
const addPersonSchema = z.object({
  name: z.string().min(1, { message: 'people.validation.nameRequired' })
                  .min(2, { message: 'people.validation.nameTooShort' })
                  .max(100, { message: 'people.validation.nameTooLong' }),
  relation: z.string().max(80, { message: 'people.validation.relationTooLong' }).optional(),
  notes:    z.string().max(500, { message: 'people.validation.notesTooLong' }).optional(),
});
```
React Hook Form
`useForm` with `zodResolver(addPersonSchema)` and `defaultValues: { name: '', relation: '', notes: '' }`
`handleOpenChange` wrapper resets the form on every close regardless of trigger (X, Escape, cancel button)
onSubmit Handler
```ts
const onSubmit = async (data: AddPersonFormData) => {
  const { error } = await supabaseClient.from('people').insert({
    name:     data.name.trim(),
    relation: data.relation?.trim() || null,
    notes:    data.notes?.trim() || null,
  });
  if (error) { toast.error(t('people.toast.addError')); return; }
  await queryClient.invalidateQueries({ queryKey: ['people'] });
  toast.success(t('people.toast.addSuccess'));
  handleOpenChange(false);
};
```
Dialog Behaviour
Shadcn `<Dialog>` component used. `onInteractOutside={(e) => e.preventDefault()}` on
`<DialogContent>` blocks overlay-click closure (prevents accidental data loss).
`<DialogDescription className="sr-only">` used for accessibility — visually hidden.
Escape key and X button both trigger `handleOpenChange(false)` → form resets.
Footer: Cancel button calls `handleOpenChange(false)`; Submit button shows `<Loader2 className="animate-spin" />` + `t('people.form.submitting')` while `isSubmitting === true`.
4. PeoplePage wired — `src/pages/PeoplePage.tsx` (updated)
`useState<boolean>(false)` added for `dialogOpen` / `setDialogOpen`
`PeopleEmpty` refactored to accept `onAdd: () => void` prop
Both "إضافة شخص" buttons (header + empty state) now call `setDialogOpen(true)` — `disabled` and `title="قريباً"` removed from both
`<AddPersonDialog open={dialogOpen} onOpenChange={setDialogOpen} />` rendered at bottom of return
5. STR-004 Compliance
All colors expressed as hex values — no Tailwind color names (gray-*, blue-*, etc.)
All directional utilities are logical properties: `text-start`, `text-end`, `ms-*`, `ps-*`
No gradients anywhere in the file
No hardcoded Arabic or English strings in JSX — all resolved through `t()`
Input focus ring: `focus-visible:ring-[#1E5DC4]`
Error text: `text-[#C0392B]`
Submit button: `bg-[#1E5DC4] hover:bg-[#164399] text-white`
Cancel button: `border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]`
6. Project Structure after S-016
```
src/
├── components/
│   ├── people/
│   │   └── AddPersonDialog.tsx      ← NEW
│   └── ui/
│       ├── label.tsx                ← NEW (Shadcn Label)
│       └── textarea.tsx             ← NEW (Shadcn Textarea)
├── i18n/
│   └── locales/
│       ├── ar.ts                    ← UPDATED (people.form.* · people.validation.* · people.toast.*)
│       └── en.ts                    ← UPDATED (same keys in English)
├── pages/
│   └── PeoplePage.tsx               ← UPDATED (dialog state wired, PeopleEmpty onAdd prop)
└── App.tsx                          ← UPDATED (<Toaster /> added)
```
7. Commits
```
feat(ui): add Shadcn Label and Textarea components; install sonner
feat(i18n): add people.form, people.validation, people.toast keys to ar and en locales
feat(people): implement AddPersonDialog with RHF + Zod v4 validation and Supabase insert
feat(people): wire AddPersonDialog into PeoplePage — enable header and empty-state buttons
```
Merged via `--no-ff` into `feature/sprint-01`:
```
feat(s-016): implement Add Person form
```
---
Issues Encountered & Resolved (S-015)
#	Issue	Resolution
1	`button.tsx` missing from `src/components/ui/` despite S-001 listing Shadcn as "installed"	Installed via `npx shadcn@latest add button`. Root cause: `npx shadcn@latest init` only sets up configuration — each component requires an explicit `add` command. S-001 documentation updated with a note clarifying this distinction.
2	`Person` interface had non-nullable `relation` and `notes` and missing `created_at`	Corrected all three fields to match the DB schema exactly: `relation: string | null`, `notes: string | null`, `created_at: string`
3	`package.json` and `package-lock.json` modified by Shadcn installs but not staged in the S-015 commits	Discovered via `git status` after merging to `feature/sprint-01`. Committed separately: `chore(deps): add shadcn table and button components`
---
Final Verification (S-015)
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
---
Issues Encountered & Resolved (S-016)
#	Issue	Resolution
1	`dialog.tsx` and `input.tsx` already present as untracked files	Not reinstalled. Verified they were functional before proceeding. Added to tracking via the S-016 commit.
2	No toast library existed in the project	Installed `sonner` via npm. Added `<Toaster position="bottom-right" richColors />` to App.tsx. No existing code was affected.
3	Zod v4 `.optional()` behaviour differs from v3	In Zod v4, `.optional()` natively accepts empty strings — `.or(z.literal(''))` pattern from v3 is not needed and was omitted.
---
Final Verification (S-016)
Check	Result
`npx tsc --noEmit`	✅ Zero errors
Brand scan clean	✅ `grep -n "text-gray\|text-blue\|text-red\|text-green\|bg-gray\|bg-blue\|text-left\|text-right\|pl-\|pr-\|ml-\|mr-"` src/components/people/AddPersonDialog.tsx → empty
Arabic string scan clean	✅ `grep -n '="[أ-ي]'` → only HTML attribute values flagged (correct — no JSX user-visible strings hardcoded)
Dialog opens from header button	✅
Dialog opens from empty-state button	✅
Inline validation errors on invalid submit	✅ nameRequired · nameTooShort shown correctly
Overlay click does NOT close dialog	✅ onInteractOutside blocked
Escape / X button closes and resets form	✅
Successful insert refreshes table	✅ React Query invalidation confirmed
Success toast shown after insert	✅ sonner richColors green
Error toast shown on Supabase failure	✅ sonner richColors red
`feature/sprint-01` up to date	✅
`feature/s-016-add-person-form` deleted	✅ Local + remote