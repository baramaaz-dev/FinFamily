import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Person } from '@/types';

async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function PeopleSkeleton() {
  return (
    <div aria-busy="true">
      <div className="bg-[#F1F5F9] px-4 py-3">
        <div className="flex gap-4">
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-3 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="h-4 w-1/4 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-1/8 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function PeopleEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Users className="h-12 w-12 text-[#94A3B8]" />
      <h3 className="text-base font-medium text-[#1E293B]">
        {t('people.empty.title')}
      </h3>
      <p className="text-sm text-[#475569]">{t('people.empty.subtitle')}</p>
      <Button
        disabled
        className="mt-2 bg-[#1E5DC4] text-white hover:bg-[#164399]"
      >
        <Plus className="ms-2 h-4 w-4" />
        {t('people.addPerson')}
      </Button>
    </div>
  );
}

function PeopleError({ onRetry, t }: { onRetry: () => void; t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm font-medium text-[#C0392B]">{t('people.error.title')}</p>
      <Button
        variant="outline"
        className="border-[#E2E8F0] text-[#1E5DC4] hover:bg-[#E8F0FB]"
        onClick={onRetry}
      >
        {t('people.error.retry')}
      </Button>
    </div>
  );
}

export default function PeoplePage() {
  const { t } = useTranslation();

  const {
    data: people = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('people.pageTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-[#475569]">
            {t('people.pageSubtitle')}
          </p>
        </div>
        <Button
          disabled
          className="bg-[#1E5DC4] text-white hover:bg-[#164399]"
        >
          {t('people.addPerson')}
          <Plus className="ms-2 h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        {isLoading ? (
          <PeopleSkeleton />
        ) : isError ? (
          <PeopleError onRetry={refetch} t={t} />
        ) : people.length === 0 ? (
          <PeopleEmpty />
        ) : (
          <div role="region" aria-label={t('people.pageTitle')}>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9]">
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.name')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.relation')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.notes')}
                  </TableHead>
                  <TableHead className="text-start text-xs font-medium text-[#475569]">
                    {t('people.columns.addedAt')}
                  </TableHead>
                  <TableHead className="text-end text-xs font-medium text-[#475569]">
                    {t('people.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person: Person) => (
                  <TableRow
                    key={person.id}
                    className="text-sm text-[#1E293B] hover:bg-[#F1F5F9]"
                  >
                    <TableCell className="font-medium">
                      {person.name}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      {person.relation ?? '—'}
                    </TableCell>
                    <TableCell className="text-[#475569]">
                      <span
                        className="block max-w-[200px] truncate"
                        title={person.notes ?? undefined}
                      >
                        {person.notes ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-[#475569]">
                      {format(new Date(person.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled
                          aria-label={t('people.actions.edit')}
                          title={t('people.comingSoon')}
                          className="rounded p-1.5 text-[#1E5DC4] opacity-40"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled
                          aria-label={t('people.actions.delete')}
                          title={t('people.comingSoon')}
                          className="rounded p-1.5 text-[#C0392B] opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
