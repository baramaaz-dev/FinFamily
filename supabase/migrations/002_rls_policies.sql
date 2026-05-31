-- =============================================
-- FinFamily — Row Level Security Policies
-- Migration: 002_rls_policies
-- =============================================
-- استراتيجية: مستخدم واحد مُصادق عليه — كل صف مسموح له

-- دالة مساعدة: هل المستخدم مسجّل دخوله؟
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================
-- تفعيل RLS على جميع الجداول
-- =============================================
ALTER TABLE people                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties                ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_capital_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_settlements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_shares         ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions             ENABLE ROW LEVEL SECURITY;

-- =============================================
-- سياسات CRUD — للمستخدم المصادق عليه فقط
-- =============================================
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'people','portfolios','portfolio_members','transactions',
    'properties','property_owners','leases','lease_payments',
    'property_expenses','partner_capital_accounts','capital_transactions',
    'profit_settlements','settlement_shares','exchange_rates','distributions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('
      CREATE POLICY "auth_select_%1$s" ON %1$s
        FOR SELECT USING (is_authenticated());
      CREATE POLICY "auth_insert_%1$s" ON %1$s
        FOR INSERT WITH CHECK (is_authenticated());
      CREATE POLICY "auth_update_%1$s" ON %1$s
        FOR UPDATE USING (is_authenticated());
      CREATE POLICY "auth_delete_%1$s" ON %1$s
        FOR DELETE USING (is_authenticated());
    ', tbl);
  END LOOP;
END;
$$;
