-- =============================================
-- FinFamily — Initial Schema
-- Migration: 001_initial_schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PEOPLE
-- =============================================
CREATE TABLE people (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  relation    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PORTFOLIOS
-- =============================================
CREATE TABLE portfolios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('cash_usd','cash_syp','gold','project')),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_members (
  portfolio_id      UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  person_id         UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  share_numerator   INTEGER NOT NULL CHECK (share_numerator > 0),
  share_denominator INTEGER NOT NULL CHECK (share_denominator > 0),
  joined_date       DATE,
  PRIMARY KEY (portfolio_id, person_id)
);

-- =============================================
-- TRANSACTIONS
-- =============================================
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount        NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate NUMERIC(12,4),
  category      TEXT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROPERTIES
-- =============================================
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('residential','commercial','land')),
  location        TEXT,
  purchase_date   DATE,
  estimated_value NUMERIC(18,4),
  status          TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('rented','vacant')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property_owners (
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  person_id         UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  share_numerator   INTEGER NOT NULL CHECK (share_numerator > 0),
  share_denominator INTEGER NOT NULL CHECK (share_denominator > 0),
  ownership_basis   TEXT NOT NULL CHECK (ownership_basis IN ('إرث','شراء','هبة','وصية','شراكة')),
  PRIMARY KEY (property_id, person_id)
);

-- =============================================
-- LEASES
-- =============================================
CREATE TABLE leases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_name  TEXT NOT NULL,
  rent_amount  NUMERIC(18,4) NOT NULL CHECK (rent_amount > 0),
  currency     TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  frequency    TEXT NOT NULL CHECK (frequency IN ('monthly','annual')),
  start_date   DATE NOT NULL,
  end_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lease_payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id      UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  amount        NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate NUMERIC(12,4),
  paid_date     DATE NOT NULL,
  portfolio_id  UUID REFERENCES portfolios(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROPERTY EXPENSES
-- =============================================
CREATE TABLE property_expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('tax','maintenance','utilities','fees')),
  amount        NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate NUMERIC(12,4),
  due_date      DATE NOT NULL,
  paid_date     DATE,
  is_recurring  BOOLEAN DEFAULT FALSE,
  frequency     TEXT CHECK (frequency IN ('monthly','annual','once')),
  portfolio_id  UUID REFERENCES portfolios(id),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAPITAL ACCOUNTS
-- =============================================
CREATE TABLE partner_capital_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id      UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('portfolio','property')),
  entity_id       UUID NOT NULL,
  opening_balance NUMERIC(18,4) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  opening_date    DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (partner_id, entity_type, entity_id)
);

CREATE TABLE capital_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capital_account_id  UUID NOT NULL REFERENCES partner_capital_accounts(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN (
                        'capital_injection','capital_reduction',
                        'drawing','profit_share','loss_share'
                      )),
  amount              NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  exchange_rate       NUMERIC(12,4),
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_no        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROFIT SETTLEMENTS
-- =============================================
CREATE TABLE profit_settlements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('portfolio','property')),
  entity_id        UUID NOT NULL,
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  total_profit     NUMERIC(18,4) NOT NULL,
  currency         TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  settlement_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settlement_shares (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id         UUID NOT NULL REFERENCES profit_settlements(id) ON DELETE CASCADE,
  partner_id            UUID NOT NULL REFERENCES people(id),
  share_numerator       INTEGER NOT NULL,
  share_denominator     INTEGER NOT NULL,
  amount                NUMERIC(18,4) NOT NULL,
  capital_transaction_id UUID REFERENCES capital_transactions(id)
);

-- =============================================
-- EXCHANGE RATES
-- =============================================
CREATE TABLE exchange_rates (
  id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate   NUMERIC(12,4) NOT NULL CHECK (rate > 0),
  date   DATE NOT NULL UNIQUE,
  notes  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DISTRIBUTIONS
-- =============================================
CREATE TABLE distributions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id  UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('portfolio','property')),
  entity_id   UUID NOT NULL,
  amount      NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency    TEXT NOT NULL CHECK (currency IN ('USD','SYP')),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX idx_transactions_date      ON transactions(date DESC);
CREATE INDEX idx_lease_payments_lease   ON lease_payments(lease_id);
CREATE INDEX idx_property_expenses_prop ON property_expenses(property_id);
CREATE INDEX idx_property_expenses_due  ON property_expenses(due_date);
CREATE INDEX idx_capital_tx_account     ON capital_transactions(capital_account_id);
CREATE INDEX idx_settlement_shares_sett ON settlement_shares(settlement_id);
CREATE INDEX idx_distributions_partner  ON distributions(partner_id);
