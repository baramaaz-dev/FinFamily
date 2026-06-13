import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyMembers,
  addCompanyMember,
  updateCompanyMember,
  deleteCompanyMember,
} from '@/lib/supabase/companyMembers';
import type {
  CreateCompanyMemberPayload,
  UpdateCompanyMemberPayload,
} from '@/types/companyMember';

export const companyMembersKey = (companyId: string) =>
  ['company-members', companyId] as const;

export function useCompanyMembers(companyId: string) {
  return useQuery({
    queryKey: companyMembersKey(companyId),
    queryFn: () => getCompanyMembers(companyId),
    enabled: !!companyId,
  });
}

export function useAddCompanyMember(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyMemberPayload) => addCompanyMember(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companyMembersKey(companyId) }),
  });
}

export function useUpdateCompanyMember(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCompanyMemberPayload;
    }) => updateCompanyMember(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companyMembersKey(companyId) }),
  });
}

export function useDeleteCompanyMember(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompanyMember(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companyMembersKey(companyId) }),
  });
}
