import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { UserPlus, Pencil, ArrowRight, Plus, Receipt } from "lucide-react";
import { getGroupDetail } from "@/lib/actions/groups";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupDialog } from "@/components/groups/group-dialog";
import { InviteMemberDialog } from "@/components/groups/invite-member-dialog";
import { MemberList } from "@/components/groups/member-list";

export const metadata: Metadata = { title: "Group" };

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupDetail(id);
  if (!group) notFound();

  const canManage = group.myRole === "owner" || group.myRole === "admin";

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-xl border bg-background">
        <div className="h-36 bg-gradient-to-br from-primary/25 to-primary/5">
          {group.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.coverImageUrl} alt="" className="size-full object-cover" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl tracking-wide">{group.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {group.myRole}
              </Badge>
            </div>
            {group.description && (
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <InviteMemberDialog
                  groupId={group._id}
                  trigger={
                    <Button variant="outline" size="sm">
                      <UserPlus className="size-4" /> Invite
                    </Button>
                  }
                />
                <GroupDialog
                  group={group}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Pencil className="size-4" /> Edit
                    </Button>
                  }
                />
              </>
            )}
            <Button size="sm" asChild>
              <Link href={`/splits/new?group=${group._id}`}>
                <Plus className="size-4" /> Add split
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(group.totalExpenses, group.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(group.pendingAmount, group.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who owes whom</CardTitle>
          </CardHeader>
          <CardContent>
            {group.whoOwesWhom.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                All settled up. Nice!
              </p>
            ) : (
              <div className="space-y-2">
                {group.whoOwesWhom.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{line.fromName}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{line.toName}</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(line.amount, group.currency)}
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted-foreground">
                  Simplified — minimal transactions to settle everyone up.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberList groupId={group._id} members={group.members} myRole={group.myRole} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Splits</CardTitle>
          </CardHeader>
          <CardContent>
            {group.splits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No splits yet. Add the first shared expense.
              </p>
            ) : (
              <div className="space-y-2">
                {group.splits.map((split) => (
                  <Link
                    key={split._id}
                    href={`/splits/${split._id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <Receipt className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{split.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid by {split.payerName} · {format(new Date(split.date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <Badge variant={split.status === "settled" ? "secondary" : "outline"}>
                      {split.status}
                    </Badge>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(split.totalAmount, split.currency)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {group.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {group.recentActivity.map((a) => (
                  <div key={a._id} className="flex items-start gap-2 text-sm">
                    <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p>
                        <span className="font-medium">{a.userName}</span>{" "}
                        <span className="text-muted-foreground">{a.details ?? a.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.createdAt), "dd MMM, HH:mm")}
                      </p>
                    </div>
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
