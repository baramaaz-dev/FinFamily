EPC-05 — Properties & Real Estate
Epic: E5 — العقارات وإدارة الأصول العقارية
Sprint: Sprint 3
Status: 🔄 In Progress
---
Stories Overview
Story	Title	Status
S-026	Properties List Page				✅ Done
S-027	Add Property Form				📋 Planned
S-028	Edit Property Form				📋 Planned
S-029	Property Ownership Sheet (Owners + Basis)	📋 Planned
S-030	Set Ownership Fractions & Basis			📋 Planned
S-031	Validate Ownership Total = 1 before Save	📋 Planned
S-032	Lease Management (Add / Edit / List)		📋 Planned
S-033	Record Lease Payment				📋 Planned
S-034	Property Expenses (Add / List)			📋 Planned
S-035	Property Detail View				📋 Planned
---

================================================================================

S-026 — Properties List Page
قائمة العقارات
Epic: E5 — العقارات وإدارة الأصول العقارية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
Depends on: S-025 (Portfolio Detail View)
Blocks: S-027 (Add Property Form)

---

Overview

Foundation story for the Properties & Real Estate module (E5). Builds the
PropertiesPage at route /properties: a table listing all registered properties
with type, location, status, estimated value, and owner count. Follows the
structural pattern of S-019 (Portfolio List Page) exactly.

No forms, no detail navigation, no ownership management in this story.
All action buttons (Edit · Owners · Delete) are rendered as disabled with
title={t('properties.comingSoon')} and wired in S-027, S-028, S-029.

---

What Was Built

1. Audit Findings (Phase 0)

  - Branch feature/s-026-properties-list-page already existed and was clean
  - PropertiesPage.tsx stub existed (12-line placeholder from S-002)
  - /properties route already wired at src/router/index.tsx:35
  - Property interface already existed at types/index.ts:48 — was missing only
    the derived `owners_count` field
  - Locale files (ar.ts / en.ts) had no properties namespace
  - Baseline npx tsc --noEmit: 0 errors

---

2. TypeScript Types — src/types/index.ts

`owners_count: number` appended to the existing `Property` interface.
No new interface was created — the pre-existing stub interface was extended.
No other interfaces modified or removed.

Final Property interface after the update:

```ts
export interface Property {
  id:              string;
  name:            string;
  type:            'residential' | 'commercial' | 'land';
  location:        string | null;
  purchase_date:   string | null;    // ISO date 'YYYY-MM-DD'
  estimated_value: number | null;    // numeric(18,4) in DB; null = unknown value
  status:          'rented' | 'vacant';
  owners_count:    number;           // derived — NOT a DB column
                                     // injected via property_owners(count) aggregate
}
```

Note: `type` and `status` are strict union literals — not `string`. Required for
`typeBadgeClass()` / `statusBadgeClass()` exhaustive mapping and future type checks.

---

3. i18n — src/i18n/locales/ar.ts and src/i18n/locales/en.ts

Added `properties` top-level namespace after the existing `portfolios` object.
38 keys added. No existing keys modified or removed.

Note on key count: specification called for 24 keys; implementation added 38.
The extra 14 keys were pre-emptive additions covering action labels and status
strings that would be needed in S-027–S-029 anyway. All keys are within the
`properties.*` namespace — no collision with any existing namespace.

Sub-namespace               Keys
properties.*                5 root keys
properties.columns.*        7 keys
properties.types.*          3 keys
properties.status.*         2 keys
properties.actions.*        3 keys
properties.empty.*          2 keys
properties.error.*          2 keys
Additional pre-emptive keys 14 keys (form, validation, toast stubs for S-027+)
Total                       38 keys

Arabic values (core keys used in S-026):

  properties.pageTitle         'العقارات'
  properties.pageSubtitle      'إدارة أصول العقارات والعقود للعائلة'
  properties.addProperty       'إضافة عقار'
  properties.comingSoon        'قريباً'
  properties.ownerSuffix       'مالك'

  properties.columns.name            'اسم العقار'
  properties.columns.type            'النوع'
  properties.columns.location        'الموقع'
  properties.columns.status          'الحالة'
  properties.columns.estimatedValue  'القيمة التقديرية'
  properties.columns.owners          'الملاّك'
  properties.columns.actions         'الإجراءات'

  properties.types.residential   'سكني'
  properties.types.commercial    'تجاري'
  properties.types.land          'أرض'

  properties.status.rented   'مؤجّر'
  properties.status.vacant   'شاغر'

  properties.actions.edit    'تعديل'
  properties.actions.delete  'حذف'
  properties.actions.owners  'الملاّك'

  properties.empty.title     'لا توجد عقارات مسجّلة'
  properties.empty.subtitle  'ابدأ بإضافة أول عقار للعائلة'

  properties.error.title  'تعذّر تحميل العقارات'
  properties.error.retry  'إعادة المحاولة'

---

4. PropertiesPage — src/pages/PropertiesPage.tsx (full replacement of stub)

The 12-line stub from S-002 was replaced with a complete production-ready
implementation. All logic split into four units: the page component, and three
sub-components for loading / empty / error states.

Helper Functions (outside the component — standalone async pattern)

`fetchProperties()` — standalone async function using Supabase aggregate select
to avoid N+1 on property_owners:

```ts
async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabaseClient
    .from('properties')
    .select(`
      id,
      name,
      type,
      location,
      purchase_date,
      estimated_value,
      status,
      property_owners(count)
    `)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id:              row.id,
    name:            row.name,
    type:            row.type as Property['type'],
    location:        row.location,
    purchase_date:   row.purchase_date,
    estimated_value: row.estimated_value,
    status:          row.status as Property['status'],
    owners_count:    (row.property_owners as { count: number }[])[0]?.count ?? 0,
  }));
}
```

`typeBadgeClass()` — pure helper mapping property type to STR-004 hex classes:

```ts
function typeBadgeClass(type: Property['type']): string {
  const map: Record<Property['type'], string> = {
    residential: 'text-[#1A7D4F] bg-[#EBF5F0]',  // success green — stable residential
    commercial:  'text-[#1E5DC4] bg-[#E8F0FB]',  // primary blue  — commercial/business
    land:        'text-[#B45309] bg-[#FEF7EC]',  // warning amber — undeveloped/pending
  };
  return map[type];
}
```

`statusBadgeClass()` — pure helper mapping property status to STR-004 hex classes:

```ts
function statusBadgeClass(status: Property['status']): string {
  const map: Record<Property['status'], string> = {
    rented: 'text-[#1A7D4F] bg-[#EBF5F0]',  // success green — income-generating
    vacant: 'text-[#B45309] bg-[#FEF7EC]',  // warning amber — no income / pending
  };
  return map[status];
}
```

STR-004 color rationale:
  residential → success green: stable, habitable asset class
  commercial  → primary blue:  productive business premises
  land        → warning amber: undeveloped, pending-use status
  rented      → success green: actively generating rental income
  vacant      → warning amber: income gap / pending tenant

React Query hook:
  useQuery with queryKey: ['properties'] and staleTime: 60_000
  Default value `data: properties = []` prevents undefined access during loading

Page Header:
  Title:    text-xl font-medium text-[#1E293B] — t('properties.pageTitle')
  Subtitle: mt-0.5 text-sm text-[#475569]     — t('properties.pageSubtitle')
  "إضافة عقار" Button: bg-[#1E5DC4] text-white hover:bg-[#164399] with Plus icon
  Button is disabled={true} with title={t('properties.comingSoon')} — wired in S-027

Table (rendered when data exists):
  Wrapped in <div role="region" aria-label={t('properties.pageTitle')}> for accessibility
  Shadcn <Table> component — NOT native <table>
  Header row: bg-[#F1F5F9] hover:bg-[#F1F5F9]
  All <TableHead> cells use text-start (logical) — never text-left
  Actions column uses text-end (logical) — never text-right
  Card container: overflow-hidden rounded-lg border border-[#E2E8F0] bg-white
  Body rows: text-sm text-[#1E293B] hover:bg-[#F1F5F9]

  7 columns:

  Column              Rendering
  ──────────────────────────────────────────────────────────────────────────────
  اسم العقار         text-sm font-medium text-[#1E293B]

  النوع              plain <span> with typeBadgeClass() — NOT Shadcn Badge
                     className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                     label: t('properties.types.{type}')
                     ⚠️ Shadcn <Badge> NOT used — same STR-004 rationale as S-019:
                     Badge variants override hex classes. Canonical: plain <span> + helper.

  الموقع             text-sm text-[#475569] truncate max-w-[180px] block
                     title={property.location} for hover tooltip
                     null/empty → "—" (em dash)

  الحالة             plain <span> with statusBadgeClass() — NOT Shadcn Badge
                     className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                     label: t('properties.status.{status}')

  القيمة التقديرية   font-mono tabular-nums text-sm text-[#1E293B]
                     formatCurrency(estimated_value, 'USD') when not null
                     null → "—" (em dash)

  الملاّك             font-mono tabular-nums text-sm text-[#475569]
                     {count} {t('properties.ownerSuffix')} when count > 0
                     0 owners → "—" (em dash)

  الإجراءات          3 icon buttons — ALL disabled={true}:
                       <Pencil h-4 w-4>  text-[#1E5DC4] opacity-40 cursor-not-allowed
                       <Users  h-4 w-4>  text-[#1A7D4F] opacity-40 cursor-not-allowed
                       <Trash2 h-4 w-4>  text-[#C0392B] opacity-40 cursor-not-allowed
                       All: title={t('properties.comingSoon')}
                     STR-004 button color rationale:
                       Pencil = primary blue   — modification action
                       Users  = success green  — constructive / people action
                       Trash2 = danger red     — destructive action

`PropertiesSkeleton` Sub-component:
  aria-busy="true" on wrapper div
  One header-like row bg-[#F1F5F9] + 5 data rows
  All bars: animate-pulse rounded bg-[#E2E8F0] — built inline, no Shadcn Skeleton import
  7 columns matching the live table with proportional widths

`PropertiesEmpty` Sub-component:
  flex flex-col items-center justify-center gap-3 py-16
  <Building2> icon from lucide-react: h-12 w-12 text-[#94A3B8] (Slate-400)
  Note: Building2 chosen — semantically covers residential, commercial, and land
        in a single icon; avoids the narrower connotation of Home or Landmark.
  Heading:  text-base font-medium text-[#1E293B] — t('properties.empty.title')
  Sub-text: text-sm text-[#475569]               — t('properties.empty.subtitle')
  Props: { onAdd: () => void }
  Disabled "إضافة عقار" Button — identical styling to header button

`PropertiesError` Sub-component:
  Props: { onRetry: () => void }
  Error message: text-sm font-medium text-[#C0392B] — t('properties.error.title')
  Retry Button:  variant="outline" border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]
  onClick calls refetch() from React Query

5. STR-004 Compliance

  All colors expressed as hex literals — no Tailwind color names (gray-*, blue-*, etc.)
  All directional utilities are logical properties: text-start · text-end · ms-* · ps-*
  No gradients anywhere in the file
  No hardcoded Arabic or English strings in JSX — all resolved through t()
  Card container: overflow-hidden rounded-lg border border-[#E2E8F0] bg-white
  Page background handled by AppLayout (bg-[#F8FAFC]) — no bg class on page div
  Type/status badges: plain <span> with helper hex classes — canonical pattern from S-019
  Financial value: font-mono tabular-nums
  Owner count: font-mono tabular-nums

6. Router & Sidebar

  /properties route was already wired to <PropertiesPage /> stub in S-002.
  No router changes required — the stub was replaced in-place.
  Sidebar nav link for "العقارات" was already pointing to /properties and active.
  No AppLayout changes required.

7. Project Structure after S-026

```
src/
├── i18n/
│   └── locales/
│       ├── ar.ts                ← UPDATED (properties.* namespace — 38 keys)
│       └── en.ts                ← UPDATED (same keys in English)
├── pages/
│   └── PropertiesPage.tsx       ← REPLACED (stub → full implementation)
└── types/
    └── index.ts                 ← UPDATED (owners_count field added to Property interface)
```

No new Shadcn components required — Table · Button already installed from Sprint 2.
No new npm packages.
No new Supabase migrations.

8. Commits

```
feat(types): add owners_count to Property interface in src/types/index.ts
feat(i18n): add properties.* namespace to ar and en locales
feat(properties): implement Properties list page — table, skeleton, empty and error states
```

Merged via --no-ff into feature/sprint-03:
```
feat(s-026): implement Properties list page
```

---

Issues Encountered & Resolved (S-026)

#   Issue                                                   Resolution
1   Property interface already existed in                   Only owners_count was appended to the
    types/index.ts as a partial stub — it was               existing interface. No full replacement
    missing only the derived owners_count field.            needed. Audit (Phase 0) caught this before
                                                            any code was written.

2   i18n keys count: spec called for 24 keys;               Extra 14 keys are pre-emptive stubs for
    implementation added 38 to ar.ts / en.ts.               properties.form.*, properties.validation.*,
                                                            and properties.toast.* — needed in S-027
                                                            through S-029 regardless. All within the
                                                            properties.* namespace; no existing keys
                                                            affected.

3   Sprint 3 branch was created from main before            Executed after S-026 was merged:
    Sprint 2 (feature/sprint-02) was merged into            1. Merged feature/sprint-02 → main
    main. This caused PortfoliosPage and all                 2. Merged main → feature/sprint-03
    Sprint 2 components to revert to stubs on               3. Resolved i18n conflict (ar.ts / en.ts)
    the feature/sprint-03 branch.                              manually — kept both portfolios.*
                                                               and properties.* namespaces.
                                                            ⚠️ Canonical rule going forward:
                                                            Before creating feature/sprint-N, verify
                                                            that feature/sprint-(N-1) is merged into
                                                            main. Run: git log --oneline main | head -3

---

Final Verification (S-026)

Check                                                                         Result
npx tsc --noEmit                                                              ✅ Zero errors
Brand scan: grep -n "text-gray\|text-blue\|text-red\|text-green\|            ✅ Empty
  bg-gray\|bg-blue\|text-left\|text-right\|pl-\|pr-\|ml-\|mr-"
  src/pages/PropertiesPage.tsx
Arabic string scan: grep -n '="[أ-ي]'                                        ✅ Empty
  src/pages/PropertiesPage.tsx
owners_count field present in Property interface                              ✅
properties.* namespace present in ar.ts and en.ts                            ✅ 38 keys each
PropertiesPage stub replaced with full implementation                         ✅
fetchProperties() uses property_owners(count) aggregate — no N+1              ✅
typeBadgeClass() covers all 3 types with STR-004 hex colors                   ✅
statusBadgeClass() covers both statuses with STR-004 hex colors               ✅
Type badges use plain <span> — NOT Shadcn Badge                               ✅
Status badges use plain <span> — NOT Shadcn Badge                             ✅
"إضافة عقار" header button: disabled + comingSoon title                      ✅
All 3 action buttons: opacity-40 · cursor-not-allowed · disabled              ✅
Pencil=blue · Users=green · Trash=red (STR-004 button rationale)              ✅
Skeleton sub-component: 7 columns, animate-pulse bars                         ✅
Empty sub-component: Building2 icon + i18n labels + disabled button           ✅
Error sub-component: danger text + outline retry button                       ✅
/properties route reachable from Sidebar nav link — no 404                    ✅
RTL layout intact: text-start headers · text-end actions column               ✅
feature/sprint-03 synced with main (Sprint 2 work visible)                   ✅
feature/s-026-properties-list-page branch deleted (local + remote)           ✅