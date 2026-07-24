"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function persist(collapsed: boolean) {
  document.cookie = `sidebar_collapsed=${collapsed ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

export function SidebarProvider({
  defaultCollapsed = false,
  children,
}: {
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    persist(value);
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-[padding] duration-200",
        collapsed ? "lg:pl-16" : "lg:pl-60"
      )}
    >
      {children}
    </div>
  );
}
