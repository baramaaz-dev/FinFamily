EPC-04 — Properties & Real Estate
Epic: E4 — العقارات وإدارة الأصول العقارية
Sprint: Sprint 4
Status: 🔄 In Progress
---
Stories Overview
Story	Title	Status
S-033	Properties List Page				✅ Done
S-034	Add Property Form				✅ Done
S-035	Add Property Owners — Shares & Ownership Basis				📋 Planned
S-036	Validate Ownership Total = 1 before Save	📋 Planned
S-037	Property Ownership Statement View			📋 Planned
S-038	Add Lease Contract	📋 Planned
S-039	Lease Payments Log		📋 Planned
S-040	Record Lease Payment				📋 Planned
S-041	Add Property Expense			📋 Planned
S-042	Property Expenses List with Filters				📋 Planned
S-043	Property Upcoming Obligations View				📋 Planned
---

================================================================================

S-033 — Properties List Page
قائمة العقارات
Epic: E5 — العقارات وإدارة الأصول العقارية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
Depends on: S-025 (Portfolio Detail View)
Blocks: S-034 (Add Property Form)

---

Overview

Foundation story for the Properties & Real Estate module (E5). Builds the
PropertiesPage at route /properties: a table listing all registered properties
with type, location, status, estimated value, and owner count. Follows the
structural pattern of S-019 (Portfolio List Page) exactly.

No forms, no detail navigation, no ownership management in this story.
All action buttons (Edit · Owners · Delete) are rendered as disabled with
title={t('properties.comingSoon')} and wired in S-034, S-035, S-036.

---

What Was Built

1. Audit Findings (Phase 0)

  - Branch feature/s-033-properties-list-page already existed and was clean
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
The extra 14 keys were described as pre-emptive stubs for properties.form.*,
properties.validation.*, and properties.toast.* — needed in S-034+.
⚠️ Correction (discovered in S-034 Phase 0): these 14 keys were NOT actually
present when S-034 audit ran. All form/validation/toast keys were added fresh
in S-034. The 38-key count in S-033 reflects only the core page keys listed below.

Sub-namespace               Keys
properties.*                5 root keys
properties.columns.*        7 keys
properties.types.*          3 keys
properties.status.*         2 keys
properties.actions.*        3 keys
properties.empty.*          2 keys
properties.error.*          2 keys
Total (confirmed present)   24 keys

Arabic values (core keys used in S-033):

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
  Button is disabled={true} with title={t('properties.comingSoon')} — wired in S-034

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

7. Project Structure after S-033

```
src/
├── i18n/
│   └── locales/
│       ├── ar.ts                ← UPDATED (properties.* namespace — 24 keys confirmed)
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
feat(s-033): implement Properties list page
```

---

Issues Encountered & Resolved (S-033)

#   Issue                                                   Resolution
1   Property interface already existed in                   Only owners_count was appended to the
    types/index.ts as a partial stub — it was               existing interface. No full replacement
    missing only the derived owners_count field.            needed. Audit (Phase 0) caught this before
                                                            any code was written.

2   i18n keys count: spec called for 24 keys;               ⚠️ Correction applied (S-034 audit):
    documentation stated 38 keys were added,               The 14 "pre-emptive" form/validation/toast
    including 14 pre-emptive stubs for S-034+.              keys were not present when S-034 ran.
                                                            Confirmed key count for S-033 is 24 —
                                                            the 7 core sub-namespaces only.
                                                            All 35 form/validation/toast keys were
                                                            added fresh in S-034.

3   Sprint 3 branch was created from main before            Executed after S-033 was merged:
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

Final Verification (S-033)

Check                                                                         Result
npx tsc --noEmit                                                              ✅ Zero errors
Brand scan: grep -n "text-gray\|text-blue\|text-red\|text-green\|            ✅ Empty
  bg-gray\|bg-blue\|text-left\|text-right\|pl-\|pr-\|ml-\|mr-"
  src/pages/PropertiesPage.tsx
Arabic string scan: grep -n '="[أ-ي]'                                        ✅ Empty
  src/pages/PropertiesPage.tsx
owners_count field present in Property interface                              ✅
properties.* namespace present in ar.ts and en.ts                            ✅ 24 keys each
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
feature/s-033-properties-list-page branch deleted (local + remote)           ✅


================================================================================

S-034 — Add Property Form
نموذج إضافة عقار جديد
Epic: E5 — العقارات وإدارة الأصول العقارية
Sprint: Sprint 3
Status: ✅ Done
Closed: Sprint 3
Depends on: S-033 (Properties List Page)
Blocks: S-035 (Edit Property Form)

---

Overview

Implements the Add Property dialog for the Properties module. Wires the
previously-disabled "إضافة عقار" button in PropertiesPage to open a Shadcn
Dialog containing a React Hook Form validated with Zod v4.

Follows the established pattern of S-020 (AddPortfolioDialog) — same Dialog
shell, same visual card-grid type selector, same onSubmit → Supabase →
invalidateQueries → toast flow.

No ownership assignment in this story. Ownership is scoped to S-036 / S-037.

---

What Was Built

1. Audit Findings (Phase 0)

  - Baseline npx tsc --noEmit: 0 errors
  - No pre-emptive form/validation/toast keys existed under properties.* in
    ar.ts / en.ts — contrary to what S-033 documentation stated. All 35 keys
    added fresh in this story.
  - Required Shadcn components (Dialog · Input · Label · Button) confirmed present
  - src/components/properties/ directory did not exist — created in this story

---

2. i18n — src/i18n/locales/ar.ts and src/i18n/locales/en.ts

35 new keys added inside the existing `properties` namespace.
No existing keys were modified or removed.
Both files reached 288 total key entries after this story — structural parity confirmed.

Sub-namespace                 Keys added
properties.form.*             19 keys
properties.validation.*        8 keys
properties.toast.*             2 keys
Total added in S-034          35 keys (all fresh — none were pre-existing stubs)

Arabic values:

  properties.form.dialogTitle              'إضافة عقار جديد'
  properties.form.dialogDescription        'أدخل بيانات العقار الجديد'
  properties.form.nameLabel                'اسم العقار'
  properties.form.namePlaceholder          'مثال: عمارة الملك فيصل'
  properties.form.typeLabel                'نوع العقار'
  properties.form.typeResidential          'سكني'
  properties.form.typeCommercial           'تجاري'
  properties.form.typeLand                 'أرض'
  properties.form.statusLabel              'الحالة الافتراضية'
  properties.form.statusRented             'مؤجّر'
  properties.form.statusVacant             'شاغر'
  properties.form.locationLabel            'الموقع'
  properties.form.locationPlaceholder      'مثال: دمشق، المزة'
  properties.form.purchaseDateLabel        'تاريخ الشراء'
  properties.form.estimatedValueLabel      'القيمة التقديرية (USD)'
  properties.form.estimatedValuePlaceholder 'مثال: 250000'
  properties.form.submitButton             'إضافة العقار'
  properties.form.cancelButton             'إلغاء'
  properties.form.submitting               'جاري الإضافة...'

  properties.validation.nameRequired         'اسم العقار مطلوب'
  properties.validation.nameTooShort         'الاسم قصير جداً (حرفان على الأقل)'
  properties.validation.nameTooLong          'الاسم طويل جداً (200 حرف كحد أقصى)'
  properties.validation.typeRequired         'يجب اختيار نوع العقار'
  properties.validation.statusRequired       'يجب اختيار الحالة'
  properties.validation.locationTooLong      'الموقع طويل جداً (500 حرف كحد أقصى)'
  properties.validation.estimatedValuePositive 'القيمة يجب أن تكون موجبة'
  properties.validation.estimatedValueInvalid  'القيمة يجب أن تكون رقماً'

  properties.toast.addSuccess              'تم إضافة العقار بنجاح'
  properties.toast.addError                'تعذّر إضافة العقار'

---

3. AddPropertyDialog Component — src/components/properties/AddPropertyDialog.tsx (new file)

New directory created: src/components/properties/

Props: { open: boolean; onOpenChange: (open: boolean) => void }

Zod Schema (defined outside the component — STR-005 compliance):

```ts
const addPropertySchema = z.object({
  name: z.string()
    .min(1, { message: 'properties.validation.nameRequired' })
    .min(2, { message: 'properties.validation.nameTooShort' })
    .max(200, { message: 'properties.validation.nameTooLong' }),

  type: z.enum(['residential', 'commercial', 'land'], {
    error: 'properties.validation.typeRequired',   // Zod v4: error not required_error
  }),

  status: z.enum(['rented', 'vacant'], {
    error: 'properties.validation.statusRequired',
  }),

  location: z.string()
    .max(500, { message: 'properties.validation.locationTooLong' })
    .optional(),

  // Date kept as string — z.preprocess acceptable here (output remains string)
  purchase_date: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),

  // ⚠️ z.preprocess() and z.coerce.number().optional() both break zodResolver
  // in Zod v4. Pattern: keep as string, validate shape with refine(),
  // coerce to number with parseFloat() in onSubmit only. See STR-005 §5.2.1.
  estimated_value: z.string()
    .refine(
      (v) => v === '' || v === undefined || !isNaN(parseFloat(v)),
      { message: 'properties.validation.estimatedValueInvalid' }
    )
    .refine(
      (v) => v === '' || v === undefined || parseFloat(v) > 0,
      { message: 'properties.validation.estimatedValuePositive' }
    )
    .optional(),
});

type AddPropertyFormData = z.infer<typeof addPropertySchema>;
```

Config Arrays (defined outside the component):

```ts
const PROPERTY_TYPES = [
  { value: 'residential' as const, icon: Home,      labelKey: 'properties.form.typeResidential' },
  { value: 'commercial'  as const, icon: Building2, labelKey: 'properties.form.typeCommercial'  },
  { value: 'land'        as const, icon: MapPin,    labelKey: 'properties.form.typeLand'        },
];

const PROPERTY_STATUSES = [
  { value: 'rented' as const, icon: Key,  labelKey: 'properties.form.statusRented' },
  { value: 'vacant' as const, icon: Lock, labelKey: 'properties.form.statusVacant' },
];
```

React Hook Form:
  useForm with zodResolver(addPropertySchema)
  defaultValues: { name: '', type: undefined, status: 'vacant',
                   location: '', purchase_date: '', estimated_value: '' }
  status defaultValue 'vacant' — matches DB DEFAULT 'vacant'; pre-selects the
  most common case (new property is typically vacant on registration)

handleOpenChange wrapper resets form on every close (Escape / X / Cancel):
```ts
const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen) reset();
  onOpenChange(newOpen);
};
```

onSubmit Handler:
```ts
const onSubmit = async (data: AddPropertyFormData) => {
  const { error } = await supabaseClient.from('properties').insert({
    name:            data.name.trim(),
    type:            data.type,
    status:          data.status,
    location:        data.location?.trim() || null,
    purchase_date:   data.purchase_date   || null,
    estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
  });
  if (error) { toast.error(t('properties.toast.addError')); return; }
  await queryClient.invalidateQueries({ queryKey: ['properties'] });
  toast.success(t('properties.toast.addSuccess'));
  handleOpenChange(false);
};
```

Dialog Behaviour:
  Shadcn <Dialog> used
  onInteractOutside={(e) => e.preventDefault()} — overlay click does NOT close
  <DialogDescription className="sr-only"> — visually hidden for accessibility
  Submit button: shows <Loader2 className="animate-spin" /> + submitting label while isSubmitting
  Cancel button: disabled while isSubmitting

Form Layout (field order in JSX):
  1. Type selector   — 3-card grid (grid-cols-3) via <Controller>
  2. Status selector — 2-card grid (grid-cols-2) via <Controller>
  3. Name            — full width, required
  4. Location        — full width, optional
  5. Purchase date + Estimated value — 2 columns (grid-cols-2)
  6. Footer: Cancel + Submit buttons

Card States (STR-004 compliant):
  Selected:   bg-[#E8F0FB] border-[#1E5DC4] text-[#1E5DC4]
  Unselected: bg-white border-[#E2E8F0] text-[#475569]
  Hover:      hover:bg-[#F1F5F9] hover:border-[#B8CFF5]  (unselected only)

STR-004 Button Colors:
  Submit: bg-[#1E5DC4] hover:bg-[#164399] text-white
  Cancel: border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]
  Required asterisks + error text: text-[#C0392B]
  Input focus rings: focus-visible:ring-[#1E5DC4]

---

4. PropertiesPage.tsx — src/pages/PropertiesPage.tsx (updated)

Three targeted changes — file not rewritten:

  1. Import added:
       import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';

  2. State added:
       const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  3. Header "إضافة عقار" button:
       disabled and title="قريباً" attributes removed
       onClick={() => setDialogOpen(true)} added

  4. PropertiesEmpty onAdd prop:
       wired to () => setDialogOpen(true)

  5. Dialog rendered at bottom of return:
       <AddPropertyDialog open={dialogOpen} onOpenChange={setDialogOpen} />

---

5. STR-004 Compliance

  All colors expressed as hex literals — no Tailwind color names
  All directional utilities are logical: ms-* · me-* · ps-* · pe-*
  No gradients anywhere in the file
  No hardcoded Arabic or English strings in JSX — all resolved through t()
  estimated_value input: font-mono class applied (financial value rule)
  No Shadcn Badge used — type/status display remains plain <span> pattern from S-033

---

6. Project Structure after S-034

```
src/
├── components/
│   └── properties/
│       └── AddPropertyDialog.tsx     ← NEW
├── i18n/
│   └── locales/
│       ├── ar.ts                     ← UPDATED (35 keys added — all fresh)
│       └── en.ts                     ← UPDATED (same 35 keys in English)
└── pages/
    └── PropertiesPage.tsx            ← UPDATED (dialog state · buttons enabled · dialog rendered)
```

No new Shadcn components required — Dialog, Input, Label, Button already installed.
No new npm packages.
No new Supabase migrations.

---

7. Commits

```
feat(i18n): add properties.form, properties.validation, properties.toast keys
feat(properties): implement AddPropertyDialog — type/status card selectors, RHF+Zod v4, Supabase insert
feat(properties): wire AddPropertyDialog into PropertiesPage — enable add buttons
```

Merged via --no-ff into feature/sprint-03:
```
feat(s-034): implement Add Property Form
```

---

Issues Encountered & Resolved (S-034)

#   Issue                                                   Resolution
1   EPC-05 documented 14 pre-emptive i18n keys              All 35 form/validation/toast keys added
    added in S-033 for form/validation/toast.               fresh in S-034. S-033 documentation
    Phase 0 audit found none of these keys                  corrected (see Issue #2 in S-033 section).
    existed.                                                ⚠️ Canonical rule: never trust pre-emptive
                                                            key claims in documentation — always run
                                                            grep audit in Phase 0 before writing code.

2   z.preprocess() breaks zodResolver in                    Pattern replaced with z.string().refine()
    Zod v4 for optional numeric fields.                     for schema validation, and parseFloat()
    Symptom: resolver returned unexpected                   in onSubmit for type coercion.
    errors or silently ignored input.                       Documented in STR-005 §5.2.1 as the
    z.coerce.number().optional() has the                    canonical pattern for all optional
    same issue.                                             numeric fields going forward.

---

Final Verification (S-034)

Check                                                                         Result
npx tsc --noEmit                                                              ✅ Zero errors
Brand scan (text-gray|text-blue|...|pl-|ml-)                                  ✅ Empty
  src/components/properties/AddPropertyDialog.tsx
Arabic string scan ('="[أ-ي]')                                                ✅ Empty
  src/components/properties/AddPropertyDialog.tsx
Dialog opens from PropertiesPage header button                                ✅
Dialog opens from PropertiesPage empty-state button                           ✅
All 3 type cards render with correct icons and labels                         ✅ Home · Building2 · MapPin
Both status cards render with correct icons and labels                        ✅ Key · Lock
Default status = "شاغر" (vacant) pre-selected on open                        ✅
Selecting a card highlights it (primary-50 / primary-400)                     ✅
Selecting different card deselects previous                                   ✅
Overlay click does NOT close dialog                                           ✅
Escape / X closes and fully resets form                                       ✅
name: required error on empty submit                                          ✅
name: min-2 error on single-character submit                                  ✅
type: required error when no card selected                                    ✅
status: required error when no card selected                                  ✅
estimated_value: error on negative number                                     ✅
estimated_value empty → no error → saves as NULL                              ✅
purchase_date empty → no error → saves as NULL                                ✅
Successful INSERT refreshes properties list                                   ✅ ['properties'] invalidated
Success toast shown (green)                                                   ✅
Error toast on Supabase failure, dialog stays open                            ✅
feature/s-034-add-property-form branch deleted (local + remote)              ✅


================================================================================

E5 — Deferred Items (Post-MVP Backlog)

The following items were identified during Sprint 3 and deliberately deferred
to after the first successful MVP deployment. They do not block any story in
the current sprint plan (S-033 → S-035).

---

Deferred Item 1 — Additional Property Types

Current DB CHECK constraint: IN ('residential', 'commercial', 'land')
Candidate types for post-MVP expansion: 'agricultural_land', 'farm', 'warehouse'
(additional types, e.g. 'apartment', 'villa', may also be considered based on
actual usage patterns observed after MVP deployment)

Implementation scope when scheduled:
  - Supabase migration: DROP + ADD CHECK constraint on properties.type
  - src/types/index.ts: extend Property['type'] union literal
  - src/i18n/locales/ar.ts + en.ts: add properties.types.* keys for new values
  - src/pages/PropertiesPage.tsx: extend typeBadgeClass() map
  - src/components/properties/AddPropertyDialog.tsx: extend PROPERTY_TYPES array
    and z.enum() in addPropertySchema
  - src/components/properties/EditPropertyDialog.tsx: same as above

Decision rationale: The three current types (residential · commercial · land)
are the standard high-level taxonomy used in real estate management systems and
are intentionally broad. Expanding before MVP would add migration and frontend
scope without validated need. The migration cost is identical whether done now
or after MVP.

---

Deferred Item 2 — Property Document Attachments

Desired functionality: ability to upload and associate documents with a property,
specifically: صك الملكية (property deed) and عقد الإيجار (lease contract).
Additional document types (floor plans, photos, permits) may also be relevant.

Implementation scope when scheduled (requires its own story or sub-epic):
  - Supabase Storage: new bucket (e.g. property-documents) with RLS policy
  - New DB table: property_documents
      (id, property_id, type ['deed'|'lease'|'other'], file_path, file_name,
       uploaded_at, notes)
  - Frontend: file upload component (file picker or drag-and-drop)
  - Integration: display attached documents in S-035 Property Detail View

Decision rationale: Document storage requires Supabase Storage (separate from
PostgreSQL), a new DB table, RLS on the storage bucket, and a file upload UI —
a meaningful scope that deserves a dedicated story. Deferring keeps Sprint 3
focused on the core data model. No current story depends on this feature.