import type { Metadata } from "next";
import { Suspense } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getOverviewStats,
  getTrendData,
  getMonthlyComparison,
  getCategoryDistribution,
  getHeatmapData,
} from "@/lib/dashboard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart, MonthlyComparisonChart, CategoryPie } from "@/components/dashboard/charts";
import { SpendingHeatmap } from "@/components/dashboard/heatmap";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import type { UserDoc } from "@/lib/models/user";

export const metadata: Metadata = { title: "Dashboard" };

async function OverviewSection({ user }: { user: UserDoc }) {
  const stats = await getOverviewStats(user._id);
  return <OverviewCards stats={stats} currency={user.currency} />;
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
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} description="Here's your money at a glance.">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10">
          <CalendarDays className="size-3.5" />
          {format(new Date(), "MMMM yyyy")}
        </span>
      </PageHeader>
      <div className="space-y-4">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 lg:auto-rows-fr lg:grid-cols-4">
              <Skeleton className="col-span-2 h-48 rounded-xl lg:row-span-2 lg:h-full" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
              <Skeleton className="col-span-2 h-20 rounded-xl lg:col-span-4" />
            </div>
          }
        >
          <OverviewSection user={user} />
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
