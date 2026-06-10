import { useNavigate }    from 'react-router-dom';
import { useQuery }       from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, Users }     from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { ROUTES }         from '@/router/routes';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type PersonRow = {
  id      : string;
  name    : string;
  relation: string | null;
};

async function fetchPartners(): Promise<PersonRow[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('id, name, relation')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonRow[];
}

function PartnersSkeleton() {
  return (
    <TableBody>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          {[0, 1, 2].map((j) => (
            <TableCell key={j}>
              <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export default function PartnersPage() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const {
    data: people = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['people'],
    queryFn:  fetchPartners,
    staleTime: 60_000,
  });

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-medium text-[#1E293B]">
          {t('people.pageTitle')}
        </h1>
        <p className="text-sm text-[#475569] mt-1">
          {t('people.pageSubtitle')}
        </p>
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead className="text-[#475569] font-medium">
                {t('people.columns.name')}
              </TableHead>
              <TableHead className="text-[#475569] font-medium">
                {t('people.columns.relation')}
              </TableHead>
              <TableHead className="text-[#475569] font-medium">
                {t('people.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>

          {isLoading && <PartnersSkeleton />}

          {!isLoading && isError && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={3}>
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <p className="text-[#475569] text-sm">{t('people.error.title')}</p>
                    <button
                      onClick={() => void refetch()}
                      className="text-sm text-[#1E5DC4] border border-[#1E5DC4] rounded-md px-3 py-1.5 hover:bg-[#E8F0FB] transition-colors"
                    >
                      {t('people.error.retry')}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && !isError && people.length === 0 && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={3}>
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <Users size={40} className="text-[#94A3B8]" />
                    <p className="font-medium text-[#1E293B]">{t('people.empty.title')}</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && !isError && people.length > 0 && (
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id} className="hover:bg-[#F8FAFC]">
                  <TableCell className="font-medium text-[#1E293B]">
                    {person.name}
                  </TableCell>
                  <TableCell className="text-[#475569]">
                    {person.relation ?? '—'}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigate(ROUTES.PARTNER_DETAIL(person.id))}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#1E5DC4] border border-[#B8CFF5] hover:bg-[#E8F0FB] transition-colors"
                    >
                      <Eye size={11} />
                      {t('people.actions.view')}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

    </div>
  );
}
