import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation }  from 'react-i18next';
import { ROUTES }          from '@/router/routes';

export default function JournalPage() {
  const { t } = useTranslation();

  const tabs = [
    { to: ROUTES.JOURNAL_ENTRY,  label: t('nav.journalEntry')  },
    { to: ROUTES.JOURNAL_REVIEW, label: t('nav.journalReview') },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0F172A]">{t('nav.journal')}</h1>

      <nav className="flex gap-1 border-b border-[#E2E8F0] mb-6 mt-4">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[#1E5DC4] text-[#1E5DC4]'
                  : 'border-transparent text-[#475569] hover:text-[#1E293B]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
