# FinFamily — Validation Strategy (Zod v4)
**Document:** STR-005
**Version:** 1.2
**Status:** ✅ Adopted
**Last updated:** 2026-06-06

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

### 4.1 cast إلزامي عند استخدام .superRefine()

> ⚠️ **مكتشف في S-027/S-028:** عند إضافة `.superRefine()` لأي schema،
> يتغير النوع المستنتج بشكل يتعارض مع توقع `useForm<MyFormData>`.
> الأعراض: خطأ TypeScript على سطر `resolver`.

**الحل الثابت في هذا المشروع:**

```ts
import type { Resolver } from 'react-hook-form';

// ✅ cast إلزامي عند وجود .superRefine() في الـ schema
useForm<MyFormData>({
  resolver: zodResolver(mySchema) as unknown as Resolver<MyFormData>,
  defaultValues: { ... },
});

// ✅ بدون .superRefine() — لا حاجة للـ cast
useForm<MyFormData>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});
```

> القاعدة: إذا كان الـ schema يحتوي على `.superRefine()` → أضف الـ cast دائماً.
> إذا لم يحتوِ → لا تضفه (لا حاجة والـ cast الزائد يُضعف type safety).

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

> ⚠️ **تحذير مكتشف في S-027:** `z.preprocess()` يكسر `zodResolver` في Zod v4 عند
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

---

### 5.4 التواريخ — Dates

#### تاريخ مطلوب من input[type=date]

> ⚠️ **تصحيح مكتشف في S-027:** `z.coerce.date()` يحوّل الـ string إلى Date object،
> مما يتعارض مع Supabase الذي يتوقع string بصيغة `yyyy-MM-dd`.
> النمط الصحيح للتواريخ المطلوبة هو `z.string().min(1)` — يحافظ على الـ string
> كما تُرجعه `input[type=date]` ويمررها مباشرةً لـ Supabase.

```ts
// ✅ تاريخ مطلوب — يبقى string لـ Supabase
date: z.string()
  .min(1, { message: 'ns.validation.dateRequired' }),

// في onSubmit: date: data.date  (string جاهزة، لا تحويل مطلوب)
```

#### تاريخ اختياري من input[type=date]

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

```ts
// ❌ لا تستخدم z.coerce.date() مع Supabase — يُنتج Date object لا string
z.coerce.date({ required_error: '...' })
```

---

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

---

### 5.6 الـ UUID — Foreign Keys

```ts
// معرّف كيان مرتبط — من قائمة Select (dropdown)
// استخدم min(1) لا uuid() — يُنتج رسالة خطأ أوضح للمستخدم
z.string().min(1, { message: 'ns.validation.fieldRequired' })

// من input نصي حر حيث صيغة UUID مطلوبة صراحةً
z.string().uuid({ message: 'ns.validation.invalidSelection' })
```

> **قاعدة مكتشفة في S-027:** حقول الـ Select (dropdown) تُرجع string عادية.
> استخدام `z.string().uuid()` يُظهر رسالة خطأ تتعلق بصيغة UUID لا بغياب الاختيار.
> `z.string().min(1)` يُنتج رسالة "يجب اختيار..." أوضح للمستخدم.

---

### 5.7 التحقق المتقاطع بين حقلين — Cross-field Validation

عند الحاجة للتحقق من علاقة بين حقلين (مثال: currency = SYP تستلزم exchange_rate):

```ts
const mySchema = z.object({
  currency:      z.enum(['USD', 'SYP'], { error: '...' }),
  exchange_rate: z.string().refine(...).optional(),
  // ... باقي الحقول
}).superRefine((data, ctx) => {
  if (data.currency === 'SYP' && (!data.exchange_rate || data.exchange_rate === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['exchange_rate'],          // الحقل الذي يُعرض عليه الخطأ
      message: 'ns.validation.exchangeRateRequired',  // مفتاح i18n
    });
  }
});

// ⚠️ إلزامي: أضف cast عند استخدام .superRefine() (راجع §4.1)
resolver: zodResolver(mySchema) as unknown as Resolver<MyFormData>
```

> `superRefine` هو المكان الوحيد الصحيح للتحقق المتقاطع في هذا المشروع.
> لا تُكرر منطق التحقق داخل حقل واحد إذا كان يعتمد على قيمة حقل آخر.

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

### 6.3 Transactions (S-027 → S-032)

> ⚠️ **تصحيح إصدار 1.2:** الإصدار 1.1 كان يوثّق أنماطاً خاطئة لهذا الـ schema.
> المرجع الصحيح هو الكود المُنفَّذ فعلياً في S-027/S-028/S-032.

```ts
// src/components/transactions/AddTransactionDialog.tsx
// src/components/transactions/EditTransactionDialog.tsx

const addTransactionSchema = z.object({
  portfolio_id: z.string()
    .min(1, { message: 'transactions.validation.portfolioRequired' }),
  type: z.enum(['income', 'expense', 'transfer'], {
    error: 'transactions.validation.typeRequired',
  }),
  amount: z.coerce.number()
    .positive({ message: 'transactions.validation.amountPositive' }),
  currency: z.enum(['USD', 'SYP'], {
    error: 'transactions.validation.currencyRequired',
  }),
  date: z.string()
    .min(1, { message: 'transactions.validation.dateRequired' }),
  category: z.string()
    .max(100, { message: 'transactions.validation.categoryTooLong' })
    .optional(),
  notes: z.string()
    .max(500, { message: 'transactions.validation.notesTooLong' })
    .optional(),
  exchange_rate: z.string()
    .refine(
      (v) => v === '' || v === undefined || !isNaN(parseFloat(v)),
      { message: 'transactions.validation.exchangeRateInvalid' }
    )
    .refine(
      (v) => v === '' || v === undefined || parseFloat(v) > 0,
      { message: 'transactions.validation.exchangeRatePositive' }
    )
    .optional(),
}).superRefine((data, ctx) => {
  if (data.currency === 'SYP' && (!data.exchange_rate || data.exchange_rate === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['exchange_rate'],
      message: 'transactions.validation.exchangeRateRequired',
    });
  }
});

// cast إلزامي بسبب .superRefine()
resolver: zodResolver(addTransactionSchema) as unknown as Resolver<AddTransactionFormData>

// في onSubmit:
// exchange_rate: data.currency === 'SYP' && data.exchange_rate
//   ? parseFloat(data.exchange_rate) : null
// date: data.date  (string مباشرة — لا تحويل)
```

### 6.4 Portfolio Members / Shares (S-022/S-023)
```ts
z.object({
  person_id:         z.string().uuid(),
  share_numerator:   z.coerce.number().int().positive(),
  share_denominator: z.coerce.number().int().min(1),
  joined_date:       z.coerce.date(),
})
// مجموع الحصص يُتحقق منه بـ validateShares() بعد جمع كل الأعضاء
```

### 6.5 Exchange Rates (S-045)
```ts
z.object({
  rate:  z.coerce.number().positive(),
  date:  z.string().min(1),   // ← string لا z.coerce.date() (§5.4)
  notes: z.string().max(500).optional(),
})
```

### 6.6 Leases (S-038)
```ts
z.object({
  tenant_name: z.string().min(1).max(200),
  rent_amount: z.coerce.number().positive(),
  currency:    z.enum(['USD', 'SYP'], { error: '...' }),
  frequency:   z.enum(['monthly', 'annual'], { error: '...' }),
  start_date:  z.string().min(1),   // ← string لا z.coerce.date() (§5.4)
  end_date:    z.preprocess(        // ← اختياري — نمط §5.4
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),
})
```

### 6.7 Properties (S-034)
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
  purchase_date: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional()
  ),
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
| Schema const (تعديل) | `edit{Entity}Schema` | `editTransactionSchema` |
| Schema type | `Add{Entity}FormData` | `AddPortfolioFormData` |
| Schema type (تعديل) | `Edit{Entity}FormData` | `EditTransactionFormData` |
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
| `z.coerce.date()` مع Supabase | `z.string().min(1)` للمطلوب · `z.preprocess(...)` للاختياري (§5.4) |
| `z.string().uuid()` لحقول Shadcn Select | `z.string().min(1)` — رسالة خطأ أوضح (§5.6) |
| منطق cross-field داخل حقل واحد | `.superRefine()` على مستوى الـ object (§5.7) |
| `zodResolver(schema)` بدون cast مع `.superRefine()` | `zodResolver(schema) as unknown as Resolver<T>` (§4.1) |
| تحقق مجموع الحصص داخل الـ schema | `validateShares()` من `@/lib/currency` |
| تعريف الـ schema داخل الـ component | خارج الـ component دائماً |
| `any` type في FormData | `z.infer<typeof schema>` |

---

## 9. سجل القرارات

| التاريخ | القرار | السبب |
|---------|--------|-------|
| 2026-06-01 | اعتماد Zod v4 | مثبّت مع المشروع منذ S-016 |
| 2026-06-01 | رسائل الخطأ كمفاتيح i18n | توافق مع نظام الترجمة AR/EN |
| 2026-06-03 | توثيق فرق `z.enum()` v3→v4 | اكتُشف في S-020؛ مرجع دائم |
| 2026-06-03 | اعتماد `z.coerce.number()` للمبالغ المطلوبة | HTML inputs تُرجع string دائماً |
| 2026-06-03 | مجموع الحصص خارج Zod | المنطق معقد ويعتمد على جميع الحصص معاً |
| 2026-06-04 | حظر `z.preprocess()` و`z.coerce.number().optional()` للأرقام الاختيارية | اكتُشف في S-027: يكسر `zodResolver`؛ البديل `z.string().refine()` |
| 2026-06-06 | `zodResolver(...) as unknown as Resolver<T>` عند `.superRefine()` | اكتُشف في S-027/S-028: TypeScript يرفض النوع بدون الـ cast |
| 2026-06-06 | `z.string().min(1)` للتواريخ المطلوبة بدلاً من `z.coerce.date()` | اكتُشف في S-027: `z.coerce.date()` يُنتج Date object لا string؛ Supabase يتوقع string |
| 2026-06-06 | `z.string().min(1)` لحقول Select بدلاً من `z.string().uuid()` | اكتُشف في S-027: uuid() يُنتج رسالة خطأ تقنية لا تُفيد المستخدم |
| 2026-06-06 | `.superRefine()` للتحقق المتقاطع بين حقلين | اكتُشف في S-028: الحاجة لإلزام exchange_rate عند currency=SYP |
| 2026-06-06 | تصحيح §6.3 (Transactions schema) | كان يوثّق أنماطاً تتعارض مع §5.2.1 و§5.4؛ حُدّث ليعكس الكود الفعلي |