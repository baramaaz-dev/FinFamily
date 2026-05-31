# FinFamily — منصة إدارة الأصول العائلية

منصة ويب خاصة لإدارة الأصول المالية لعائلة تعمل وفق مبدأ شركة المحاصة.

## Stack التقني
- **Frontend**: React 18 + Vite 6
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Arabic RTL كاملاً

## البدء السريع

### 1. استنساخ المشروع
```bash
git clone <repo-url>
cd finfamily
npm install
```

### 2. إعداد Supabase
1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com)
2. نفّذ ملفات الـ migrations بالترتيب:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   ```
3. أنشئ مستخدماً في **Authentication > Users**

### 3. متغيرات البيئة
```bash
cp .env.example .env.local
```
عدّل `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 4. تشغيل محلي
```bash
npm run dev
```

## هيكل المشروع
```
src/
├── components/
│   ├── ui/          # مكونات أساسية (Button, Input, Badge...)
│   ├── layout/      # AppLayout, Sidebar
│   └── shared/      # مكونات مشتركة (ShareInput, CurrencyInput...)
├── pages/
│   ├── dashboard/   # لوحة التحكم
│   ├── transactions/ # المعاملات
│   ├── portfolios/  # المحافظ
│   ├── properties/  # العقارات
│   ├── partners/    # الشركاء
│   ├── reports/     # التقارير
│   └── settings/    # الإعدادات
├── hooks/           # Custom hooks
├── lib/             # supabase.js, utils.js
├── store/           # Zustand stores
└── types/           # JSDoc types
supabase/
└── migrations/      # SQL migrations
```

## قاعدة عمل صارمة
**مجموع حصص أي كيان = 1** — يتحقق النظام قبل كل حفظ.
