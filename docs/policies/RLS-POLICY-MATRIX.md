# FinFamily — RLS Policy Matrix
**Version:** 1.1
**Status:** ✅ Verified
**Audited:** 2026-06-11
**Audited by:** S-078

---

## نتيجة التدقيق

| المعيار | النتيجة |
|---------|---------|
| إجمالي الجداول | 23 / 23 |
| RLS مفعّل | 23 / 23 ✅ |
| جداول بدون policy | 0 ✅ |
| جداول خارج التغطية | 0 ✅ |

---

## نمطا الـ Policy المستخدمان

### النمط أ — Wildcard (`*`)
policy واحدة تغطي جميع العمليات (SELECT · INSERT · UPDATE · DELETE):

```sql
CREATE POLICY "authenticated_full_access"
ON public.<table_name>
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### النمط ب — منفصلة (4 policies)
أربع policies مستقلة، واحدة لكل عملية:

```sql
CREATE POLICY "auth_select_<table>"  ON public.<table> FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_<table>"  ON public.<table> FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_<table>"  ON public.<table> FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_<table>"  ON public.<table> FOR DELETE TO authenticated USING (true);
```

> كلا النمطين متكافئان لتطبيق أحادي المستخدم. لا يوجد فرق وظيفي.

---

## مصفوفة الجداول الكاملة

| # | الجدول | RLS | النمط | SELECT | INSERT | UPDATE | DELETE |
|---|--------|-----|-------|--------|--------|--------|--------|
| 1 | `accounting_periods` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 2 | `accounts` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 3 | `capital_transactions` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 4 | `distributions` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 5 | `exchange_rates` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 6 | `journal_entries` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 7 | `journal_entry_lines` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 8 | `lease_payments` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 9 | `leases` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 10 | `partner_capital_accounts` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 11 | `people` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 12 | `portfolio_members` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 13 | `portfolios` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 14 | `profit_settlements` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 15 | `project_members` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 16 | `project_transactions` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 17 | `projects` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |
| 18 | `properties` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 19 | `property_expenses` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 20 | `property_owners` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 21 | `settlement_shares` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 22 | `transactions` | ✅ | ب | ✅ | ✅ | ✅ | ✅ |
| 23 | `wbs_items` | ✅ | أ | ✅ | ✅ | ✅ | ✅ |

---

## استعلام التدقيق

لإعادة التحقق في أي وقت، شغّل هذا الاستعلام في Supabase SQL Editor:

```sql
SELECT
  c.relname        AS table_name,
  c.relrowsecurity AS rls_enabled,
  p.polname        AS policy_name,
  p.polcmd         AS command
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND c.relkind = 'r'
ORDER BY c.relname, p.polcmd;
```

النتيجة الصحيحة: لا يوجد صف يحمل `rls_enabled = true` و `policy_name = null` في نفس الوقت.

---

## قاعدة الصيانة

عند إضافة جدول جديد في أي sprint لاحق:
1. فعّل RLS فوراً في نفس ملف الـ migration
2. أضف الـ policy باستخدام أحد النمطين أعلاه
3. حدّث هذا الملف بإضافة صف جديد للجدول في المصفوفة

---

## سجل التغييرات

| التاريخ | الإصدار | التغيير |
|---------|---------|---------|
| 2026-06-02 | 1.0 | إنشاء الملف — تدقيق 23 جدولاً، جميعها سليمة |
| 2026-06-11 | 1.1 | Sprint 10 S-078 — re-audit confirmed 23 tables, all RLS policies valid · unauthenticated access blocked on people/portfolios/transactions |
