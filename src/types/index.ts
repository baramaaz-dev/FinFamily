export interface Person {
  id: string
  name: string
  relation?: string
  notes?: string
}

export interface Portfolio {
  id: string
  name: string
  type: 'cash_usd' | 'cash_syp' | 'gold' | 'project'
  description?: string
}

export interface PortfolioMember {
  portfolio_id: string
  person_id: string
  share_numerator: number
  share_denominator: number
  joined_date?: string
}

export interface Transaction {
  id: string
  portfolio_id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: 'USD' | 'SYP'
  exchange_rate?: number
  category?: string
  date: string
  notes?: string
}

export interface Property {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'land'
  location?: string
  purchase_date?: string
  estimated_value?: number
  status: 'rented' | 'vacant'
}

export interface PropertyOwner {
  property_id: string
  person_id: string
  share_numerator: number
  share_denominator: number
  ownership_basis: 'إرث' | 'شراء' | 'هبة' | 'وصية' | 'شراكة'
}

export interface Lease {
  id: string
  property_id: string
  tenant_name: string
  rent_amount: number
  currency: 'USD' | 'SYP'
  frequency: 'monthly' | 'annual'
  start_date: string
  end_date?: string
}

export interface ExchangeRate {
  id: string
  rate: number
  date: string
  notes?: string
}

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}
