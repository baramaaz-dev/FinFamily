import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDirection } from '@/hooks/useDirection';
import { useSidebarState } from '@/hooks/useSidebarState';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileSidebar from './components/MobileSidebar';

export default function AppLayout() {
  const { direction }      = useDirection();
  const { collapsed, toggle } = useSidebarState();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={direction}>
      {/* Fixed desktop sidebar */}
      <Sidebar collapsed={collapsed} toggle={toggle} />

      {/* Scrollable main column — offset to clear the fixed sidebar */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          'ms-0', // mobile: no sidebar offset
          collapsed ? 'md:ms-16' : 'md:ms-[260px]',
        )}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 md:p-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile sheet sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
