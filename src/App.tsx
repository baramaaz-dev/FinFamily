import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

import AppLayout        from '@/components/layout/AppLayout'
import LoginPage        from '@/pages/settings/LoginPage'
import DashboardPage    from '@/pages/dashboard/DashboardPage'
import TransactionsPage from '@/pages/transactions/TransactionsPage'
import PortfoliosPage   from '@/pages/portfolios/PortfoliosPage'
import PropertiesPage   from '@/pages/properties/PropertiesPage'
import PartnersPage     from '@/pages/partners/PartnersPage'
import ReportsPage      from '@/pages/reports/ReportsPage'
import SettingsPage     from '@/pages/settings/SettingsPage'

interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return session ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index              element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="portfolios"   element={<PortfoliosPage />} />
          <Route path="properties"   element={<PropertiesPage />} />
          <Route path="partners"     element={<PartnersPage />} />
          <Route path="reports"      element={<ReportsPage />} />
          <Route path="settings"     element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
