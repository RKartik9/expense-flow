"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Split,
  CreditCard,
  BellRing,
  UserPlus,
  UserCheck,
  Users,
  Wallet,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  new_split: Split,
  payment_received: CreditCard,
  payment_reminder: BellRing,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  group_invitation: Users,
  budget_alert: Wallet,
  settlement_completed: CheckCheck,
};

export function NotificationsView({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const open = (notification: NotificationItem) => {
    startTransition(async () => {
      if (!notification.read) await markNotificationRead(notification._id);
      router.refresh();
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border bg-background py-16 text-center">
        <Bell className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 font-medium">No notifications</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ll see splits, payments, and friend requests here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending}>
            <CheckCheck className="size-4" /> Mark all as read
          </Button>
        </div>
      )}
      <div className="divide-y rounded-xl border bg-background">
        {notifications.map((notification) => {
          const Icon = TYPE_ICONS[notification.type] ?? Bell;
          const content = (
            <div
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                notification.link && "hover:bg-muted/40",
                !notification.read && "bg-primary/[0.03]"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !notification.read && "font-medium")}>
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          );
          return notification.link ? (
            <Link key={notification._id} href={notification.link} onClick={() => open(notification)} className="block">
              {content}
            </Link>
          ) : (
            <button
              key={notification._id}
              type="button"
              onClick={() => open(notification)}
              className="block w-full text-left"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
