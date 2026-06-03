# FinFamily — Validation Strategy (Zod v4)
**Document:** STR-005
**Version:** 1.1
**Status:** ✅ Adopted
**Last updated:** 2026-06-04

> **قاعدة إلزامية:** أي نموذج إدخال (form) أو معالجة بيانات خارجية في المشروع
> يجب أن يستخدم Zod schema موثّق في هذا الملف أو متوافق مع أنماطه.

---

## 1. لماذا Zod في هذا المشروع

TypeScript يحمي البيانات **وقت البناء** فقط. البيانات القادمة من المستخدم عبر
النماذج أو من Supabase عبر API لا ضمان لشكلها في وقت التشغيل.

Zod يضيف طبقة تحقق **حقيقية في وقت التشغيل** بثلاث فوائد متزامنة:
1. التحقق من صحة البيانات قبل إرسالها لـ Supabase
2. استنتاج TypeScript types تلقائياً من الـ schema (`z.infer<>`)
3. توليد رسائل خطأ دقيقة موجهة للمستخدم

---

## 2. الإصدار المعتمد وفروقاته عن v3

**الإصدار المعتمد: Zod v4** (مثبّت مع المشروع منذ S-016)

الفروقات الجوهرية عن v3 المؤثرة على هذا المشروع:

| السلوك | Zod v3 | Zod v4 ✅ |
|--------|--------|----------|
| رسالة خطأ `z.enum()` | `{ required_error: '...' }` | `{ error: '...' }` |
| String اختيارية + فارغة | `.optional().or(z.literal(''))` | `.optional()` |
| حجم المكتبة | ~57 KB | ~14 KB |
| سرعة الـ parse | baseline | أسرع 2–7× |

> ⚠️ **تحذير دائم:** `z.enum()` في v4 يستخدم `{ error: '...' }` وليس
> `{ required_error: '...' }`. هذا الخطأ لا يظهر في TypeScript — يظهر فقط
> عند تشغيل النموذج. تحقق منه في كل schema جديد يستخدم `z.enum()`.

---

## 3. نمط رسائل الخطأ — i18n Keys

**قاعدة ثابتة في هذا المشروع:**
رسائل خطأ Zod تُخزَّن كـ **مفاتيح i18n** (نصوص)، وتُحلَّل بـ `t()` في JSX.
لا تُكتب رسائل عربية أو إنجليزية مباشرةً داخل الـ schema.

```ts
// ✅ صحيح — مفتاح i18n
z.string().min(2, { message: 'portfolios.validation.nameTooShort' })

// ❌ ممنوع — نص مباشر
z.string().min(2, { message: 'الاسم قصير جداً' })
```

عرض الخطأ في JSX:
```tsx
{errors.name && (
  <p className="text-[#C0392B] text-xs mt-1">
    {t(errors.name.message ?? '')}
  </p>
)}
```

---

## 4. نمط التكامل مع React Hook Form

النمط الثابت في جميع نماذج المشروع:

```ts
// 1. تعريف الـ schema
const mySchema = z.object({ ... });

// 2. استنتاج النوع منه
type MyFormData = z.infer<typeof mySchema>;

// 3. ربطه بـ useForm
const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
  useForm<MyFormData>({
    resolver: zodResolver(mySchema),
    defaultValues: { ... },
  });
```

`zodResolver` من `@hookform/resolvers/zod` يدعم v4 تلقائياً من الإصدار 3.3+.
لا حاجة لأي إعداد إضافي.

---

## 5. Validators المعتمدة لكل نوع بيانات

### 5.1 النصوص — Strings

```ts
// حقل مطلوب
z.string()
  .min(1, { message: 'ns.validation.fieldRequired' })
  .min(2, { message: 'ns.validation.fieldTooShort' })
  .max(100, { message: 'ns.validation.fieldTooLong' })

// حقل اختياري (v4 — يقبل undefined وempty string)
z.string()
  .max(500, { message: 'ns.validation.fieldTooLong' })
  .optional()

// نص متعدد الأسطر (textarea)
z.string()
  .max(500, { message: 'ns.validation.notesTooLong' })
  .optional()
```

### 5.2 الأرقام المالية — Financial Amounts

```ts
// مبلغ مالي موجب — حقل مطلوب
z.number({
  required_error: 'ns.validation.amountRequired',
  invalid_type_error: 'ns.validation.amountInvalid',
})
.positive({ message: 'ns.validation.amountPositive' })

// مع coerce للقادم من input[type=text] — حقل مطلوب
z.coerce.number()
  .positive({ message: 'ns.validation.amountPositive' })
```

> **ملاحظة:** حقول الأرقام في HTML تُرجع string من `event.target.value`.
> استخدم `z.coerce.number()` دائماً مع `<Input type="number">` لتجنب
> أخطاء النوع.

---

#### 5.2.1 الأرقام المالية الاختيارية — Optional Financial Amounts

> ⚠️ **تحذير S-027:** `z.preprocess()` يكسر `zodResolver` في Zod v4 عند
> استخدامه مع حقول رقمية اختيارية (`<Input type="number">`).
> الأعراض: resolver يُرجع أخطاء validation غير متوقعة أو يتجاهل الإدخال كلياً.

**النمط الصحيح الوحيد للأرقام الاختيارية في هذا المشروع:**

```ts
// ✅ حقل رقمي اختياري — يبقى string في الـ schema
// التحويل إلى number يتم يدوياً في onSubmit فقط
estimated_value: z.string()
  .refine(
    (v) => v === '' || v === undefined || !isNaN(parseFloat(v)),
    { message: 'ns.validation.estimatedValueInvalid' }
  )
  .refine(
    (v) => v === '' || v === undefined || parseFloat(v) > 0,
    { message: 'ns.validation.estimatedValuePositive' }
  )
  .optional(),
```

التحويل في `onSubmit`:
```ts
const onSubmit = async (data: MyFormData) => {
  await supabaseClient.from('table').insert({
    // ...
    estimated_value: data.estimated_value
      ? parseFloat(data.estimated_value)
      : null,
  });
};
```

`defaultValues` المناسب للحقل:
```ts
defaultValues: {
  estimated_value: '',   // string فارغة — ليس undefined ولا null
}
```

المبدأ: **الـ schema يتحقق من الصيغة فقط. التحويل إلى الـ type الهدف يتم
في onSubmit قبل الإرسال لـ Supabase.**

---

```ts
// ❌ ممنوع — يكسر zodResolver في Zod v4
estimated_value: z.preprocess(
  (v) => (v === '' ? undefined : Number(v)),
  z.number().positive().optional()
),

// ❌ ممنوع — نفس المشكلة
estimated_value: z.coerce.number().positive().optional(),
```

---

### 5.3 الكسور — Share Fractions

```ts
// بسط المحفظة / العقار
z.coerce.number()
  .int({ message: 'ns.validation.mustBeInteger' })
  .positive({ message: 'ns.validation.mustBePositive' })

// مقام المحفظة / العقار
z.coerce.number()
  .int({ message: 'ns.validation.mustBeInteger' })
  .min(1, { message: 'ns.validation.denominatorMin' })
```

> تحقق مجموع الحصص = 1 يتم بـ `validateShares()` من `@/lib/currency`
> **بعد** تجميع كل الحصص — لا يتم داخل schema الحقل الواحد.

### 5.4 التواريخ — Dates

```ts
// تاريخ مطلوب (القادم من input[type=date] هو string)
z.coerce.date({
  required_error: 'ns.validation.dateRequired',
  invalid_type_error: 'ns.validation.dateInvalid',
})

// تاريخ اختياري
z.coerce.date().optional()
```

**تاريخ اختياري من `<Input type="date">`** — يُعامَل كـ string اختيارية:
```ts
// ✅ يحافظ على سلوك input[type=date] الذي يُرجع '' عند الترك فارغاً
purchase_date: z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().optional()
),
// في onSubmit: purchase_date: data.purchase_date || null
```

> ملاحظة: `z.preprocess()` مقبول للتواريخ النصية لأن الـ output يبقى string
> ولا يُغير نوع الحقل — خلافاً للأرقام حيث يتحول النوع من string إلى number.

### 5.5 القوائم المحددة — Enums

```ts
// نوع المحفظة
z.enum(['cash_usd', 'cash_syp', 'gold', 'project'], {
  error: 'ns.validation.typeRequired',   // ← v4: error وليس required_error
})

// نوع المعاملة
z.enum(['income', 'expense', 'transfer'], {
  error: 'ns.validation.transactionTypeRequired',
})

// العملة
z.enum(['USD', 'SYP'], {
  error: 'ns.validation.currencyRequired',
})
```

### 5.6 الـ UUID — Foreign Keys

```ts
// معرّف كيان مرتبط (portfolio_id, property_id, person_id...)
z.string().uuid({ message: 'ns.validation.invalidSelection' })

// اختياري
z.string().uuid({ message: 'ns.validation.invalidSelection' }).optional()
```

---

## 6. Schemas المُعرَّفة لكل وحدة

### 6.1 People (S-016)
```ts
// src/components/people/AddPersonDialog.tsx
z.object({
  name:     z.string().min(1).min(2).max(100),
  relation: z.string().max(80).optional(),
  notes:    z.string().max(500).optional(),
})
```

### 6.2 Portfolios (S-020)
```ts
// src/components/portfolios/AddPortfolioDialog.tsx
z.object({
  name:        z.string().min(1).min(2).max(100),
  type:        z.enum(['cash_usd', 'cash_syp', 'gold', 'project'], { error: '...' }),
  description: z.string().max(500).optional(),
})
```

### 6.3 Transactions — مرجع لـ S-027
```ts
z.object({
  portfolio_id:  z.string().uuid(),
  type:          z.enum(['income', 'expense', 'transfer'], { error: '...' }),
  amount:        z.coerce.number().positive(),
  currency:      z.enum(['USD', 'SYP'], { error: '...' }),
  exchange_rate: z.coerce.number().positive().optional(),
  category:      z.string().max(100).optional(),
  date:          z.coerce.date(),
  notes:         z.string().max(500).optional(),
})
```

### 6.4 Portfolio Members / Shares — مرجع لـ S-022/S-023
```ts
z.object({
  person_id:         z.string().uuid(),
  share_numerator:   z.coerce.number().int().positive(),
  share_denominator: z.coerce.number().int().min(1),
  joined_date:       z.coerce.date(),
})
// مجموع الحصص يُتحقق منه بـ validateShares() بعد جمع كل الأعضاء
```

### 6.5 Exchange Rates — مرجع لـ S-045
```ts
z.object({
  rate: z.coerce.number().positive(),
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
})
```

### 6.6 Leases — مرجع لـ S-038
```ts
z.object({
  tenant_name: z.string().min(1).max(200),
  rent_amount: z.coerce.number().positive(),
  currency:    z.enum(['USD', 'SYP'], { error: '...' }),
  frequency:   z.enum(['monthly', 'annual'], { error: '...' }),
  start_date:  z.coerce.date(),
  end_date:    z.coerce.date().optional(),
})
```

### 6.7 Properties (S-027)
```ts
// src/components/properties/AddPropertyDialog.tsx
z.object({
  name: z.string()
    .min(1, { message: 'properties.validation.nameRequired' })
    .min(2, { message: 'properties.validation.nameTooShort' })
    .max(200, { message: 'properties.validation.nameTooLong' }),

  type: z.enum(['residential', 'commercial', 'land'], {
    error: 'properties.validation.typeRequired',
  }),

  status: z.enum(['rented', 'vacant'], {
    error: 'properties.validation.statusRequired',
  }),

  location: z.string()
    .max(500, { message: 'properties.validation.locationTooLong' })
    .optional(),

  // تاريخ اختياري — يُحفظ كـ string؛ z.preprocess مقبول هنا (output يبقى string)
  purchase_date: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),

  // رقم اختياري — z.string().refine() لتجنب كسر zodResolver (§5.2.1)
  // التحويل إلى number يتم بـ parseFloat() في onSubmit
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
})

// في onSubmit:
// estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null
// purchase_date:   data.purchase_date || null
```

---

## 7. قواعد تسمية الـ Schemas

| العنصر | النمط | مثال |
|--------|-------|-------|
| Schema const | `add{Entity}Schema` | `addPortfolioSchema` |
| Schema const (تعديل) | `edit{Entity}Schema` | `editPersonSchema` |
| Schema type | `Add{Entity}FormData` | `AddPortfolioFormData` |
| Schema type (تعديل) | `Edit{Entity}FormData` | `EditPersonFormData` |
| مكان التعريف | خارج الـ component | أعلى الملف، قبل الـ component |

---

## 8. ما هو محظور — Anti-patterns

| ❌ ممنوع | ✅ البديل |
|----------|----------|
| نص مباشر في رسالة الخطأ | مفتاح i18n دائماً |
| `required_error` في `z.enum()` | `error` (v4 API) |
| `.optional().or(z.literal(''))` | `.optional()` فقط (v4) |
| `z.number()` مع `<Input type="number">` | `z.coerce.number()` |
| `z.preprocess()` لحقول الأرقام الاختيارية | `z.string().refine()` + `parseFloat()` في `onSubmit` (§5.2.1) |
| `z.coerce.number().optional()` مع input فارغ | `z.string().refine()` + `parseFloat()` في `onSubmit` (§5.2.1) |
| تحقق مجموع الحصص داخل الـ schema | `validateShares()` من `@/lib/currency` |
| تعريف الـ schema داخل الـ component | خارج الـ component دائماً |
| `any` type في FormData | `z.infer<typeof schema>` |

---

## 9. سجل القرارات

| التاريخ | القرار | السبب |
|---------|--------|-------|
| 2026-06-01 | اعتماد Zod v4 | مثبّت مع المشروع منذ S-016 |
| 2026-06-01 | رسائل الخطأ كمفاتيح i18n | توافق مع نظام الترجمة AR/EN |
| 2026-06-03 | توثيق فرق `z.enum()` v3→v4 | اكتُشف في S-020؛ مرجع دائم لجميع القصص |
| 2026-06-03 | اعتماد `z.coerce.number()` للمبالغ المطلوبة | HTML inputs تُرجع string دائماً |
| 2026-06-03 | مجموع الحصص خارج Zod | المنطق معقد ويعتمد على جميع الحصص معاً |
| 2026-06-04 | حظر `z.preprocess()` و`z.coerce.number().optional()` للأرقام الاختيارية | اكتُشف في S-027: يكسر `zodResolver` في Zod v4؛ البديل `z.string().refine()` + `parseFloat()` في `onSubmit` |