export type Currency = 'USD' | 'SYP';

export interface Company {
  id: string;
  name: string;
  founded_date: string | null;
  base_currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateCompanyPayload = {
  name: string;
  founded_date: string | null;
  base_currency: Currency;
  notes: string | null;
};
