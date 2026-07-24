"use client";

import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  CalendarClock,
  Split,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";
import { formatCurrency, pctChange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OverviewStats } from "@/lib/dashboard";

function Sparkline({ data }: { data: number[] }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={points} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          fill="url(#sparkFill)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  if (pct === null) return null;
  const up = pct >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-foreground/10 tabular-nums",
        up ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <Arrow className="size-3" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function IconChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground/5 ring-1 ring-foreground/10 transition-colors group-hover/card:bg-foreground/10">
      <Icon className="size-4 text-foreground/80" />
    </span>
  );
}

const cardClass =
  "h-full transition-shadow duration-300 hover:ring-foreground/25 hover:shadow-lg hover:shadow-foreground/5";

export function OverviewCards({ stats, currency }: { stats: OverviewStats; currency: string }) {
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
  };
  const item: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const hover = reduced ? undefined : { y: -3 };

  const tiles: {
    title: string;
    value: number;
    icon: LucideIcon;
    hint: string;
    delta?: { current: number; previous: number };
  }[] = [
    {
      title: "Total Expenses",
      value: stats.totalExpenses,
      icon: TrendingDown,
      hint: "All time",
    },
    {
      title: "Total Income",
      value: stats.totalIncome,
      icon: TrendingUp,
      hint: "All time",
    },
    {
      title: "Monthly Savings",
      value: stats.monthlySavings,
      icon: PiggyBank,
      hint: "Income minus spending",
      delta: { current: stats.monthlySavings, previous: stats.prevMonthSavings },
    },
    {
      title: "Pending Splits",
      value: stats.pendingSplitsOwedToMe,
      icon: Split,
      hint: `You owe ${formatCurrency(stats.pendingSplitsIOwe, currency)}`,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 lg:auto-rows-fr lg:grid-cols-4"
    >
      <motion.div
        variants={item}
        whileHover={hover}
        className="col-span-2 lg:row-span-2"
      >
        <Card className={cn(cardClass, "flex flex-col")}>
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Spending
            </CardTitle>
            <IconChip icon={Wallet} />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex flex-wrap items-baseline gap-2">
              <CountUp
                value={stats.monthlySpending}
                currency={currency}
                className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl"
              />
              <DeltaBadge current={stats.monthlySpending} previous={stats.prevMonthSpending} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">vs last month spending</p>
            <div className="mt-auto pt-4">
              <Sparkline data={stats.spark} />
              <p className="mt-1 text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {tiles.map((tile) => (
        <motion.div key={tile.title} variants={item} whileHover={hover}>
          <Card className={cardClass}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tile.title}
              </CardTitle>
              <IconChip icon={tile.icon} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-baseline gap-2">
                <CountUp
                  value={tile.value}
                  currency={currency}
                  className="text-2xl font-bold tabular-nums"
                />
                {tile.delta && (
                  <DeltaBadge current={tile.delta.current} previous={tile.delta.previous} />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div
        variants={item}
        whileHover={hover}
        className="col-span-2 lg:col-span-4"
      >
        <Card className={cardClass}>
          <CardContent className="flex flex-row items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <IconChip icon={CalendarClock} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Payments</p>
                <p className="text-xs text-muted-foreground">
                  {stats.upcomingPaymentsCount} due in the next 7 days
                </p>
              </div>
            </div>
            <CountUp
              value={stats.upcomingPaymentsAmount}
              currency={currency}
              className="text-2xl font-bold tabular-nums"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
