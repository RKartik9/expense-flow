import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getGroups } from "@/lib/actions/groups";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupDialog } from "@/components/groups/group-dialog";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  await requireUser();
  const groups = await getGroups();

  return (
    <>
      <PageHeader title="Groups" description="Shared expenses with family, friends, and teams.">
        <GroupDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Create group
            </Button>
          }
        />
      </PageHeader>

      {groups.length === 0 ? (
        <div className="rounded-xl border bg-background py-16 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium">No groups yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a group for your roommates, trip, or team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group._id}
              href={`/groups/${group._id}`}
              className="group overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-md"
            >
              <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5">
                {group.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.coverImageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold">{group.name}</h3>
                  <Badge variant="secondary" className="capitalize">
                    {group.role}
                  </Badge>
                </div>
                {group.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(group.totalExpenses, group.currency)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
