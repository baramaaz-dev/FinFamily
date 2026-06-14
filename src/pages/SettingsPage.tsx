import { useState }            from 'react';
import { useTranslation }       from 'react-i18next';
import { NavLink, Outlet }      from 'react-router-dom';
import { BookOpen, Building2, CalendarDays } from 'lucide-react';
import { useQueryClient }       from '@tanstack/react-query';
import { toast }                from 'sonner';
import { Button }               from '@/components/ui/button';
import { Input }                from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
}                               from '@/components/ui/dialog';
import { resetAllTransactionalData } from '@/lib/supabase/devReset';

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [confirmText,     setConfirmText]     = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting,     setIsResetting]     = useState(false);

  async function handleReset() {
    if (confirmText !== t('devReset.confirmKeyword')) return;
    setIsResetting(true);
    try {
      await resetAllTransactionalData();
      queryClient.invalidateQueries();
      toast.success(t('devReset.successToast'));
      setShowResetDialog(false);
      setConfirmText('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('devReset.errorToast') + ': ' + msg);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0F172A]">{t('pages.settings.title')}</h1>

      <nav className="flex gap-1 border-b border-[#E2E8F0] mb-6 mt-4">
        <NavLink
          to="/settings/people"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]'
            }`
          }
        >
          {t('settings.people')}
        </NavLink>
        <NavLink
          to="/settings/exchange-rates"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]'
            }`
          }
        >
          {t('settings.exchangeRates')}
        </NavLink>
        <NavLink
          to="/settings/accounts"
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]'
            }`
          }
        >
          <BookOpen size={16} />
          {t('settings.accounts.title')}
        </NavLink>
        <NavLink
          to="/settings/company"
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]'
            }`
          }
        >
          <Building2 size={16} />
          {t('settings.company.title')}
        </NavLink>
        <NavLink
          to="/settings/periods"
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]'
            }`
          }
        >
          <CalendarDays size={16} />
          {t('periodClosing.pageTitle')}
        </NavLink>
      </nav>

      <Outlet />

      {/* ══════════════════════════════════════════════════════════
          DEV ONLY — REMOVE BEFORE PRODUCTION
          ══════════════════════════════════════════════════════════ */}
      <div className="mt-8 border-2 border-dashed border-[#C0392B] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#C0392B] text-white">
            DEV ONLY
          </span>
          <h3 className="text-base font-medium text-[#C0392B]">
            {t('devReset.sectionTitle')}
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {t('devReset.sectionDescription')}
        </p>

        <div className="bg-[#FEF0EF] border border-[#F5B9B5] rounded-md p-3 mb-4 text-xs text-[#C0392B] space-y-1">
          <p className="font-medium">{t('devReset.warningTitle')}</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t('devReset.warningPoint1')}</li>
            <li>{t('devReset.warningPoint2')}</li>
            <li>{t('devReset.warningPoint3')}</li>
          </ul>
        </div>

        <Button
          variant="outline"
          className="border-[#C0392B] text-[#C0392B] hover:bg-[#FEF0EF]"
          onClick={() => { setConfirmText(''); setShowResetDialog(true); }}
        >
          {t('devReset.buttonLabel')}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={showResetDialog}
        onOpenChange={(open) => { if (!open) { setShowResetDialog(false); setConfirmText(''); } }}
      >
        <DialogContent dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[#C0392B]">
              {t('devReset.dialogTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-[#FEF0EF] border border-[#F5B9B5] rounded-md p-3 text-sm text-[#C0392B]">
            {t('devReset.dialogWarning')}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-700">
              {t('devReset.confirmLabel')}
              <span className="font-mono font-bold text-[#C0392B] mx-1">
                {t('devReset.confirmKeyword')}
              </span>
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('devReset.confirmKeyword')}
              className="text-sm font-mono"
              dir="rtl"
            />
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="ghost"
              onClick={() => { setShowResetDialog(false); setConfirmText(''); }}
              disabled={isResetting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-[#C0392B] hover:bg-[#922B21] text-white"
              onClick={handleReset}
              disabled={confirmText !== t('devReset.confirmKeyword') || isResetting}
            >
              {isResetting ? t('devReset.resetting') : t('devReset.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
