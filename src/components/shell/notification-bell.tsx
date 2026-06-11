import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const count = initialCount;

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/notifications" aria-label={`Notifications (${count} unread)`}>
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
