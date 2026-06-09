import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PLReportSection from '../components/reports/PLReportSection';

type ReportTab = 'pl' | 'equity' | 'partnerStatement' | 'balance';

const TABS: ReportTab[] = ['pl', 'equity', 'partnerStatement', 'balance'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReportTab>('pl');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-medium text-[#0F172A]">{t('reports.title')}</h1>

      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-[#1E5DC4] text-[#1E5DC4]'
                : 'border-transparent text-[#475569] hover:text-[#1E293B]',
            ].join(' ')}
          >
            {t(`reports.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'pl' && <PLReportSection />}
      {activeTab !== 'pl' && (
        <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
          {t('reports.tabs.comingSoon')}
        </div>
      )}
    </div>
  );
}
