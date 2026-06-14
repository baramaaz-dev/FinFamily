import { useTranslation } from 'react-i18next';

interface PostingStatusBadgeProps {
  journalEntryId: string | null;
  journalStatus?: string | null;
}

export function PostingStatusBadge({ journalEntryId, journalStatus }: PostingStatusBadgeProps) {
  const { t } = useTranslation();

  if (!journalEntryId) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#F1F5F9] text-[#94A3B8]">
        {t('capital.statement.postingStatus.unposted')}
      </span>
    );
  }

  if (journalStatus === 'posted') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#EBF5F0] text-[#1A7D4F]">
        {t('capital.statement.postingStatus.posted')}
      </span>
    );
  }

  if (journalStatus === 'reversed') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#FEF0EF] text-[#C0392B]">
        {t('capital.statement.postingStatus.reversed')}
      </span>
    );
  }

  // draft or unknown — default to pending
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#FEF7EC] text-[#B45309]">
      {t('capital.statement.postingStatus.pending')}
    </span>
  );
}
