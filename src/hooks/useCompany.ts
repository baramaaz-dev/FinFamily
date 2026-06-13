import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompany, updateCompany } from '@/lib/supabase/company';
import type { UpdateCompanyPayload } from '@/types/company';

export const COMPANY_KEY = ['company'] as const;

export function useCompany() {
  return useQuery({
    queryKey: COMPANY_KEY,
    queryFn: getCompany,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyPayload }) =>
      updateCompany(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY });
    },
  });
}
