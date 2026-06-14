import { useTranslation } from 'react-i18next';

interface PostingStatusBadgeProps {
  journalEntryId: string | null;
}

export function PostingStatusBadge({ journalEntryId }: PostingStatusBadgeProps) {
  const { t } = useTranslation();
  const hasDraftEntry = journalEntryId !== null;

  if (hasDraftEntry) {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-[#B45309] bg-[#FEF7EC]">
        {t('journal.status.draft')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100">
      {t('journal.status.noEntry')}
    </span>
  );
}
