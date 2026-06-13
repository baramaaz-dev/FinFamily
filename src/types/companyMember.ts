export interface CompanyMember {
  id: string;
  company_id: string;
  person_id: string;
  person_name: string;
  share_numerator: number;
  share_denominator: number;
  notes: string | null;
  created_at: string;
}

export type CreateCompanyMemberPayload = {
  company_id: string;
  person_id: string;
  share_numerator: number;
  share_denominator: number;
  notes: string | null;
};

export type UpdateCompanyMemberPayload = {
  share_numerator: number;
  share_denominator: number;
  notes: string | null;
};
