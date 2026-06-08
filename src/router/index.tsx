import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute          from '@/components/auth/ProtectedRoute';
import AppLayout               from '@/layouts/AppLayout';
import DashboardPage           from '@/pages/DashboardPage';
import TransactionsPage        from '@/pages/TransactionsPage';
import PortfoliosPage          from '@/pages/PortfoliosPage';
import PortfolioDetailPage     from '@/pages/PortfolioDetailPage';
import PropertiesPage          from '@/pages/PropertiesPage';
import PropertyOwnershipPage   from '@/pages/PropertyOwnershipPage';
import PartnersPage            from '@/pages/PartnersPage';
import PartnerDetailPage       from '@/pages/PartnerDetailPage';
import ReportsPage             from '@/pages/ReportsPage';
import SettingsPage            from '@/pages/SettingsPage';
import PeoplePage              from '@/pages/PeoplePage';
import ExchangeRatesPage       from '@/pages/ExchangeRatesPage';
import AccountsPage            from '@/pages/AccountsPage';
import CapitalAccountsPage     from '@/pages/CapitalAccountsPage';
import CapitalStatementPage    from '@/pages/CapitalStatementPage';
import SettlementsPage         from '@/pages/SettlementsPage';
import LoginPage               from '@/pages/LoginPage';
import NotFoundPage            from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true,                element: <DashboardPage /> },
          { path: 'transactions',       element: <TransactionsPage /> },
          { path: 'portfolios',         element: <PortfoliosPage /> },
          { path: 'portfolios/:id',     element: <PortfolioDetailPage /> },
          { path: 'properties',         element: <PropertiesPage /> },
          { path: 'properties/:id',     element: <PropertyOwnershipPage /> },
          { path: 'partners',           element: <PartnersPage /> },
          { path: 'partners/:id',       element: <PartnerDetailPage /> },
          { path: 'reports',            element: <ReportsPage /> },
          { path: 'capital',            element: <CapitalAccountsPage /> },
          { path: 'capital/:accountId', element: <CapitalStatementPage /> },
          { path: 'settlements',        element: <SettlementsPage /> },
          {
            path: 'settings',
            element: <SettingsPage />,
            children: [
              { index: true,            element: <PeoplePage /> },
              { path: 'people',         element: <PeoplePage /> },
              { path: 'exchange-rates', element: <ExchangeRatesPage /> },
              { path: 'accounts',      element: <AccountsPage /> },
            ],
          },
          { path: '*',                  element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
