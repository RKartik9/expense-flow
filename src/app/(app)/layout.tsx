import { UserButton } from "@clerk/nextjs";
import { requireUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { CommandPalette } from "@/components/shell/command-palette";
import { NotificationBell } from "@/components/shell/notification-bell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unreadCount = await getUnreadNotificationCount();
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="min-w-0 flex-1">
            <CommandPalette />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationBell initialCount={unreadCount} />
            <ThemeToggle />
            <UserButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip p-4 pb-24 sm:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
