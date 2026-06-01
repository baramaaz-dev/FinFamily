import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut } from 'lucide-react';
import { useDirection } from '@/hooks/useDirection';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/routes';

/** Map from route path to i18n title key. */
const ROUTE_TITLE_KEYS: Record<string, string> = {
  [ROUTES.DASHBOARD]:    'pages.dashboard.title',
  [ROUTES.TRANSACTIONS]: 'pages.transactions.title',
  [ROUTES.PORTFOLIOS]:   'pages.portfolios.title',
  [ROUTES.PROPERTIES]:   'pages.properties.title',
  [ROUTES.PARTNERS]:     'pages.partners.title',
  [ROUTES.REPORTS]:      'pages.reports.title',
  [ROUTES.SETTINGS]:     'pages.settings.title',
};

function resolvePageTitleKey(pathname: string): string {
  if (ROUTE_TITLE_KEYS[pathname]) return ROUTE_TITLE_KEYS[pathname];

  // Longest-prefix match, excluding '/' to prevent it matching everything
  const prefixKey = Object.keys(ROUTE_TITLE_KEYS)
    .filter(k => k !== ROUTES.DASHBOARD && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];

  return prefixKey ? ROUTE_TITLE_KEYS[prefixKey] : '';
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t }                   = useTranslation();
  const { pathname }            = useLocation();
  const { toggleLanguage }      = useDirection();
  const { session, logout }     = useAuthStore();
  const navigate                = useNavigate();

  const titleKey  = resolvePageTitleKey(pathname);
  const pageTitle = titleKey ? t(titleKey) : '';

  const handleSignOut = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const userInitial = session?.user?.email?.charAt(0).toUpperCase() ?? 'م';

  return (
    <header className="sticky top-0 z-10 h-14 bg-background border-b border-[#E2E8F0] flex items-center justify-between px-4">
      {/* Start side: mobile hamburger + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          aria-label={t('nav.expand')}
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <h1 className="text-base font-medium text-foreground">{pageTitle}</h1>
        )}
      </div>

      {/* End side: language toggle + avatar */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1 rounded-md text-sm font-medium text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
        >
          {t('language.toggle')}
        </button>

        <button
          onClick={handleSignOut}
          aria-label={t('auth.signOut')}
          className="w-8 h-8 rounded-full bg-[#E8F0FB] text-[#1E5DC4] flex items-center
                     justify-center text-sm font-medium select-none
                     hover:bg-[#B8CFF5] transition-colors cursor-pointer"
        >
          {userInitial}
        </button>
      </div>
    </header>
  );
}

