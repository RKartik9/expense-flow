import type { Metadata } from "next";
import { getNotifications } from "@/lib/actions/notifications";
import { PageHeader } from "@/components/page-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <>
      <PageHeader title="Notifications" description="Splits, payments, reminders, and requests." />
      <NotificationsView notifications={notifications} />
    </>
  );
}
