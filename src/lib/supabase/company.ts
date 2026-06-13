import { supabaseClient } from '@/lib/supabase';
import type { Company, UpdateCompanyPayload } from '@/types/company';

export async function getCompany(): Promise<Company | null> {
  const { data, error } = await supabaseClient
    .from('company')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

export async function updateCompany(
  id: string,
  payload: UpdateCompanyPayload
): Promise<Company> {
  const { data, error } = await supabaseClient
    .from('company')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}
