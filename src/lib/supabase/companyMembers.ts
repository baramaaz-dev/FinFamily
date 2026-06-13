import { supabaseClient } from '@/lib/supabase';
import type {
  CompanyMember,
  CreateCompanyMemberPayload,
  UpdateCompanyMemberPayload,
} from '@/types/companyMember';

export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const { data: members, error: membersError } = await supabaseClient
    .from('company_members')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  if (membersError) throw membersError;
  if (!members || members.length === 0) return [];

  const personIds = members.map((m) => m.person_id);
  const { data: people, error: peopleError } = await supabaseClient
    .from('people')
    .select('id, name')
    .in('id', personIds);
  if (peopleError) throw peopleError;

  const nameMap = new Map((people ?? []).map((p) => [p.id, p.name]));
  return members.map((m) => ({
    ...m,
    person_name: nameMap.get(m.person_id) ?? '',
  })) as CompanyMember[];
}

export async function addCompanyMember(
  payload: CreateCompanyMemberPayload
): Promise<CompanyMember> {
  const { data, error } = await supabaseClient
    .from('company_members')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as CompanyMember;
}

export async function updateCompanyMember(
  id: string,
  payload: UpdateCompanyMemberPayload
): Promise<CompanyMember> {
  const { data, error } = await supabaseClient
    .from('company_members')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CompanyMember;
}

export async function deleteCompanyMember(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('company_members')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
