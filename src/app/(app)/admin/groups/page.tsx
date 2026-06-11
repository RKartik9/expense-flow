import type { Metadata } from "next";
import { format } from "date-fns";
import { listAdminGroups } from "@/lib/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/pagination";

export const metadata: Metadata = { title: "Admin Groups" };

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listAdminGroups(page);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((group) => (
              <TableRow key={group._id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.ownerName}</TableCell>
                <TableCell>{format(new Date(group.createdAt), "dd MMM yyyy")}</TableCell>
              </TableRow>
            ))}
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No groups yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination page={data.page} pageCount={data.pageCount} basePath="/admin/groups" />
    </div>
  );
}
