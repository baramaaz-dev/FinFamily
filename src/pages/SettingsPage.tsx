import { useTranslation }    from 'react-i18next';
import { NavLink, Outlet }   from 'react-router-dom';
import { BookOpen }          from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
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
      </nav>

      <Outlet />
    </div>
  );
}
