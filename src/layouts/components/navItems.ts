import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Users,
  FileBarChart,
  Wallet,
  BarChart2,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/router/routes';

export interface NavItem {
  labelKey: string;
  icon: LucideIcon;
  href: string;
  exactMatch: boolean;
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard',    icon: LayoutDashboard, href: ROUTES.DASHBOARD,    exactMatch: true  },
  { labelKey: 'nav.journal',       icon: BookOpen,        href: ROUTES.JOURNAL,        exactMatch: false },
  { labelKey: 'nav.assets',        icon: Briefcase,       href: ROUTES.ASSETS,         exactMatch: false },
  { labelKey: 'nav.partners',     icon: Users,           href: ROUTES.PARTNERS,     exactMatch: false },
  { labelKey: 'nav.reports',      icon: FileBarChart,    href: ROUTES.REPORTS,      exactMatch: false },
  { labelKey: 'capital.title',      icon: Wallet,     href: ROUTES.CAPITAL,      exactMatch: false },
  { labelKey: 'settlements.title', icon: BarChart2,  href: ROUTES.SETTLEMENTS,  exactMatch: false },
  { labelKey: 'nav.settings',      icon: Settings,   href: ROUTES.SETTINGS,     exactMatch: false },
];
