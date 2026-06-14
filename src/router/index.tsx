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
import CompanySettingsPage     from '@/pages/CompanySettingsPage';
import CapitalAccountsPage     from '@/pages/CapitalAccountsPage';
import CapitalStatementPage    from '@/pages/CapitalStatementPage';
import JournalPage             from '@/pages/JournalPage';
import JournalReviewPage       from '@/pages/JournalReviewPage';
import TrialBalancePage        from '@/pages/TrialBalancePage';
import AccountingPeriodsPage   from '@/pages/AccountingPeriodsPage';
import SettlementsPage         from '@/pages/SettlementsPage';
import SettlementDetailPage    from '@/pages/SettlementDetailPage';
import LoginPage               from '@/pages/LoginPage';
import NotFoundPage            from '@/pages/NotFoundPage';
import ErrorBoundary           from '@/components/ui/ErrorBoundary';

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
          { index: true,                element: <ErrorBoundary><DashboardPage /></ErrorBoundary> },
          { path: 'transactions',       element: <ErrorBoundary><TransactionsPage /></ErrorBoundary> },
          { path: 'portfolios',         element: <ErrorBoundary><PortfoliosPage /></ErrorBoundary> },
          { path: 'portfolios/:id',     element: <ErrorBoundary><PortfolioDetailPage /></ErrorBoundary> },
          { path: 'properties',         element: <ErrorBoundary><PropertiesPage /></ErrorBoundary> },
          { path: 'properties/:id',     element: <ErrorBoundary><PropertyOwnershipPage /></ErrorBoundary> },
          { path: 'partners',           element: <ErrorBoundary><PartnersPage /></ErrorBoundary> },
          { path: 'partners/:id',       element: <ErrorBoundary><PartnerDetailPage /></ErrorBoundary> },
          { path: 'journal',             element: <ErrorBoundary><JournalPage /></ErrorBoundary> },
          { path: 'journal-review',     element: <ErrorBoundary><JournalReviewPage /></ErrorBoundary> },
          { path: 'reports',            element: <ErrorBoundary><ReportsPage /></ErrorBoundary> },
          { path: 'reports/trial-balance', element: <ErrorBoundary><TrialBalancePage /></ErrorBoundary> },
          { path: 'capital',            element: <ErrorBoundary><CapitalAccountsPage /></ErrorBoundary> },
          { path: 'capital/:accountId', element: <ErrorBoundary><CapitalStatementPage /></ErrorBoundary> },
          { path: 'settlements',               element: <ErrorBoundary><SettlementsPage /></ErrorBoundary> },
          { path: 'settlements/:settlementId', element: <ErrorBoundary><SettlementDetailPage /></ErrorBoundary> },
          {
            path: 'settings',
            element: <ErrorBoundary><SettingsPage /></ErrorBoundary>,
            children: [
              { index: true,            element: <ErrorBoundary><PeoplePage /></ErrorBoundary> },
              { path: 'people',         element: <ErrorBoundary><PeoplePage /></ErrorBoundary> },
              { path: 'exchange-rates', element: <ErrorBoundary><ExchangeRatesPage /></ErrorBoundary> },
              { path: 'accounts',       element: <ErrorBoundary><AccountsPage /></ErrorBoundary> },
              { path: 'company',        element: <ErrorBoundary><CompanySettingsPage /></ErrorBoundary> },
              { path: 'periods',        element: <ErrorBoundary><AccountingPeriodsPage /></ErrorBoundary> },
            ],
          },
          { path: '*',                  element: <ErrorBoundary><NotFoundPage /></ErrorBoundary> },
        ],
      },
    ],
  },
]);
