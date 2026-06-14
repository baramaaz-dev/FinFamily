import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation }                      from 'react-i18next';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast }                               from 'sonner';
import { useQueryClient }                      from '@tanstack/react-query';
import { Input }                               from '@/components/ui/input';
import { Button }                              from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
}                                              from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
}                                              from '@/components/ui/alert-dialog';
import { Checkbox }                            from '@/components/ui/checkbox';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
}                                              from '@/components/ui/tooltip';
import { usePendingJournalEntries }            from '@/hooks/useJournalReview';
import { usePostSingleEntry, postEntriesBulk } from '@/hooks/useJournalPosting';
import { formatCurrency }                      from '@/lib/currency';
import type { JournalEntrySourceType, PendingJournalEntry } from '@/types/journalReview';

const SOURCE_TYPE_KEYS: Record<JournalEntrySourceType, string> = {
  transaction:         'journalReview.sourceTypes.transaction',
  lease_payment:       'journalReview.sourceTypes.leasePayment',
  property_expense:    'journalReview.sourceTypes.propertyExpense',
  capital_transaction: 'journalReview.sourceTypes.capitalTransaction',
  settlement:          'journalReview.sourceTypes.settlement',
  manual:              'journalReview.sourceTypes.manual',
};

const SOURCE_TYPE_COLORS: Record<JournalEntrySourceType, string> = {
  transaction:         'bg-[#E8F0FB] text-[#1E5DC4]',
  lease_payment:       'bg-[#EBF5F0] text-[#1A7D4F]',
  property_expense:    'bg-[#FEF7EC] text-[#B45309]',
  capital_transaction: 'bg-slate-100 text-slate-600',
  settlement:          'bg-[#FEF0EF] text-[#C0392B]',
  manual:              'bg-slate-100 text-slate-500',
};

function SourceTypeBadge({ type }: { type: JournalEntrySourceType }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${SOURCE_TYPE_COLORS[type] ?? 'bg-slate-100 text-slate-500'}`}>
      {t(SOURCE_TYPE_KEYS[type] ?? 'journalReview.sourceTypes.manual')}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div dir="rtl" className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded" />
      <div className="h-4 w-64 bg-slate-100 rounded" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-36 bg-slate-100 rounded" />)}
      </div>
      <div className="border rounded-lg overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 border-b last:border-b-0 bg-slate-50 px-4 flex items-center gap-4">
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-4 flex-1 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JournalReviewPage() {
  const { t } = useTranslation();
  const { data: entries = [], isLoading, isError, refetch } = usePendingJournalEntries();

  const [expandedId,       setExpandedId]       = useState<string | null>(null);
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [accountSearch,    setAccountSearch]    = useState('');

  const queryClient        = useQueryClient();
  const postSingleMutation = usePostSingleEntry();

  const [confirmSingleId, setConfirmSingleId] = useState<string | null>(null);
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set());
  const [confirmBulk,     setConfirmBulk]     = useState(false);
  const [bulkProgress,    setBulkProgress]    = useState<{ current: number; total: number } | null>(null);
  const [isBulkPosting,   setIsBulkPosting]   = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [dateFrom, dateTo, sourceTypeFilter, accountSearch]);

  const filteredEntries = useMemo<PendingJournalEntry[]>(() => {
    const q = accountSearch.trim().toLowerCase();
    return entries.filter(entry => {
      if (dateFrom && entry.entry_date < dateFrom) return false;
      if (dateTo   && entry.entry_date > dateTo)   return false;
      if (sourceTypeFilter !== 'all' && entry.source_type !== sourceTypeFilter) return false;
      if (q) {
        const matches = entry.lines.some(
          l => l.account_code.toLowerCase().includes(q) || l.account_name.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [entries, dateFrom, dateTo, sourceTypeFilter, accountSearch]);

  const totalDebitSum   = useMemo(() => filteredEntries.reduce((s, e) => s + e.total_debit, 0),  [filteredEntries]);
  const unbalancedCount = useMemo(() => filteredEntries.filter(e => !e.is_balanced).length,       [filteredEntries]);

  const balancedIds = useMemo(
    () => new Set(filteredEntries.filter(e => e.is_balanced).map(e => e.id)),
    [filteredEntries]
  );
  const allBalancedSelected =
    balancedIds.size > 0 && [...balancedIds].every(id => selectedIds.has(id));

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(prev => new Set([...prev, ...balancedIds]));
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        balancedIds.forEach(id => next.delete(id));
        return next;
      });
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handleBulkPost() {
    const ids = [...selectedIds];
    setConfirmBulk(false);
    setIsBulkPosting(true);
    setBulkProgress({ current: 0, total: ids.length });

    const { posted, failed } = await postEntriesBulk(ids, (current, total) => {
      setBulkProgress({ current, total });
    });

    setIsBulkPosting(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['journal-entries-pending'] });
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });

    if (failed) {
      toast.error(t('journalReview.post.errorBulkPartial').replace('{ref}', failed));
    } else {
      toast.success(t('journalReview.post.successBulk').replace('{n}', String(posted)));
    }
  }

  function handleSingleConfirm() {
    if (!confirmSingleId) return;
    postSingleMutation.mutate(confirmSingleId, {
      onSettled: () => setConfirmSingleId(null),
    });
  }

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
        <p className="text-sm">{t('journalReview.error')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('journalReview.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{t('journalReview.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('journalReview.subtitle')}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="w-36 text-sm"
          placeholder={t('journalReview.filters.dateFrom')}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="w-36 text-sm"
          placeholder={t('journalReview.filters.dateTo')}
        />
        <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
          <SelectTrigger className="w-44 text-sm">
            <SelectValue placeholder={t('journalReview.filters.allSources')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('journalReview.filters.allSources')}</SelectItem>
            {(Object.keys(SOURCE_TYPE_KEYS) as JournalEntrySourceType[]).map(st => (
              <SelectItem key={st} value={st}>{t(SOURCE_TYPE_KEYS[st])}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={accountSearch}
          onChange={e => setAccountSearch(e.target.value)}
          className="w-48 text-sm"
          placeholder={t('journalReview.filters.accountSearch')}
        />
        {(dateFrom || dateTo || sourceTypeFilter !== 'all' || accountSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(''); setDateTo(''); setSourceTypeFilter('all'); setAccountSearch(''); }}
            className="text-xs text-slate-500"
          >
            {t('journalReview.filters.clearAll')}
          </Button>
        )}
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
        <span className="text-slate-600">
          {t('journalReview.summary.count', { count: filteredEntries.length })}
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-mono tabular-nums text-slate-700">
          {t('journalReview.summary.totalDebit')}: {formatCurrency(totalDebitSum, 'USD')}
        </span>
        {unbalancedCount > 0 && (
          <>
            <span className="text-slate-400">·</span>
            <span className="flex items-center gap-1 text-[#B45309] font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('journalReview.summary.unbalanced', { count: unbalancedCount })}
            </span>
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#E8F0FB] rounded-lg border border-[#B8CFF5]">
          <span className="text-sm text-[#1E5DC4] font-medium">
            {t('journalReview.post.selectedCount').replace('{n}', String(selectedIds.size))}
          </span>
          <Button
            size="sm"
            className="bg-[#1E5DC4] hover:bg-[#164399] text-white text-xs"
            onClick={() => setConfirmBulk(true)}
            disabled={isBulkPosting}
          >
            {isBulkPosting && bulkProgress
              ? t('journalReview.post.bulkProgress')
                  .replace('{i}', String(bulkProgress.current))
                  .replace('{n}', String(bulkProgress.total))
              : t('journalReview.post.bulkAction')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 text-xs"
            onClick={() => setSelectedIds(new Set())}
            disabled={isBulkPosting}
          >
            {t('journalReview.post.clearSelection')}
          </Button>
        </div>
      )}

      {/* Table or empty state */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
          <CheckCircle className="w-10 h-10 text-[#1A7D4F] opacity-60" />
          <p className="text-sm font-medium">{t('journalReview.empty.title')}</p>
          <p className="text-xs">{t('journalReview.empty.subtitle')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={allBalancedSelected}
                    onCheckedChange={(v) => handleSelectAll(Boolean(v))}
                    disabled={balancedIds.size === 0}
                    aria-label={t('journalReview.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500 w-8" />
                <th className="px-4 py-3 text-start font-medium text-slate-500">{t('journalReview.columns.date')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">{t('journalReview.columns.source')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">{t('journalReview.columns.description')}</th>
                <th className="px-4 py-3 text-end   font-medium text-slate-500">{t('journalReview.columns.debit')}</th>
                <th className="px-4 py-3 text-end   font-medium text-slate-500">{t('journalReview.columns.credit')}</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500">{t('journalReview.columns.balance')}</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500">{t('journalReview.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map(entry => (
                <React.Fragment key={entry.id}>
                  {/* Main row */}
                  <tr
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors
                      ${!entry.is_balanced ? 'bg-[#FEF0EF]' : ''}`}
                    onClick={() => toggleExpand(entry.id)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={(v) => handleSelectRow(entry.id, Boolean(v))}
                        disabled={!entry.is_balanced}
                        aria-label={t('journalReview.selectEntry')}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expandedId === entry.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{entry.entry_date}</td>
                    <td className="px-4 py-3">
                      <SourceTypeBadge type={entry.source_type} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                      {entry.reference_no
                        ? <span className="text-slate-400 text-xs me-2">{entry.reference_no}</span>
                        : null}
                      {entry.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-end font-mono tabular-nums text-slate-700">
                      {formatCurrency(entry.total_debit, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-end font-mono tabular-nums text-slate-700">
                      {formatCurrency(entry.total_credit, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.is_balanced ? (
                        <span className="text-[#1A7D4F] text-xs font-medium">{t('journalReview.balanced')}</span>
                      ) : (
                        <span className="text-[#C0392B] text-xs font-medium flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t('journalReview.unbalanced')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                disabled={!entry.is_balanced || postSingleMutation.isPending}
                                onClick={() => setConfirmSingleId(entry.id)}
                              >
                                {t('journalReview.action.post')}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!entry.is_balanced && (
                            <TooltipContent>
                              <p className="text-xs">{t('journalReview.post.disabledUnbalanced')}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  </tr>

                  {/* Expanded lines row */}
                  {expandedId === entry.id && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={9} className="px-6 py-3">
                        {entry.lines.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2">{t('journalReview.noLines')}</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-200">
                                <th className="pb-1.5 text-start font-medium">{t('journalReview.lineColumns.code')}</th>
                                <th className="pb-1.5 text-start font-medium">{t('journalReview.lineColumns.account')}</th>
                                <th className="pb-1.5 text-start font-medium">{t('journalReview.lineColumns.description')}</th>
                                <th className="pb-1.5 text-end  font-medium">{t('journalReview.lineColumns.debit')}</th>
                                <th className="pb-1.5 text-end  font-medium">{t('journalReview.lineColumns.credit')}</th>
                                <th className="pb-1.5 text-start font-medium">{t('journalReview.lineColumns.currency')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {entry.lines.map(line => (
                                <tr key={line.id} className="text-slate-600">
                                  <td className="py-1.5 font-mono">{line.account_code}</td>
                                  <td className="py-1.5">{line.account_name}</td>
                                  <td className="py-1.5 text-slate-400">{line.description ?? '—'}</td>
                                  <td className="py-1.5 text-end font-mono tabular-nums">
                                    {line.debit_amount > 0 ? formatCurrency(line.debit_amount, line.currency) : '—'}
                                  </td>
                                  <td className="py-1.5 text-end font-mono tabular-nums">
                                    {line.credit_amount > 0 ? formatCurrency(line.credit_amount, line.currency) : '—'}
                                  </td>
                                  <td className="py-1.5 text-slate-400">{line.currency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single-entry confirmation */}
      <AlertDialog
        open={confirmSingleId !== null}
        onOpenChange={(open) => { if (!open) setConfirmSingleId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>{t('journalReview.post.confirmSingleTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('journalReview.post.confirmSingleBody')
                .replace('{ref}', confirmSingleId?.slice(0, 8) ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              onClick={handleSingleConfirm}
              disabled={postSingleMutation.isPending}
            >
              {t('journalReview.action.post')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk posting confirmation */}
      <AlertDialog
        open={confirmBulk}
        onOpenChange={(open) => { if (!open) setConfirmBulk(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>
              {t('journalReview.post.confirmBulkTitle')
                .replace('{n}', String(selectedIds.size))}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('journalReview.post.confirmBulkBody')
                .replace('{n}', String(selectedIds.size))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#1E5DC4] hover:bg-[#164399] text-white"
              onClick={handleBulkPost}
            >
              {t('journalReview.post.confirmBulkAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
