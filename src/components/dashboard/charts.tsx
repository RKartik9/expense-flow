"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type PieSectorDataItem,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { TrendPoint, MonthlyComparisonPoint, CategorySlice } from "@/lib/dashboard";

interface TooltipItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { color?: string; fill?: string };
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  labelMap,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  currency: string;
  labelMap?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null && (
        <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const swatch = entry.color ?? entry.payload?.color ?? entry.payload?.fill;
          const key = String(entry.dataKey ?? "");
          return (
            <div key={i} className="flex items-center gap-2">
              {swatch && (
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: swatch }}
                />
              )}
              <span className="text-muted-foreground">
                {labelMap?.[key] ?? String(entry.name ?? "")}
              </span>
              <span className="ml-auto pl-3 font-medium tabular-nums text-popover-foreground">
                {formatCurrency(Number(entry.value), currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendChart({ data, currency }: { data: TrendPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={<ChartTooltip currency={currency} labelMap={{ amount: "Spent" }} />}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#trendFill)"
          activeDot={{
            r: 4,
            stroke: "var(--background)",
            strokeWidth: 2,
            fill: "var(--primary)",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart({
  data,
  currency,
}: {
  data: MonthlyComparisonPoint[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
        <Tooltip
          cursor={{ fill: "var(--foreground)", fillOpacity: 0.05 }}
          content={
            <ChartTooltip
              currency={currency}
              labelMap={{ expenses: "Expenses", income: "Income" }}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill="var(--foreground)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="income"
          name="Income"
          fill="var(--muted-foreground)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderActiveSlice(props: PieSectorDataItem) {
  const { outerRadius = 0 } = props;
  return <Sector {...props} outerRadius={outerRadius + 6} />;
}

export function CategoryPie({ data, currency }: { data: CategorySlice[]; currency: string }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No expenses this month yet.
      </div>
    );
  }

  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
            activeShape={renderActiveSlice}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[110px] flex -translate-y-1/2 flex-col items-center">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          This month
        </span>
        <span className="text-lg font-bold tabular-nums">
          {formatCurrency(total, currency)}
        </span>
      </div>
    </div>
  );
}
