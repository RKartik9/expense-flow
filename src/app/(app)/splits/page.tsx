import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Split as SplitIcon } from "lucide-react";
import { getSplits, type SplitListItem } from "@/lib/actions/splits";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Splits" };

function SplitRow({ split }: { split: SplitListItem }) {
  return (
    <Link
      href={`/splits/${split._id}`}
      className="flex items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <SplitIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{split.title}</p>
          {split.groupName && (
            <Badge variant="secondary" className="text-[10px]">
              {split.groupName}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] capitalize">
            {split.splitType}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {format(new Date(split.date), "dd MMM yyyy")} · {split.participantCount} people
          {split.isPayer
            ? ` · ${formatCurrency(split.outstandingTotal, split.currency)} pending`
            : split.myOutstanding != null && split.myOutstanding > 0
              ? ` · you owe ${formatCurrency(split.myOutstanding, split.currency)}`
              : " · settled"}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums">
          {formatCurrency(split.totalAmount, split.currency)}
        </p>
        <Badge
          variant={split.status === "settled" ? "secondary" : "outline"}
          className="mt-1 text-[10px]"
        >
          {split.status}
        </Badge>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border bg-background py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default async function SplitsPage() {
  const splits = await getSplits();
  const iOwe = splits.filter((s) => (s.myOutstanding ?? 0) > 0);
  const owedToMe = splits.filter((s) => s.isPayer && s.outstandingTotal > 0);

  return (
    <>
      <PageHeader title="Splits" description="Split bills and settle up with anyone.">
        <Button asChild>
          <Link href="/splits/new">
            <Plus className="size-4" /> New split
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({splits.length})</TabsTrigger>
          <TabsTrigger value="i-owe">I owe ({iOwe.length})</TabsTrigger>
          <TabsTrigger value="owed">Owed to me ({owedToMe.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4 space-y-2">
          {splits.length === 0 ? (
            <EmptyState message="No splits yet. Create one to get started." />
          ) : (
            splits.map((s) => <SplitRow key={s._id} split={s} />)
          )}
        </TabsContent>
        <TabsContent value="i-owe" className="mt-4 space-y-2">
          {iOwe.length === 0 ? (
            <EmptyState message="You don't owe anyone. Squeaky clean!" />
          ) : (
            iOwe.map((s) => <SplitRow key={s._id} split={s} />)
          )}
        </TabsContent>
        <TabsContent value="owed" className="mt-4 space-y-2">
          {owedToMe.length === 0 ? (
            <EmptyState message="Nobody owes you right now." />
          ) : (
            owedToMe.map((s) => <SplitRow key={s._id} split={s} />)
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
