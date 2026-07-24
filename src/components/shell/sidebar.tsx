"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Split, ShieldCheck, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ITEMS } from "./nav-items";
import { useSidebar } from "./sidebar-context";

function NavLink({
  href,
  title,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && title}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex h-16 items-center gap-2 border-b font-heading text-lg tracking-wide",
            collapsed ? "justify-center px-0" : "px-5"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Split className="size-4" />
          </div>
          {!collapsed && "ExpenseFlow"}
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              title={item.title}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
          {isAdmin && (
            <NavLink
              href="/admin"
              title="Admin"
              icon={ShieldCheck}
              active={pathname.startsWith("/admin")}
              collapsed={collapsed}
            />
          )}
        </nav>
        <div className={cn("flex border-t p-3", collapsed ? "justify-center" : "justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-muted-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
