import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageErrorFallbackProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export default function PageErrorFallback({
  title,
  message,
  retryLabel,
  onRetry,
}: PageErrorFallbackProps) {
  const { t } = useTranslation();

  const resolvedTitle     = title     ?? t('errors.boundary.title');
  const resolvedMessage   = message   ?? t('errors.boundary.message');
  const resolvedRetryLabel = retryLabel ?? t('errors.boundary.retry');

  function handleRetry() {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-[#FEF0EF]">
      <AlertTriangle size={48} className="text-[#C0392B]" />
      <h2 className="text-[#C0392B] text-lg font-medium text-center">{resolvedTitle}</h2>
      <p className="text-[#475569] text-sm text-center max-w-sm">{resolvedMessage}</p>
      <Button
        variant="default"
        className="bg-[#1E5DC4] hover:bg-[#164399] text-white mt-2"
        onClick={handleRetry}
      >
        {resolvedRetryLabel}
      </Button>
    </div>
  );
}
