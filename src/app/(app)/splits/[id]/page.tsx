import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Paperclip, Users, CreditCard } from "lucide-react";
import { getSplitDetail } from "@/lib/actions/splits";
import { formatCurrency, initials, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { RecordPaymentDialog } from "@/components/splits/record-payment-dialog";
import { RemindButton, DeleteSplitButton } from "@/components/splits/split-buttons";

export const metadata: Metadata = { title: "Split" };

export default async function SplitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const split = await getSplitDetail(id);
  if (!split) notFound();

  const collected = split.participants.reduce(
    (sum, p) => (p.isPayer ? sum : sum + p.paidAmount),
    0
  );
  const totalOwed = split.participants.reduce(
    (sum, p) => (p.isPayer ? sum : sum + p.shareAmount),
    0
  );
  const progress = totalOwed > 0 ? Math.round((collected / totalOwed) * 100) : 100;

  return (
    <>
      <PageHeader title={split.title} description={split.description}>
        {split.isCreator && <DeleteSplitButton splitId={split._id} />}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={split.status === "settled" ? "secondary" : "outline"} className="capitalize">
          {split.status}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {split.splitType} split
        </Badge>
        <span>·</span>
        <span>{format(new Date(split.date), "dd MMM yyyy")}</span>
        <span>·</span>
        <span>Paid by {split.payerName}</span>
        {split.groupName && (
          <>
            <span>·</span>
            <Link href={`/groups/${split.groupId}`} className="flex items-center gap-1 text-primary hover:underline">
              <Users className="size-3.5" /> {split.groupName}
            </Link>
          </>
        )}
        {split.receiptUrl && (
          <>
            <span>·</span>
            <a
              href={split.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Paperclip className="size-3.5" /> Receipt
            </a>
          </>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(split.totalAmount, split.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(collected, split.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{progress}%</p>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {split.participants.map((p) => {
              const outstanding = Math.max(0, p.shareAmount - p.paidAmount);
              const canRecord =
                !p.isPayer &&
                outstanding > 0 &&
                (split.isPayer || (split.myParticipantId !== null && p._id === split.myParticipantId));
              return (
                <div key={p._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3">
                  <Avatar className="size-8">
                    <AvatarImage src={p.imageUrl} alt={p.name} />
                    <AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.name}
                      {p.isPayer && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Paid the bill
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.shareAmount, split.currency)}
                      {p.percentage != null && ` (${p.percentage}%)`}
                      {!p.isPayer &&
                        p.paidAmount > 0 &&
                        ` · paid ${formatCurrency(p.paidAmount, split.currency)}`}
                    </p>
                  </div>
                  {!p.isPayer && (
                    <Badge
                      variant={
                        p.status === "paid" ? "secondary" : p.status === "partial" ? "outline" : "destructive"
                      }
                      className="capitalize"
                    >
                      {p.status}
                    </Badge>
                  )}
                  {canRecord && (
                    <RecordPaymentDialog
                      splitId={split._id}
                      participantId={p._id}
                      participantName={p.name}
                      outstanding={outstanding}
                      currency={split.currency}
                      trigger={
                        <Button size="sm">
                          <CreditCard className="size-3.5" /> Settle
                        </Button>
                      }
                    />
                  )}
                  {split.isPayer && !p.isPayer && outstanding > 0 && (
                    <RemindButton splitId={split._id} participantId={p._id} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {split.settlements.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {split.settlements.map((s) => (
                  <div key={s._id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{s.fromName}</strong> paid <strong>{s.toName}</strong>
                      </span>
                      <strong className="tabular-nums">
                        {formatCurrency(s.amount, split.currency)}
                      </strong>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{PAYMENT_METHOD_LABELS[s.method] ?? s.method}</span>
                      <span>·</span>
                      <span>{format(new Date(s.createdAt), "dd MMM yyyy, HH:mm")}</span>
                      {s.proofUrl && (
                        <>
                          <span>·</span>
                          <a
                            href={s.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Proof
                          </a>
                        </>
                      )}
                    </div>
                    {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
