import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Briefcase,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Landmark,
} from 'lucide-react'

const navItems = [
  { to: '/',              label: 'لوحة التحكم',    icon: LayoutDashboard },
  { to: '/transactions',  label: 'المعاملات',       icon: ArrowLeftRight  },
  { to: '/portfolios',    label: 'المحافظ',          icon: Briefcase       },
  { to: '/properties',   label: 'العقارات',          icon: Building2       },
  { to: '/partners',     label: 'الشركاء',           icon: Users           },
  { to: '/reports',      label: 'التقارير',          icon: BarChart3       },
  { to: '/settings',     label: 'الإعدادات',         icon: Settings        },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white border-l border-gray-200 transition-all duration-300 shadow-sm',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-blue-600 shrink-0" />
              <span className="font-bold text-gray-800 text-lg">FinFamily</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
              'text-red-500 hover:bg-red-50 transition-colors'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
