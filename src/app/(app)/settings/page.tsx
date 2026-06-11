import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import type { ProfileInput } from "@/lib/actions/user";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  const initial = {
    name: user.name,
    email: user.email,
    currency: user.currency,
    timezone: user.timezone,
    notificationPrefs: {
      emailReminders: user.notificationPrefs?.emailReminders ?? true,
      weeklySummary: user.notificationPrefs?.weeklySummary ?? true,
      monthlyReport: user.notificationPrefs?.monthlyReport ?? true,
      splitNotifications: user.notificationPrefs?.splitNotifications ?? true,
    },
  } as ProfileInput & { email: string };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and notification preferences." />
      <SettingsForm initial={initial} />
    </>
  );
}
