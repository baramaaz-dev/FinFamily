EPC-04 — Properties & Real Estate
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
---
Stories Overview
Story	Title	Status
S-033	Properties List Page				✅ Done
S-034	Add Property Form				✅ Done
S-035	Add Property Owners — Shares & Ownership Basis	✅ Done
S-036	Validate Ownership Total = 1 before Save	✅ Done
S-037	Property Ownership Statement View		✅ Done
S-038	Add Lease Contract				✅ Done
S-039	Lease Payments Log				✅ Done
S-040	Record Lease Payment				✅ Done
S-041	Add Property Expense				✅ Done
S-042	Property Expenses List with Filters		✅ Done
S-043	Property Upcoming Obligations View		✅ Done
---

================================================================================

S-033 — Properties List Page
قائمة العقارات
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-025 (Portfolio Detail View)
Blocks: S-034 (Add Property Form)

---

Overview

Foundation story for the Properties & Real Estate module (E4). Builds the
PropertiesPage at route /properties: a table listing all registered properties
with type, location, status, estimated value, and owner count. Follows the
structural pattern of S-019 (Portfolio List Page) exactly.

No forms, no detail navigation, no ownership management in this story.
All action buttons (Edit · Owners · Delete) are rendered as disabled with
title={t('properties.comingSoon')} and wired in S-034, S-035, S-037.

---

What Was Built

1. Audit Findings (Phase 0)

  - PropertiesPage.tsx stub existed (12-line placeholder from S-002)
  - /properties route already wired at src/router/index.tsx
  - Property interface already existed at types/index.ts — was missing only
    the derived `owners_count` field
  - Locale files (ar.ts / en.ts) had no properties namespace
  - Baseline npx tsc --noEmit: 0 errors

---

2. TypeScript Types — src/types/index.ts

`owners_count: number` appended to the existing `Property` interface.

Final Property interface:

```ts
export interface Property {
  id:              string;
  name:            string;
  type:            'residential' | 'commercial' | 'land';
  location:        string | null;
  purchase_date:   string | null;
  estimated_value: number | null;
  status:          'rented' | 'vacant';
  owners_count:    number;           // derived — NOT a DB column
}
```

---

3. i18n — 24 keys added under properties.* namespace

Sub-namespace               Keys
properties.*                5 root keys
properties.columns.*        7 keys
properties.types.*          3 keys
properties.status.*         2 keys
properties.actions.*        3 keys
properties.empty.*          2 keys
properties.error.*          2 keys
Total (confirmed)           24 keys

---

4. PropertiesPage — src/pages/PropertiesPage.tsx

Helper functions (outside component):
  fetchProperties() — Supabase aggregate select with property_owners(count)
  typeBadgeClass()  — STR-004 hex mapping: residential=green, commercial=blue, land=amber
  statusBadgeClass() — rented=green, vacant=amber

React Query: queryKey ['properties'], staleTime 60_000

Table: 7 columns — name · type · location · status · estimatedValue · owners · actions
Sub-components: PropertiesSkeleton · PropertiesEmpty · PropertiesError

STR-004: All hex literals, logical direction utilities, plain <span> badges.

---

5. Commits

```
feat(types): add owners_count to Property interface
feat(i18n): add properties.* namespace to ar and en locales
feat(properties): implement Properties list page
feat(s-033): implement Properties list page
```

---

Issues Encountered & Resolved (S-033)

#   Issue                                Resolution
1   Property interface was a partial stub  Only owners_count appended — no rewrite
2   Branch created before Sprint 3 merge  Merged sprint-02 → main → sprint-04; resolved
    into main — Sprint 2 work reverted    i18n conflict manually

⚠️ Canonical rule: Before creating feature/sprint-N, verify feature/sprint-(N-1)
   is merged into main. Run: git log --oneline main | head -3

---

Final Verification (S-033): All checks ✅

================================================================================

S-034 — Add Property Form
نموذج إضافة عقار جديد
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-033 (Properties List Page)
Blocks: S-035 (Add Property Owners)

---

Overview

Implements the Add Property dialog. Wires the disabled "إضافة عقار" button in
PropertiesPage to open a Shadcn Dialog with React Hook Form validated by Zod v4.

---

What Was Built

1. Audit Findings (Phase 0)

  - No pre-emptive form/validation/toast keys existed — all 35 added fresh
  - src/components/properties/ directory did not exist — created in this story
  - Baseline: 0 TypeScript errors

---

2. i18n — 35 keys added

Sub-namespace        Keys
properties.form.*    19 keys
properties.validation.* 8 keys
properties.toast.*   2 keys
Total                35 keys

---

3. AddPropertyDialog — src/components/properties/AddPropertyDialog.tsx

Zod schema (outside component):
```ts
const addPropertySchema = z.object({
  name:            z.string().min(1).min(2).max(200),
  type:            z.enum(['residential','commercial','land'], { error: '...' }),
  status:          z.enum(['rented','vacant'], { error: '...' }),
  location:        z.string().max(500).optional(),
  purchase_date:   z.preprocess(v => v==='' ? undefined : v, z.string().optional()),
  estimated_value: z.string().refine(...).refine(...).optional(),
  // ⚠️ z.preprocess() breaks zodResolver for optional numerics in Zod v4
  // Pattern: z.string().refine() + parseFloat() in onSubmit (STR-005 §5.2.1)
});
```

Config arrays: PROPERTY_TYPES (Home/Building2/MapPin), PROPERTY_STATUSES (Key/Lock)
Default status: 'vacant' (DB default)
onSubmit: estimated_value → parseFloat(); all optional fields → null if empty
Dialog: onInteractOutside prevented · reset() on every close path

Form layout: type cards (3-col) → status cards (2-col) → name → location →
             purchase_date + estimated_value (2-col) → footer

---

4. PropertiesPage.tsx — targeted additions

dialogOpen state · header button enabled · empty-state button wired · dialog rendered

---

5. Commits

```
feat(i18n): add properties.form/validation/toast keys
feat(properties): implement AddPropertyDialog
feat(properties): wire AddPropertyDialog to PropertiesPage
feat(s-034): implement Add Property Form
```

---

Issues Encountered & Resolved (S-034)

#   Issue                                Resolution
1   S-033 claimed 14 pre-emptive keys    All 35 form keys added fresh in S-034
    existed — Phase 0 found none          ⚠️ Rule: always grep-audit before writing code
2   z.preprocess() breaks zodResolver    z.string().refine() + parseFloat() in onSubmit
    for optional numerics in Zod v4       Documented in STR-005 §5.2.1

---

Final Verification (S-034): All checks ✅

================================================================================

S-035 — Add Property Owners — Shares & Ownership Basis
إضافة ملاّك العقار مع الحصص وعلة التملك
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-034 (Add Property Form)
Blocks: S-036 (Validate Ownership Total = 1)

---

Overview

Implements PropertyOwnersDialog. Wires the disabled "الملاّك" (Users) button in
PropertiesPage. Inserts into property_owners: (property_id, person_id,
share_numerator, share_denominator, ownership_basis).

ownership_basis stored as Arabic strings in DB: 'إرث' | 'شراء' | 'هبة' | 'وصية' | 'شراكة'

No share total validation — that is S-036.

Pre-existing bug fixed in Phase 0: DB trigger trg_property_share_sum on
property_owners was blocking partial inserts. Trigger dropped:
  DROP TRIGGER IF EXISTS trg_property_share_sum ON property_owners;
  DROP FUNCTION IF EXISTS check_share_sum_property();

---

What Was Built

1. i18n — 43 keys added under properties.owners.*

Sub-namespace              Keys
owners.*                   25 dialog/form keys
owners.toast.*             4 keys
owners.validation.*        9 keys
Total                      43 keys (with toast and validation as sub-objects)

---

2. PropertyOwnersDialog — src/components/properties/PropertyOwnersDialog.tsx (423 lines)

Props: { open, onOpenChange, propertyId, propertyName }

Zod schema (outside component):
```ts
const addPropertyOwnerSchema = z.object({
  person_id:         z.string().min(1, ...),
  share_numerator:   z.coerce.number({ error: '...' }).int().positive(),
  share_denominator: z.coerce.number({ error: '...' }).int().min(1),
  ownership_basis:   z.enum(['إرث','شراء','هبة','وصية','شراكة'], { error: '...' }),
});
```

Config arrays:
  OWNERSHIP_BASIS: BookOpen/CreditCard/Gift/FileText/Users2 icons
React Query:
  ['property_owners', propertyId] — owners with people join
  ['people'] — for person Select (staleTime 5 min)
  availablePeople: filtered to exclude existing owners

Features:
  - Owners list with remove (Trash2) + Loader2 during delete
  - Add-owner form: person Select → share fraction (2 cols) → basis cards (5-col grid)
  - Conditions: noPeople → allAdded → sharesComplete → isExceeding → form
  - invalidates ['property_owners', propertyId] AND ['properties'] on add/remove

Dialog behaviour: onInteractOutside prevented · resetForm() on successful add only
  (NOT on dialog close — owners list persists)

---

3. PropertiesPage.tsx — targeted additions

ownersTarget state ({id, name} | null) · Users button enabled · dialog rendered

---

4. Commits

```
feat(i18n): add properties.owners.* keys for S-035
feat(properties): implement PropertyOwnersDialog
feat(properties): wire PropertyOwnersDialog to PropertiesPage — enable owners button
feat(s-035): add property owners with shares and ownership basis
```

---

Issues Encountered & Resolved (S-035)

#   Issue                                   Resolution
1   DB trigger trg_property_share_sum        Dropped trigger and function via SQL Editor
    blocked partial inserts                  before implementing the form
2   z.coerce.number({ required_error, ... }) Use z.coerce.number({ error: '...' }) only
    is NOT valid in Zod v4                   (v4 API). Documented in STR-005.
3   Resolver type mismatch with              zodResolver(schema) as unknown as
    z.coerce.number()                        Resolver<FormData> cast pattern
4   defaultValues for coerce.number          Use integers (e.g. 1/1) not
    should not be '' as unknown as number    '' as unknown as number

---

Final Verification (S-035): All checks ✅

================================================================================

S-036 — Validate Ownership Total = 1 before Save
التحقق من مجموع حصص الملاك = 1 قبل الحفظ
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-035 (Add Property Owners)
Blocks: S-037 (Property Ownership Statement View)

---

Overview

Adds share-total indicator and submit guard to PropertyOwnersDialog.
4 targeted edits to existing component (+43 lines). 5 new i18n keys.
No new files.

---

What Was Built

1. i18n — 5 keys added inside properties.owners

  owners.totalLabel · owners.totalComplete · owners.totalExceeds
  owners.sharesComplete · owners.validation.sharesExceed

---

2. PropertyOwnersDialog.tsx — 4 targeted edits

Edit 1 — Total calculation (derived, not stored):
```ts
const totalShare   = owners.reduce((sum, o) => sum + o.share_numerator / o.share_denominator, 0);
const totalPercent = (totalShare * 100).toFixed(2);
const isComplete   = Math.abs(totalShare - 1) < 0.000001;
const isExceeding  = totalShare > 1 + 0.000001;
```

Edit 2 — SharesTotalIndicator between owners list and <hr>:
  < 100% → neutral grey bg-[#F1F5F9] text-[#475569]
  = 100% → success green bg-[#EBF5F0] text-[#1A7D4F]
  > 100% → danger red bg-[#FEF0EF] text-[#C0392B]
  Visible only when owners.length > 0

Edit 3 — Condition chain: isComplete → sharesComplete message (form hidden)
                          isExceeding → totalExceeds warning (form hidden)

Edit 4 — Submit guard in onSubmit:
```ts
const newShare = data.share_numerator / data.share_denominator;
if (totalShare + newShare > 1 + 0.000001) {
  toast.error(t('properties.owners.validation.sharesExceed'));
  return;
}
```

---

3. Commits

```
feat(i18n): add properties.owners total/validation keys for S-036
feat(properties): add share-total indicator and validation to PropertyOwnersDialog
feat(s-036): validate ownership total = 1 in PropertyOwnersDialog
```

---

Final Verification (S-036): All checks ✅

================================================================================

S-037 — Property Ownership Statement View
عرض بيان ملكية العقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-036 (Validate Ownership Total = 1)
Blocks: S-038 (Add Lease Contract)

---

Overview

Builds read-only page at /properties/:id showing property details and formal
ownership statement table. Makes property name in PropertiesPage a Link to
this page.

---

What Was Built

1. Audit Findings (Phase 0)

  - /properties/:id route already existed, pointing to a 9-line
    PropertyDetailPage placeholder stub — import replaced, not duplicated.

---

2. i18n — 17 keys under properties.statement.*

---

3. PropertyOwnershipPage — src/pages/PropertyOwnershipPage.tsx (new file, 298 lines)

React Query:
  ['property', id] — property details
  ['property_owners', id] — owners with people join (warm cache from S-035)

TypeScript: OwnerRow interface
Helpers (outside component): typeBadgeClass() · statusBadgeClass() — duplicated
  from PropertiesPage; no shared utility yet.

Page sections:
  1. Back button (ArrowRight — correct RTL "back" direction)
  2. Page title + property name subtitle
  3. Loading skeleton (2 animate-pulse blocks)
  4. Error state + retry button
  5. Not-found message
  6. Property info card (2×3 grid: name/type/status/location/purchase_date/value)
  7. Ownership statement table (5 cols: owner/relation/share/percent/basis)
  8. Total indicator (3-state: grey/green/red — same logic as S-036)

Total calculation reuses same 0.000001 tolerance from S-036.

---

4. Router — src/router/index.tsx

PropertyDetailPage import replaced with PropertyOwnershipPage.
Route /properties/:id unchanged.

---

5. PropertiesPage.tsx — targeted change

Property name cell: plain text → <Link to={`/properties/${property.id}`}>
  className: text-[#1E5DC4] hover:text-[#164399] hover:underline

---

6. Commits

```
feat(i18n): add properties.statement.* keys for S-037
feat(properties): implement PropertyOwnershipPage — statement view with ownership table
feat(router): add /properties/:id route for ownership statement
feat(properties): make property name a link to ownership statement page
feat(s-037): implement Property Ownership Statement view
```

---

Final Verification (S-037): All checks ✅

================================================================================

S-038 — Add Lease Contract
نموذج تسجيل عقد إيجار جديد
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-037 (Property Ownership Statement View)
Blocks: S-039 (Lease Payments Log)

---

Overview

Creates AddLeaseDialog. Adds "إضافة عقد إيجار" button to PropertyOwnershipPage.
Inserts into leases: (property_id, tenant_name, rent_amount, currency, frequency,
start_date, end_date).

---

What Was Built

1. i18n — 27 keys under properties.leases.*

Sub-namespace            Keys
leases.form.*            18 keys
leases.validation.*       7 keys
leases.toast.*            2 keys
Total                    27 keys

---

2. AddLeaseDialog — src/components/properties/AddLeaseDialog.tsx

Zod schema:
```ts
const addLeaseSchema = z.object({
  tenant_name: z.string().min(1).max(200),
  currency:    z.enum(['USD','SYP'], { error: '...' }),
  rent_amount: z.coerce.number({ error: '...' }).positive(),
  frequency:   z.enum(['monthly','annual'], { error: '...' }),
  start_date:  z.string().min(1, ...),
  end_date:    z.preprocess(v => v==='' ? undefined : v, z.string().optional()),
});
```

Resolver: zodResolver(addLeaseSchema) as unknown as Resolver<AddLeaseFormData>
Config: CURRENCIES ($/£ symbol cards) · FREQUENCIES (CalendarDays/CalendarRange icons)
React Query key established: ['leases', propertyId]
onSubmit: end_date || null

---

3. PropertyOwnershipPage.tsx — targeted additions

leaseDialogOpen state · "إضافة عقد إيجار" button (primary blue) · dialog rendered

---

4. Commits

```
feat(i18n): add properties.leases.form/validation/toast keys for S-038
feat(properties): implement AddLeaseDialog
feat(properties): add lease contract button and dialog to PropertyOwnershipPage
feat(s-038): implement Add Lease Contract form
```

---

Final Verification (S-038): All checks ✅

================================================================================

S-039 — Lease Payments Log
سجل دفعات الإيجار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-038 (Add Lease Contract)
Blocks: S-040 (Record Lease Payment)

---

Overview

Adds two read-only sections to PropertyOwnershipPage (no new files):
  A. "عقود الإيجار" — leases list with status badges and disabled PlusCircle button
  B. "سجل الدفعات" — flat payments log across all leases for the property

React Query keys:
  ['leases', id]        — established in S-038, already warm
  ['lease_payments', id] — new in S-039 (two-step fetch)

---

What Was Built

1. i18n — 20 keys added inside properties.leases

Sub-namespace           Keys
leases.list.*           12 keys
leases.payments.*        8 keys
Total                   20 keys

---

2. PropertyOwnershipPage.tsx — 5 targeted additions

New interfaces: LeaseRow · LeasePaymentRow

leaseStatusInfo() helper:
```ts
function leaseStatusInfo(lease: LeaseRow) {
  const today = new Date().toISOString().split('T')[0];
  if (lease.start_date > today)   return { key: 'properties.leases.list.statusFuture',  class: 'text-[#1E5DC4] bg-[#E8F0FB]' };
  if (lease.end_date && lease.end_date < today) return { key: 'properties.leases.list.statusExpired', class: 'text-[#B45309] bg-[#FEF7EC]' };
  return { key: 'properties.leases.list.statusActive', class: 'text-[#1A7D4F] bg-[#EBF5F0]' };
}
// ⚠️ Note: keys must include 'properties.' prefix — bug discovered in S-040, fixed there
```

Two React Query calls:
  ['leases', id] — already defined in AddLeaseDialog; reuses warm cache
  ['lease_payments', id] — two-step fetch: get leaseIds first, then .in()

leaseMap: Map<lease_id, LeaseRow> — tenant name resolution for payments table.
  No extra Supabase query — resolved in-memory.

Section A (leases): tenant · rent · frequency badge · date range · status badge · disabled PlusCircle
Section B (payments): paid_date · tenant (leaseMap) · amount · currency · exchange_rate (SYP only) · notes

---

3. Commits

```
feat(i18n): add properties.leases.list and leases.payments keys for S-039
feat(properties): add leases and payments log sections to PropertyOwnershipPage
feat(s-039): implement Lease Payments Log on PropertyOwnershipPage
```

---

Issues Encountered & Resolved (S-039)

#   Issue                                   Resolution
1   leaseStatusInfo() returned keys          Bug discovered in S-040 when status badges
    missing 'properties.' prefix             displayed raw key strings in UI.
    e.g. 'leases.list.statusActive'          Fixed in S-040 Phase 0 (bug fix first).
    instead of 'properties.leases.list.statusActive'

---

Final Verification (S-039): All checks ✅

================================================================================

S-040 — Record Lease Payment
تسجيل دفعة إيجار جديدة
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-039 (Lease Payments Log)
Blocks: S-041 (Add Property Expense)

---

Overview

Creates RecordLeasePaymentDialog. Enables the disabled PlusCircle button per
lease row. Also fixes pre-existing S-039 bug in leaseStatusInfo().

Inserts into lease_payments:
  (lease_id, amount, currency, exchange_rate, paid_date, portfolio_id, notes)

Dialog pre-fills amount and currency from lease context. Exchange rate shown
only when currency = SYP. Portfolio selection optional.

---

What Was Built

1. Bug Fix (Phase 0 — before any new code)

leaseStatusInfo() in PropertyOwnershipPage.tsx: added 'properties.' prefix to
all three key strings and updated TypeScript return type.

```ts
// BEFORE (broken — raw keys displayed in UI)
{ key: 'leases.list.statusActive', ... }

// AFTER (correct)
{ key: 'properties.leases.list.statusActive', ... }
```

---

2. i18n — 25 keys under properties.leases.payment.*

Sub-namespace              Keys
leases.payment.form.*      16 keys
leases.payment.validation.* 7 keys
leases.payment.toast.*      2 keys
Total                      25 keys

---

3. RecordLeasePaymentDialog — src/components/properties/RecordLeasePaymentDialog.tsx

Props: { open, onOpenChange, lease: LeaseRow, propertyId }

Zod schema:
```ts
const recordLeasePaymentSchema = z.object({
  amount:        z.coerce.number({ error: '...' }).positive(),
  currency:      z.enum(['USD','SYP'], { error: '...' }),
  exchange_rate: z.string().refine(...).refine(...).optional(), // STR-005 §5.2.1
  paid_date:     z.string().min(1, ...),
  portfolio_id:  z.preprocess(v => v==='' ? undefined : v, z.string().uuid().optional()),
  notes:         z.string().max(500).optional(),
});
```

Resolver: zodResolver(schema) as unknown as Resolver<RecordLeasePaymentFormData>

useEffect([open, lease.id]):
  Resets form with lease.rent_amount, lease.currency, today's date on every open.
  Handles case where dialog is reused for different leases.

watchedCurrency: exchange_rate field shown only when 'SYP'.
Currency card change: also clears exchange_rate via setValue('exchange_rate', '').

Portfolios query: ['portfolios'], staleTime 5 min, enabled only when open.
onSubmit: exchange_rate → parseFloat(); portfolio_id || null; notes?.trim() || null
Invalidates: ['lease_payments', propertyId] AND ['properties']

---

4. PropertyOwnershipPage.tsx — targeted additions

Bug fix applied (leaseStatusInfo keys).
paymentTarget state (LeaseRow | null) · PlusCircle button enabled per lease row ·
dialog rendered conditionally on paymentTarget.

---

5. Commits

```
fix(properties): correct leaseStatusInfo key paths — add properties. prefix
feat(i18n): add properties.leases.payment keys for S-040
feat(properties): implement RecordLeasePaymentDialog
feat(properties): enable PlusCircle button and wire RecordLeasePaymentDialog
feat(s-040): implement Record Lease Payment
```

---

Issues Encountered & Resolved (S-040)

#   Issue                                   Resolution
1   leaseStatusInfo() status badges          Fixed in Phase 0 before new code.
    displayed raw key strings (S-039 bug)    All three keys updated with 'properties.' prefix.
2   SelectItem with value="" crashes at       Discovered post-S-043 (not during S-040).
    runtime (Radix UI constraint)            Fixed with separate hotfix commit — see
                                             "Post-Sprint Hotfix" section below.

---

Final Verification (S-040): All checks ✅

================================================================================

S-041 — Add Property Expense
نموذج تسجيل مصروف عقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-040 (Record Lease Payment)
Blocks: S-042 (Property Expenses List with Filters)

---

Overview

Creates AddPropertyExpenseDialog. Adds "إضافة مصروف" (danger outline) button
to PropertyOwnershipPage header alongside the existing lease button.

Inserts into property_expenses:
  (property_id, type, amount, currency, exchange_rate, due_date, paid_date,
   is_recurring, frequency, portfolio_id, notes)

Key design decision: is_recurring is NOT a form field — derived in onSubmit:
  frequency = 'once'            → is_recurring = false
  frequency = 'monthly'|'annual' → is_recurring = true

React Query key established: ['property_expenses', propertyId]

---

What Was Built

1. i18n — 37 keys under properties.expenses.*

Sub-namespace               Keys
expenses.form.*             26 keys
expenses.validation.*        9 keys
expenses.toast.*             2 keys
Total                       37 keys

---

2. AddPropertyExpenseDialog — src/components/properties/AddPropertyExpenseDialog.tsx

Zod schema:
```ts
const addPropertyExpenseSchema = z.object({
  type:          z.enum(['tax','maintenance','utilities','fees'], { error: '...' }),
  currency:      z.enum(['USD','SYP'], { error: '...' }),
  amount:        z.coerce.number({ error: '...' }).positive(),
  exchange_rate: z.string().refine(...).refine(...).optional(),
  due_date:      z.string().min(1, ...),
  paid_date:     z.preprocess(v => v==='' ? undefined : v, z.string().optional()),
  frequency:     z.enum(['monthly','annual','once'], { error: '...' }),
  portfolio_id:  z.preprocess(v => v==='' ? undefined : v, z.string().uuid().optional()),
  notes:         z.string().max(500).optional(),
});
```

Config arrays:
  EXPENSE_TYPES: Landmark/Wrench/Zap/Receipt icons (4-card grid)
  CURRENCIES: reuses properties.leases.form.currency* keys
  FREQUENCIES: CalendarDays/CalendarRange/Calendar icons (3-card grid)

onSubmit: is_recurring = data.frequency !== 'once' (derived)
Currency switch clears exchange_rate via setValue.

---

3. PropertyOwnershipPage.tsx — targeted additions

expenseDialogOpen state · "إضافة مصروف" button (border-[#C0392B] text-[#C0392B])
added before lease button in flex container · dialog rendered.

---

4. Commits

```
feat(i18n): add properties.expenses keys for S-041
feat(properties): implement AddPropertyExpenseDialog
feat(properties): add expense button and dialog to PropertyOwnershipPage
feat(s-041): implement Add Property Expense form
```

---

Final Verification (S-041): All checks ✅

================================================================================

S-042 — Property Expenses List with Filters
سجل مصروفات العقار مع الفلترة
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-041 (Add Property Expense)
Blocks: S-043 (Property Upcoming Obligations View)

---

Overview

Adds "سجل المصروفات" section with client-side filters to PropertyOwnershipPage.
Uses ['property_expenses', id] React Query key from S-041.

Two filter axes (client-side — no new DB queries per filter):
  Type:   الكل · ضريبة · صيانة · مرافق · رسوم
  Status: الكل · مدفوع · معلّق · متأخر

Status derived from data:
  paid_date IS NOT NULL             → مدفوع  (success green)
  paid_date IS NULL, due >= today   → معلّق  (warning amber)
  paid_date IS NULL, due < today    → متأخر  (danger red)

No new files.

---

What Was Built

1. i18n — 13 keys under properties.expenses.list.*

---

2. PropertyOwnershipPage.tsx — 5 targeted additions

PropertyExpenseRow interface

Helper functions (outside component):
```ts
function expenseStatus(e): 'paid' | 'pending' | 'overdue'
function expenseStatusClass(status): string  // STR-004 semantic colors
```

Config maps (outside component):
  EXPENSE_TYPE_KEYS  — reuses expenses.form.type* keys
  EXPENSE_FREQ_KEYS  — reuses expenses.form.frequency* keys
  STATUS_FILTER_ACTIVE — semantic active colors per filter state

React Query ['property_expenses', id] + typeFilter/statusFilter state +
filteredExpenses derived value.

Filter bar: type pills (5) + vertical divider + status pills (4)
  Active type pill: bg-[#1E5DC4] text-white
  Active status pill: semantic STR-004 color per status

Two empty states: noExpenses (no data) · noResults (data exists but filtered out)

---

3. Commits

```
feat(i18n): add properties.expenses.list keys for S-042
feat(properties): add expenses list with type and status filters to PropertyOwnershipPage
feat(s-042): implement Property Expenses List with Filters
```

---

Final Verification (S-042): All checks ✅

================================================================================

S-043 — Property Upcoming Obligations View
عرض الالتزامات القادمة للعقار
Epic: E4 — العقارات والإيجارات
Sprint: Sprint 4 — Final Story of E4
Status: ✅ Done
Closed: Sprint 4
Depends on: S-042 (Property Expenses List with Filters)
Blocks: Sprint 4 Merge → main

---

Overview

Adds "الالتزامات القادمة" summary section as the final section of
PropertyOwnershipPage. Two sub-sections:
  A. عقود الإيجار السارية — active leases (ongoing obligations)
  B. مصروفات غير مدفوعة — unpaid expenses sorted by due_date ASC

All data derived from existing ['leases', id] and ['property_expenses', id]
caches — zero new Supabase queries.

No new files. Smallest story in E4: 8 i18n keys + 2 additions to the page.

---

What Was Built

1. i18n — 8 keys under properties.obligations.*

  sectionTitle · noObligations · activeLeasesTitle · noActiveLeases
  unpaidExpensesTitle · noUnpaidExpenses · columnUntil · overdueCount

All other labels reuse existing keys from leases.list.*, expenses.list.*,
leases.form.*, EXPENSE_TYPE_KEYS map.

---

2. PropertyOwnershipPage.tsx — 2 targeted additions

Derived values (after filteredExpenses):
```ts
const today          = new Date().toISOString().split('T')[0];
const activeLeases   = leases.filter(l => l.start_date <= today && (!l.end_date || l.end_date >= today));
const unpaidExpenses = expenses.filter(e => !e.paid_date).sort((a,b) => a.due_date.localeCompare(b.due_date));
const overdueExpenses = unpaidExpenses.filter(e => e.due_date < today);
```

Section:
  Header: section title + "N متأخر" badge (danger red, conditional)
  If both empty: single noObligations message
  Sub-section A: active leases table (tenant · rent · frequency · end_date/مفتوح)
  Sub-section B: unpaid expenses table (type · amount · due_date · status badge)
    → sorted ascending by due_date (overdue appear first naturally)

---

3. Commits + Sprint 4 Wrap-up

```
feat(i18n): add properties.obligations keys for S-043
feat(properties): add upcoming obligations section to PropertyOwnershipPage
feat(s-043): implement Property Upcoming Obligations view
feat(sprint-04): complete E4 — Properties & Real Estate (S-033 → S-043)
```

Sprint 4 merged into main after S-043 closed.

---

Final Verification (S-043): All checks ✅

================================================================================

Post-Sprint Hotfix — SelectItem Empty Value Crash

Status: ✅ Fixed and pushed to main
Discovered: After E4 Sprint 4 merge, when opening AddPropertyExpenseDialog

Error:
  A <Select.Item /> must have a value prop that is not an empty string.
  (Radix UI Select reserves value="" for "no selection" / show placeholder)

Root cause: RecordLeasePaymentDialog.tsx and AddPropertyExpenseDialog.tsx both
used <SelectItem value=""> for the "no portfolios available" empty state.

Fix applied to both files:
```tsx
// BEFORE (broken)
<SelectItem value="" disabled>{t('...')}</SelectItem>

// AFTER (correct)
<div className="py-2 px-3 text-sm text-[#94A3B8]">
  {t('properties.expenses.form.noPortfolios')}
</div>
```

Commit:
```
fix(properties): replace empty-value SelectItem with div in portfolio selects
```

⚠️ Canonical rule going forward: Never use <SelectItem value=""> for empty
states or placeholders in Radix UI Select. Use a non-interactive <div> instead.

================================================================================

E4 — Deferred Items (Post-MVP Backlog)

The following items were identified during Sprint 4 and deliberately deferred
to after the first successful MVP deployment.

---

Deferred Item 1 — Additional Property Types

Current DB CHECK constraint: IN ('residential', 'commercial', 'land')
Candidate types for expansion: 'agricultural_land', 'farm', 'warehouse'
(plus potentially 'apartment', 'villa' based on actual usage)

Implementation scope:
  - Supabase migration: DROP + ADD CHECK constraint on properties.type
  - src/types/index.ts: extend Property['type'] union literal
  - src/i18n/locales/ar.ts + en.ts: add properties.types.* keys
  - src/pages/PropertiesPage.tsx: extend typeBadgeClass() map
  - src/components/properties/AddPropertyDialog.tsx: extend PROPERTY_TYPES + z.enum()

Decision: Current 3-type taxonomy is intentionally broad. Migration cost
is identical whenever done. Expand after MVP validates actual need.

---

Deferred Item 2 — Property Document Attachments

صك الملكية (property deed) and عقد الإيجار (lease contract) uploads.

Implementation scope (requires dedicated story):
  - Supabase Storage: new bucket with RLS policy
  - New DB table: property_documents (id, property_id, type, file_path, file_name, uploaded_at, notes)
  - Frontend: file upload component
  - Integration: display in PropertyOwnershipPage

Decision: Requires Supabase Storage + new table + RLS + upload UI — meaningful
scope that deserves a dedicated story post-MVP.

---

Deferred Item 3 — Portfolio Balance Update on Rent Receipt

When recording a lease payment and selecting a portfolio, the portfolio
balance is NOT automatically updated. portfolio_id in lease_payments is
currently a reference field only.

Actual balance update (creating a transaction in the transactions table)
is handled by E5 (Financial Transactions) and E6 (Capital Accounts & Settlements).

Decision: Correct architectural separation. lease_payments.portfolio_id
serves as a tracking reference to be consumed by E5/E6 when built.