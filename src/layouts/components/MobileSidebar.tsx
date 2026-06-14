import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useDirection } from '@/hooks/useDirection';
import { navItems } from './navItems';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { t }     = useTranslation();
  const { isRTL } = useDirection();

  return (
    <Sheet open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <SheetContent
        side={isRTL ? 'right' : 'left'}
        className="w-[260px] p-0 bg-card border-[#E2E8F0]"
      >
        {/* Visually hidden title for screen-reader accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Family CFO</SheetTitle>
        </SheetHeader>

        {/* Brand block */}
        <div className="flex items-center gap-2 h-14 px-4 border-b border-[#E2E8F0]">
          <Building2 className="w-6 h-6 text-[#1E5DC4] shrink-0" />
          <span className="font-medium text-lg text-foreground">Family CFO (v.01)</span>
        </div>

        {/* Navigation */}
        <nav className="py-3">
          {navItems.map(({ labelKey, icon: Icon, href, exactMatch }) => (
            <NavLink
              key={href}
              to={href}
              end={exactMatch}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#E8F0FB] text-[#1E5DC4]'
                    : 'text-[#475569] hover:bg-[#F1F5F9]',
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
