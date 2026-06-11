"use client";

import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";
import type { HeatmapDay } from "@/lib/dashboard";

function intensity(amount: number, max: number) {
  if (amount === 0) return "bg-muted";
  const ratio = amount / max;
  if (ratio < 0.25) return "bg-primary/25";
  if (ratio < 0.5) return "bg-primary/50";
  if (ratio < 0.75) return "bg-primary/75";
  return "bg-primary";
}

export function SpendingHeatmap({ data, currency }: { data: HeatmapDay[]; currency: string }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  // Pad start so the grid begins on Sunday
  const firstDay = new Date(data[0]?.date ?? new Date());
  const pad = firstDay.getDay();
  const cells: (HeatmapDay | null)[] = [...Array<null>(pad).fill(null), ...data];

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) =>
                day ? (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div className={`size-3.5 rounded-[3px] ${intensity(day.amount, max)}`} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {format(new Date(day.date), "dd MMM")}:{" "}
                      {formatCurrency(day.amount, currency)}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={`pad-${di}`} className="size-3.5" />
                )
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          Less
          <div className="size-3 rounded-[3px] bg-muted" />
          <div className="size-3 rounded-[3px] bg-primary/25" />
          <div className="size-3 rounded-[3px] bg-primary/50" />
          <div className="size-3 rounded-[3px] bg-primary/75" />
          <div className="size-3 rounded-[3px] bg-primary" />
          More
        </div>
      </div>
    </TooltipProvider>
  );
}
