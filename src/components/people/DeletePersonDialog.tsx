import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { Person } from '@/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogOverlay,
  AlertDialogPortal,
} from '@/components/ui/alert-dialog';

export type DependencyMap = {
  portfolios:      number;
  properties:      number;
  capitalAccounts: number;
  distributions:   number;
  settlements:     number;
};

interface DeletePersonDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  person:        Person | null;
  mode:          'confirm' | 'blocked';
  dependencies?: DependencyMap;
  onConfirm:     () => Promise<void>;
  isDeleting:    boolean;
}

export function DeletePersonDialog({
  open,
  onOpenChange,
  person,
  mode,
  dependencies,
  onConfirm,
  isDeleting,
}: DeletePersonDialogProps) {
  const { t } = useTranslation();

  if (!person) return null;

  if (mode === 'blocked') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {/* Custom portal: clickable overlay lets user dismiss blocked info dialog */}
        <AlertDialogPortal>
          <AlertDialogOverlay onClick={() => onOpenChange(false)} className="cursor-default" />
          <AlertDialogContent className="w-full max-w-md border-[#E2E8F0] bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-medium text-[#1E293B]">
                {t('people.delete.blockedTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-[#475569]">
                {t('people.delete.blockedDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {dependencies && (
              <div className="mt-3 flex flex-col gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
                {dependencies.portfolios > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#1E293B]">
                      {dependencies.portfolios}
                    </span>
                    <span className="text-[#475569]">
                      {t('people.delete.depPortfolios')}
                    </span>
                  </div>
                )}
                {dependencies.properties > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#1E293B]">
                      {dependencies.properties}
                    </span>
                    <span className="text-[#475569]">
                      {t('people.delete.depProperties')}
                    </span>
                  </div>
                )}
                {dependencies.capitalAccounts > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#1E293B]">
                      {dependencies.capitalAccounts}
                    </span>
                    <span className="text-[#475569]">
                      {t('people.delete.depCapitalAccounts')}
                    </span>
                  </div>
                )}
                {dependencies.distributions > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#1E293B]">
                      {dependencies.distributions}
                    </span>
                    <span className="text-[#475569]">
                      {t('people.delete.depDistributions')}
                    </span>
                  </div>
                )}
                {dependencies.settlements > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#1E293B]">
                      {dependencies.settlements}
                    </span>
                    <span className="text-[#475569]">
                      {t('people.delete.depSettlements')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <AlertDialogFooter className="mt-2">
              <button
                type="button"
                className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9]"
                onClick={() => onOpenChange(false)}
              >
                {t('people.delete.closeButton')}
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-md border-[#E2E8F0] bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-medium text-[#1E293B]">
            {t('people.delete.confirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#475569]">
            {t('people.delete.confirmDescription').replace('{name}', person.name)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 gap-2 sm:gap-0">
          <button
            type="button"
            className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#475569] hover:bg-[#F1F5F9]"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('people.delete.cancelButton')}
          </button>
          <button
            type="button"
            className="flex items-center rounded-md bg-[#C0392B] px-4 py-2 text-sm text-white hover:bg-[#922B21] disabled:opacity-50"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {t('people.delete.confirmButton')}
            {isDeleting && (
              <Loader2 className="animate-spin h-4 w-4 ms-2" />
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
