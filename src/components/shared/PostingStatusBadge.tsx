import { useTranslation } from 'react-i18next';

interface PostingStatusBadgeProps {
  journalEntryId: string | null;
}

export function PostingStatusBadge({ journalEntryId }: PostingStatusBadgeProps) {
  const { t } = useTranslation();
  const isPosted = journalEntryId !== null;

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        isPosted
          ? 'bg-[#EBF5F0] text-[#1A7D4F]'
          : 'bg-[#F1F5F9] text-[#94A3B8]'
      }`}
    >
      {isPosted
        ? t('capital.statement.postingStatus.posted')
        : t('capital.statement.postingStatus.unposted')}
    </span>
  );
}
