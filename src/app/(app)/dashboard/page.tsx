import type { Metadata } from "next";
import { Suspense } from "react";
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  Split,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getOverviewStats,
  getTrendData,
  getMonthlyComparison,
  getCategoryDistribution,
  getHeatmapData,
} from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart, MonthlyComparisonChart, CategoryPie } from "@/components/dashboard/charts";
import { SpendingHeatmap } from "@/components/dashboard/heatmap";
import type { UserDoc } from "@/lib/models/user";

export const metadata: Metadata = { title: "Dashboard" };

async function OverviewCards({ user }: { user: UserDoc }) {
  const stats = await getOverviewStats(user._id);
  const currency = user.currency;

  const cards = [
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses, currency),
      icon: TrendingDown,
      hint: "All time",
    },
    {
      title: "Total Income",
      value: formatCurrency(stats.totalIncome, currency),
      icon: TrendingUp,
      hint: "All time",
    },
    {
      title: "Monthly Spending",
      value: formatCurrency(stats.monthlySpending, currency),
      icon: Wallet,
      hint: "This month",
    },
    {
      title: "Monthly Savings",
      value: formatCurrency(stats.monthlySavings, currency),
      icon: PiggyBank,
      hint: "Income minus spending",
    },
    {
      title: "Pending Splits",
      value: formatCurrency(stats.pendingSplitsOwedToMe, currency),
      icon: Split,
      hint: `You owe ${formatCurrency(stats.pendingSplitsIOwe, currency)}`,
    },
    {
      title: "Upcoming Payments",
      value: formatCurrency(stats.upcomingPaymentsAmount, currency),
      icon: CalendarClock,
      hint: `${stats.upcomingPaymentsCount} due in 7 days`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function Charts({ user }: { user: UserDoc }) {
  const [trend, monthly, categories, heatmap] = await Promise.all([
    getTrendData(user._id),
    getMonthlyComparison(user._id),
    getCategoryDistribution(user._id),
    getHeatmapData(user._id),
  ]);
  const currency = user.currency;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Expense Trend</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <TrendChart data={trend} currency={currency} />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <MonthlyComparisonChart data={monthly} currency={currency} />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <CategoryPie data={categories} currency={currency} />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Spending Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <SpendingHeatmap data={heatmap} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} description="Here's your money at a glance." />
      <div className="space-y-4">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          }
        >
          <OverviewCards user={user} />
        </Suspense>
        <Suspense
          fallback={
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          }
        >
          <Charts user={user} />
        </Suspense>
      </div>
    </>
  );
}
