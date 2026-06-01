import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDirection } from '@/hooks/useDirection';
import { navItems } from './navItems';

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
}

export default function Sidebar({ collapsed, toggle }: SidebarProps) {
  const { t }      = useTranslation();
  const { isRTL }  = useDirection();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-20',
        'hidden md:flex flex-col',
        'bg-card border-e border-[#E2E8F0]',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-[260px]',
      )}
    >
      {/* Brand block */}
      <div
        className={cn(
          'flex items-center h-14 shrink-0 border-b border-[#E2E8F0]',
          collapsed ? 'justify-center' : 'gap-2 px-4',
        )}
      >
        <Building2 className="w-6 h-6 text-[#1E5DC4] shrink-0" />
        {!collapsed && (
          <span className="font-medium text-lg text-foreground">FinFamily</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {navItems.map(({ labelKey, icon: Icon, href, exactMatch }) => (
          <NavLink
            key={href}
            to={href}
            end={exactMatch}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-[#E8F0FB] text-[#1E5DC4]'
                  : 'text-[#475569] hover:bg-[#F1F5F9]',
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[#E2E8F0]">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full p-2 rounded-md text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {/*
           * ChevronRight rotated based on direction + collapsed state.
           * Formula: `isRTL !== collapsed` → rotate-0 (points →), else rotate-180 (points ←)
           * RTL expanded  (isRTL=T, collapsed=F): T≠F=T  → rotate-0  (→ toward sidebar on right)
           * RTL collapsed (isRTL=T, collapsed=T): T≠T=F  → rotate-180 (← away from sidebar)
           * LTR expanded  (isRTL=F, collapsed=F): F≠F=F  → rotate-180 (← toward sidebar on left)
           * LTR collapsed (isRTL=F, collapsed=T): F≠T=T  → rotate-0  (→ away from sidebar)
           */}
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform duration-300',
              isRTL !== collapsed ? 'rotate-0' : 'rotate-180',
            )}
          />
        </button>
      </div>
    </aside>
  );
}
