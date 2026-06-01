# FinFamily — Brand & Design Guidelines
**Version:** 1.0
**Status:** ✅ Adopted
**Last updated:** 2026-06-01

> **قاعدة إلزامية:** أي ملف يتعلق بالتصميم أو الواجهة يجب أن يطّلع على هذا الملف أولاً قبل كتابة أي كود أو اتخاذ أي قرار بصري.

---

## 1. المنطق الذي أفضى لهذه الخيارات

### 1.1 التقليد الموروث من نظام Bloomberg
منذ الثمانينيات رسّخت شاشات المحطات المالية (Bloomberg Terminals) ثنائية اللون:
- **الأخضر** ← الرقم موجب، دخل، ربح
- **الأحمر** ← الرقم سالب، مصروف، خسارة

هذا الارتباط صار شرطياً لدى أي مستخدم يتعامل مع أرقام مالية — كسره يُربك القراءة.

### 1.2 الهيمنة الزرقاء على قطاع المالية
Xero · Wave · Zoho Books · QuickBooks (نسخ أحدث) · JPMorgan · Visa · American Express · PayPal — جميعها تتمركز حول الأزرق الغامق. السبب نفسي: الأزرق يحمل رسائل ضمنية (ثقة، استقرار، احترافية) تتقاطع مع ما يحتاجه مستخدم يتعامل مع أصول عائلية خاصة.

### 1.3 قيد Shadcn/Slate
في S-001 اعتُمدت قاعدة **Slate** في `shadcn init`. هذا القيد غير قابل للتجاوز دون كسر مكوّنات Shadcn الجاهزة. كل الألوان المختارة متوافقة مع هذه القاعدة.

---

## 2. لوحة الألوان الكاملة

### 2.1 اللون الرئيسي — Brand Primary

| الدرجة | Hex | الاستخدام |
|--------|-----|-----------|
| 50 | `#E8F0FB` | خلفية Active Nav · Badge fill |
| 100 | `#B8CFF5` | حدود خفيفة · Hover borders |
| 200 | `#7FAAE8` | أيقونات ثانوية |
| **400** | **`#1E5DC4`** | **اللون الأساسي — Buttons · Links · Active states** |
| 600 | `#164399` | Hover على الأساسي |
| 800 | `#0D2D6B` | نص على خلفيات فاتحة |
| 900 | `#071940` | نص Bold على خلفيات 50 |

```css
/* tailwind.config.ts */
primary: {
  50:  '#E8F0FB',
  100: '#B8CFF5',
  200: '#7FAAE8',
  400: '#1E5DC4',   /* DEFAULT */
  600: '#164399',
  800: '#0D2D6B',
  900: '#071940',
},
```

---

### 2.2 الألوان الدلالية — Semantic Colors

#### ✅ النجاح / الدخل / الربح — Success · Income · Profit
| الدرجة | Hex |
|--------|-----|
| 50 | `#EBF5F0` |
| 200 | `#A3D4BC` |
| **400** | **`#1A7D4F`** |
| 600 | `#126038` |

**يُستخدم في:** معاملات الدخل · أرقام الربح · حالة "مدفوع" · إشارات النمو الإيجابي

---

#### ❌ الخطر / المصروف / الخسارة — Danger · Expense · Loss
| الدرجة | Hex |
|--------|-----|
| 50 | `#FEF0EF` |
| 200 | `#F5B9B5` |
| **400** | **`#C0392B`** |
| 600 | `#922B21` |

**يُستخدم في:** معاملات المصروف · أرقام الخسارة · رأس مال سالب · حذف / تحذير حرج

---

#### ⚠️ التحذير / الالتزامات / المعلّق — Warning · Due · Pending
| الدرجة | Hex |
|--------|-----|
| 50 | `#FEF7EC` |
| 200 | `#F5CC8A` |
| **400** | **`#B45309`** |
| 600 | `#854009` |

**يُستخدم في:** إيجارات متأخرة · مصروفات مستحقة · حالة "معلّق" · تنبيهات Dashboard ⚠️

---

#### ℹ️ المعلوماتي / التحويل — Info · Transfer · Neutral Action
نفس تدرج الأساسي `primary.*` — لا تكرار.

---

### 2.3 الحيادي — Slate Neutral

| الدرجة | Hex | الاستخدام |
|--------|-----|-----------|
| 50 | `#F8FAFC` | خلفية الصفحة (page bg) |
| 100 | `#F1F5F9` | خلفية البطاقات الثانوية |
| 200 | `#E2E8F0` | حدود افتراضية |
| 400 | `#94A3B8` | نص ثالثي · placeholder |
| 600 | `#475569` | نص ثانوي |
| 800 | `#1E293B` | نص أساسي |
| 950 | `#0F172A` | نص Bold · عناوين |

> هذه هي قيم Slate الافتراضية في Tailwind v3 — لا تعديل عليها.

---

### 2.4 ألوان الشركاء — Partner Accents

تُخصَّص بالدور، لا بالشخص. عند عرض Avatar أو حصة شريك، اختر من هذه الثلاثة بالتناوب:

| الرمز | Hex أيقونة | Hex خلفية | متى |
|-------|-----------|-----------|-----|
| أزرق | `#1E5DC4` | `#E8F0FB` | الشريك الأول أو المرجع |
| أخضر | `#1A7D4F` | `#EBF5F0` | الشريك الثاني |
| عنبري | `#B45309` | `#FEF7EC` | الشريك الثالث فما فوق |

---

## 3. الطباعة — Typography

### 3.1 الخطوط

```css
/* في index.css */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500&family=IBM+Plex+Mono&display=swap');
```

| الدور | الخط | الوزن |
|-------|------|-------|
| النص العربي الرئيسي | IBM Plex Sans Arabic | 400 / 500 |
| الأرقام المالية | IBM Plex Mono | 400 / 500 |
| Fallback | system-ui, sans-serif | — |

**السبب:** IBM Plex Sans Arabic مصمم للنص المالي — أرقامه أحادية العرض (tabular) في النسخة العربية مما يجعل الأعمدة المالية منتظمة بصرياً دون الحاجة لـ Mono لكل شيء.

---

### 3.2 مقاييس النص

| المستوى | الحجم | الوزن | الاستخدام |
|---------|-------|-------|-----------|
| `text-xs` | 11px | 400 | Labels · Badges · Meta |
| `text-sm` | 13px | 400 | نص جداول · وصف ثانوي |
| `text-base` | 15px | 400 | نص صفحة عادي |
| `text-lg` | 17px | 500 | عنوان بطاقة |
| `text-xl` | 20px | 500 | عنوان قسم |
| `text-2xl` | 24px | 500 | الأرقام الكبيرة (صافي الثروة) |
| `text-3xl` | 30px | 500 | Hero number في Dashboard |

**قاعدة الأرقام المالية:** كل رقم مالي (`amount`) يستخدم `font-mono` أو `tabular-nums` — لا استثناء.

```tsx
<span className="font-mono tabular-nums text-2xl font-medium">
  {formatCurrency(amount)}
</span>
```

---

## 4. المسافات والأبعاد — Spacing & Sizing

```
Sidebar expanded : 260px
Sidebar collapsed: 64px
Header height    : 56px  (h-14)
Content padding  : p-6 desktop / p-4 mobile
Card padding     : p-4 (1rem 1.25rem)
Gap بين البطاقات: gap-3 (12px)
Border radius    : rounded-lg للبطاقات / rounded-md للعناصر الصغيرة
Border width     : 1px (border افتراضي Tailwind)
```

---

## 5. قواعد اللون في الكود

### 5.1 قاعدة المعاملة المالية
```tsx
const amountColor = (type: 'income' | 'expense' | 'transfer') => ({
  income:   'text-[#1A7D4F] bg-[#EBF5F0]',
  expense:  'text-[#C0392B] bg-[#FEF0EF]',
  transfer: 'text-[#1E5DC4] bg-[#E8F0FB]',
}[type]);
```

### 5.2 قاعدة الحالة (Status)
```tsx
const statusColor = (status: 'paid' | 'pending' | 'overdue') => ({
  paid:    'text-[#1A7D4F] bg-[#EBF5F0]',
  pending: 'text-[#B45309] bg-[#FEF7EC]',
  overdue: 'text-[#C0392B] bg-[#FEF0EF]',
}[status]);
```

### 5.3 الرقم المالي الإيجابي/السالب
```tsx
const signColor = (value: number) =>
  value >= 0 ? 'text-[#1A7D4F]' : 'text-[#C0392B]';
```

---

## 6. ما هو محظور — Anti-patterns

| ❌ ممنوع | ✅ البديل |
|----------|----------|
| اللون البنفسجي في أي عنصر مالي | أزرق `primary.400` |
| أخضر فاتح (`green-300`) للدخل | `#1A7D4F` فقط |
| رمادي خالص للحدود | Slate-200 `#E2E8F0` |
| تدرجات (gradients) على البطاقات | خلفية مسطحة + حد |
| أكثر من لونين على نفس المكوّن | لون واحد + حيادي |
| نص ملوّن على خلفية ملوّنة مختلفة | نفس العائلة اللونية دائماً |

---

## 7. Tailwind Config الكاملة

```ts
// tailwind.config.ts — قسم colors فقط
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E8F0FB',
          100: '#B8CFF5',
          200: '#7FAAE8',
          400: '#1E5DC4',
          DEFAULT: '#1E5DC4',
          600: '#164399',
          800: '#0D2D6B',
          900: '#071940',
        },
        success: {
          50:  '#EBF5F0',
          200: '#A3D4BC',
          400: '#1A7D4F',
          DEFAULT: '#1A7D4F',
          600: '#126038',
        },
        danger: {
          50:  '#FEF0EF',
          200: '#F5B9B5',
          400: '#C0392B',
          DEFAULT: '#C0392B',
          600: '#922B21',
        },
        warning: {
          50:  '#FEF7EC',
          200: '#F5CC8A',
          400: '#B45309',
          DEFAULT: '#B45309',
          600: '#854009',
        },
      },
      fontFamily: {
        sans:  ['IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        mono:  ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 8. CSS Variables لـ Shadcn (index.css)

```css
@layer base {
  :root {
    --background:       0 0% 98%;          /* Slate-50 */
    --foreground:       215 28% 17%;       /* Slate-800 */
    --card:             0 0% 100%;
    --card-foreground:  215 28% 17%;
    --primary:          220 73% 44%;       /* #1E5DC4 */
    --primary-foreground: 0 0% 98%;
    --secondary:        214 32% 91%;       /* Slate-200 */
    --secondary-foreground: 215 25% 27%;
    --muted:            214 32% 91%;
    --muted-foreground: 215 16% 47%;       /* Slate-500 */
    --accent:           220 73% 95%;       /* primary-50 */
    --accent-foreground: 220 73% 38%;      /* primary-600 */
    --destructive:      4 75% 47%;         /* #C0392B */
    --destructive-foreground: 0 0% 98%;
    --border:           214 32% 91%;
    --input:            214 32% 91%;
    --ring:             220 73% 44%;
    --radius: 0.5rem;
  }

  .dark {
    --background:       222 47% 11%;
    --foreground:       210 40% 96%;
    --card:             222 47% 14%;
    --card-foreground:  210 40% 96%;
    --primary:          220 73% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary:        217 33% 20%;
    --secondary-foreground: 210 40% 96%;
    --muted:            217 33% 20%;
    --muted-foreground: 215 20% 65%;
    --accent:           217 33% 20%;
    --accent-foreground: 210 40% 96%;
    --destructive:      4 65% 55%;
    --destructive-foreground: 210 40% 96%;
    --border:           217 33% 20%;
    --input:            217 33% 20%;
    --ring:             220 73% 60%;
  }
}
```

---

## 9. سجل القرارات

| التاريخ | القرار | السبب |
|---------|--------|-------|
| 2026-06-01 | اعتماد الأزرق `#1E5DC4` لوناً رئيسياً | توافق مع Shadcn Slate + تقليد قطاع المالية |
| 2026-06-01 | اعتماد IBM Plex Sans Arabic | أرقام tabular مدمجة بدون font-feature-settings إضافية |
| 2026-06-01 | تثبيت الأخضر/الأحمر للدخل/المصروف | موروث Bloomberg Terminal — لا يُكسر |
| 2026-06-01 | رفض البنفسجي والتدرجات | لا تنتمي لقطاع الإدارة المالية |
