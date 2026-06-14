import { useState }         from 'react';
import { useQuery }          from '@tanstack/react-query';
import { useTranslation }    from 'react-i18next';
import { Lock }              from 'lucide-react';
import { toast }             from 'sonner';
import { supabaseClient }    from '@/lib/supabase';
import type { AccountingPeriod } from '@/types';
import { Button }            from '@/components/ui/button';
import { Input }             from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
}                            from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
}                            from '@/components/ui/dialog';
import {
  useClosePeriod, useReopenPeriod, useLockPeriod,
  getPendingDraftCount, hasOtherOpenPeriod,
}                            from '@/hooks/usePeriodClosing';

async function fetchAccountingPeriods(): Promise<AccountingPeriod[]> {
  const { data, error } = await supabaseClient
    .from('accounting_periods')
    .select('id, fiscal_year, period_number, name, start_date, end_date, status, created_at, closed_at, locked_at, closing_entry_id')
    .order('fiscal_year',   { ascending: false })
    .order('period_number', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AccountingPeriod[];
}

type PeriodAction = { type: 'close' | 'reopen' | 'lock'; period: AccountingPeriod };

export default function AccountingPeriodsPage() {
  const { t } = useTranslation();

  // ── All hooks unconditional ──────────────────────────────────────────────
  const { data: periods = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['accounting-periods'],
    queryFn:  fetchAccountingPeriods,
    staleTime: 30_000,
  });

  const closeMutation  = useClosePeriod();
  const reopenMutation = useReopenPeriod();
  const lockMutation   = useLockPeriod();

  const [pendingAction,        setPendingAction]        = useState<PeriodAction | null>(null);
  const [lockConfirmText,      setLockConfirmText]      = useState('');
  const [isCheckingPreFlight,  setIsCheckingPreFlight]  = useState(false);

  // ── Status badge ─────────────────────────────────────────────────────────
  function periodStatusBadge(status: string) {
    if (status === 'open') return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#1A7D4F]">
        {t('periodClosing.status.open')}
      </span>
    );
    if (status === 'closed') return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF7EC] text-[#B45309]">
        {t('periodClosing.status.closed')}
      </span>
    );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF0EF] text-[#C0392B]">
        {t('periodClosing.status.locked')}
      </span>
    );
  }

  // ── Pre-flight handlers ──────────────────────────────────────────────────
  async function handleCloseClick(period: AccountingPeriod) {
    setIsCheckingPreFlight(true);
    try {
      const count = await getPendingDraftCount(period.start_date, period.end_date);
      if (count > 0) {
        toast.error(
          t('periodClosing.closeBlockedDrafts').replace('{count}', String(count))
        );
        return;
      }
      setPendingAction({ type: 'close', period });
    } finally {
      setIsCheckingPreFlight(false);
    }
  }

  async function handleReopenClick(period: AccountingPeriod) {
    setIsCheckingPreFlight(true);
    try {
      const blocked = await hasOtherOpenPeriod(period.id);
      if (blocked) {
        toast.error(t('periodClosing.reopenBlockedOtherOpen'));
        return;
      }
      setPendingAction({ type: 'reopen', period });
    } finally {
      setIsCheckingPreFlight(false);
    }
  }

  function handleLockClick(period: AccountingPeriod) {
    setLockConfirmText('');
    setPendingAction({ type: 'lock', period });
  }

  function handleConfirm() {
    if (!pendingAction) return;
    const { type, period } = pendingAction;

    if (type === 'close') {
      closeMutation.mutate(period.id, { onSettled: () => setPendingAction(null) });
    } else if (type === 'reopen') {
      reopenMutation.mutate(period.id, { onSettled: () => setPendingAction(null) });
    } else if (type === 'lock') {
      lockMutation.mutate(
        {
          periodId:   period.id,
          periodName: period.name,
          startDate:  period.start_date,
          endDate:    period.end_date,
        },
        {
          onSettled: () => {
            setPendingAction(null);
            setLockConfirmText('');
          },
        }
      );
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-slate-800">{t('periodClosing.pageTitle')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('periodClosing.pageSubtitle')}</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <p className="text-sm">{t('common.error')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('journalReview.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-xs">
                <th className="px-4 py-3 text-right font-medium">{t('periodClosing.colName')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('periodClosing.colDates')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('periodClosing.colStatus')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('periodClosing.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                    لا توجد فترات محاسبية
                  </td>
                </tr>
              ) : (
                periods.map(period => (
                  <tr key={period.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{period.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        {period.fiscal_year} / {period.period_number}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {period.start_date} — {period.end_date}
                    </td>
                    <td className="px-4 py-3">
                      {periodStatusBadge(period.status)}
                    </td>
                    <td className="px-4 py-3">
                      {period.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#B45309] text-[#B45309] hover:bg-[#FEF7EC]"
                          onClick={() => handleCloseClick(period)}
                          disabled={isCheckingPreFlight || closeMutation.isPending}
                        >
                          {t('periodClosing.action.close')}
                        </Button>
                      )}

                      {period.status === 'closed' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleReopenClick(period)}
                            disabled={isCheckingPreFlight || reopenMutation.isPending}
                          >
                            {t('periodClosing.action.reopen')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-[#C0392B] text-[#C0392B] hover:bg-[#FEF0EF]"
                            onClick={() => handleLockClick(period)}
                            disabled={lockMutation.isPending}
                          >
                            {t('periodClosing.action.lock')}
                          </Button>
                        </div>
                      )}

                      {period.status === 'locked' && (
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5 text-[#C0392B]" />
                          <span className="text-xs text-slate-400">
                            {period.closing_entry_id
                              ? t('periodClosing.closingEntryRef')
                                  .replace('{ref}', period.closing_entry_id.slice(0, 8))
                              : t('periodClosing.noActivity')}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Close / Reopen AlertDialog ── */}
      {pendingAction && pendingAction.type !== 'lock' && (
        <AlertDialog open onOpenChange={() => setPendingAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader className="text-right">
              <AlertDialogTitle>
                {pendingAction.type === 'close'
                  ? t('periodClosing.closeDialog.title').replace('{name}', pendingAction.period.name)
                  : t('periodClosing.reopenDialog.title').replace('{name}', pendingAction.period.name)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingAction.type === 'close'
                  ? t('periodClosing.closeDialog.body')
                  : t('periodClosing.reopenDialog.body')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel onClick={() => setPendingAction(null)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                className={
                  pendingAction.type === 'close'
                    ? 'bg-[#B45309] hover:bg-[#854009] text-white'
                    : ''
                }
                onClick={handleConfirm}
                disabled={closeMutation.isPending || reopenMutation.isPending}
              >
                {pendingAction.type === 'close'
                  ? t('periodClosing.action.close')
                  : t('periodClosing.action.reopen')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ── Lock Dialog (requires text confirmation) ── */}
      {pendingAction && pendingAction.type === 'lock' && (
        <Dialog
          open
          onOpenChange={() => { setPendingAction(null); setLockConfirmText(''); }}
        >
          <DialogContent
            dir="rtl"
            className="max-w-md"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {t('periodClosing.lockDialog.title').replace('{name}', pendingAction.period.name)}
              </DialogTitle>
            </DialogHeader>

            {/* Warning banner */}
            <div className="bg-[#FEF0EF] border border-[#F5B9B5] rounded-md p-3 text-sm text-[#C0392B] space-y-1">
              <p className="font-medium">{t('periodClosing.lockDialog.warningTitle')}</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>{t('periodClosing.lockDialog.warningPoint1')}</li>
                <li>{t('periodClosing.lockDialog.warningPoint2')}</li>
              </ul>
            </div>

            {/* Name confirmation */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-700">
                {t('periodClosing.lockDialog.confirmLabel')}
                <span className="font-mono font-medium text-slate-900 mr-1">
                  {pendingAction.period.name}
                </span>
              </label>
              <Input
                value={lockConfirmText}
                onChange={e => setLockConfirmText(e.target.value)}
                placeholder={pendingAction.period.name}
                className="text-sm"
                dir="ltr"
              />
            </div>

            <DialogFooter className="flex-row-reverse gap-2">
              <Button
                variant="ghost"
                onClick={() => { setPendingAction(null); setLockConfirmText(''); }}
                disabled={lockMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="bg-[#C0392B] hover:bg-[#922B21] text-white"
                onClick={handleConfirm}
                disabled={
                  lockConfirmText !== pendingAction.period.name ||
                  lockMutation.isPending
                }
              >
                {lockMutation.isPending
                  ? t('periodClosing.lockDialog.locking')
                  : t('periodClosing.action.lock')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
