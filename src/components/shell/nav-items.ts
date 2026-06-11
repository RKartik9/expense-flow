import {
  LayoutDashboard,
  Receipt,
  Split,
  Users,
  UserPlus,
  Wallet,
  Repeat,
  CalendarSync,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Expenses", href: "/expenses", icon: Receipt },
  { title: "Splits", href: "/splits", icon: Split },
  { title: "Groups", href: "/groups", icon: Users },
  { title: "Friends", href: "/friends", icon: UserPlus },
  { title: "Budgets", href: "/budgets", icon: Wallet },
  { title: "Subscriptions", href: "/subscriptions", icon: CalendarSync },
  { title: "Recurring", href: "/recurring", icon: Repeat },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];
