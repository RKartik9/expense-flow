import type { Metadata } from "next";
import { format } from "date-fns";
import { listAdminEmailLogs } from "@/lib/admin";
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

export const metadata: Metadata = { title: "Admin Email Logs" };

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listAdminEmailLogs(page);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>To</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{log.toEmail}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.type.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="max-w-64 truncate">{log.subject}</TableCell>
                <TableCell>
                  <Badge variant={log.status === "sent" ? "secondary" : "destructive"}>
                    {log.status}
                  </Badge>
                  {log.error && (
                    <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                      {log.error}
                    </p>
                  )}
                </TableCell>
                <TableCell>{format(new Date(log.createdAt), "dd MMM, HH:mm")}</TableCell>
              </TableRow>
            ))}
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No emails logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination page={data.page} pageCount={data.pageCount} basePath="/admin/emails" />
    </div>
  );
}
