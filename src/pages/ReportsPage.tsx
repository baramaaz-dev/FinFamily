import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';
import PLReportSection from '../components/reports/PLReportSection';
import EquityReportSection from '../components/reports/EquityReportSection';
import PartnerStatementSection from '../components/reports/PartnerStatementSection';
import BalanceSheetSection from '../components/reports/BalanceSheetSection';
import { ROUTES } from '@/router/routes';

type ReportTab = 'pl' | 'equity' | 'partnerStatement' | 'balance';

const TABS: ReportTab[] = ['pl', 'equity', 'partnerStatement', 'balance'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

      {/* Trial balance shortcut card */}
      <div className="pb-2">
        <button
          onClick={() => navigate(ROUTES.TRIAL_BALANCE)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-right w-full sm:w-auto"
        >
          <Scale className="h-5 w-5 text-[#1E5DC4] shrink-0" />
          <span className="text-sm font-medium text-slate-700">{t('trialBalance.title')}</span>
        </button>
      </div>

      {activeTab === 'pl' && <PLReportSection />}
      {activeTab === 'equity' && <EquityReportSection />}
      {activeTab === 'partnerStatement' && <PartnerStatementSection />}
      {activeTab === 'balance' && <BalanceSheetSection />}
      {activeTab !== 'pl' && activeTab !== 'equity' && activeTab !== 'partnerStatement' && activeTab !== 'balance' && (
        <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
          {t('reports.tabs.comingSoon')}
        </div>
      )}
    </div>
  );
}
