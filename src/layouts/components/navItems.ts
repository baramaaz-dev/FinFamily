import {
  LayoutDashboard,
  ArrowLeftRight,
  Briefcase,
  Building2,
  Users,
  FileBarChart,
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
  { labelKey: 'nav.transactions', icon: ArrowLeftRight,  href: ROUTES.TRANSACTIONS, exactMatch: false },
  { labelKey: 'nav.portfolios',   icon: Briefcase,       href: ROUTES.PORTFOLIOS,   exactMatch: false },
  { labelKey: 'nav.properties',   icon: Building2,       href: ROUTES.PROPERTIES,   exactMatch: false },
  { labelKey: 'nav.partners',     icon: Users,           href: ROUTES.PARTNERS,     exactMatch: false },
  { labelKey: 'nav.reports',      icon: FileBarChart,    href: ROUTES.REPORTS,      exactMatch: false },
  { labelKey: 'nav.settings',     icon: Settings,        href: ROUTES.SETTINGS,     exactMatch: false },
];
