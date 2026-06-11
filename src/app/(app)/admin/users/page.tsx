import type { Metadata } from "next";
import { format } from "date-fns";
import { listAdminUsers } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/pagination";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Admin Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q ?? "";
  const data = await listAdminUsers(page, q);

  return (
    <div className="space-y-4">
      <form method="GET" action="/admin/users">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search users by name or email..."
          className="max-w-sm"
        />
      </form>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.currency}</TableCell>
                <TableCell>{format(new Date(user.createdAt), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  {user.lastActiveAt ? format(new Date(user.lastActiveAt), "dd MMM yyyy") : "—"}
                </TableCell>
              </TableRow>
            ))}
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        page={data.page}
        pageCount={data.pageCount}
        basePath="/admin/users"
        extraParams={q ? { q } : {}}
      />
    </div>
  );
}
