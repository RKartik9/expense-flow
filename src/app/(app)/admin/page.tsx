import type { Metadata } from "next";
import { Users, Activity, UserPlus, Layers, Split, Receipt, Mail, AlertTriangle } from "lucide-react";
import { getAdminStats } from "@/lib/admin";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupChart } from "@/components/admin/signup-chart";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    { title: "Total Users", value: String(stats.totalUsers), icon: Users },
    { title: "Active Users (30d)", value: String(stats.activeUsers30d), icon: Activity },
    { title: "New Users (30d)", value: String(stats.newUsers30d), icon: UserPlus },
    { title: "Groups", value: String(stats.totalGroups), icon: Layers },
    { title: "Splits", value: String(stats.totalSplits), icon: Split },
    {
      title: "Expense Volume",
      value: formatCurrency(stats.totalExpenseVolume, "INR"),
      icon: Receipt,
      hint: `${stats.totalExpenses} expenses`,
    },
    { title: "Emails Sent", value: String(stats.emailsSent), icon: Mail },
    { title: "Emails Failed", value: String(stats.emailsFailed), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
              {card.hint && <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signups (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupChart data={stats.signupsByMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
