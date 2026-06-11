import type { Metadata } from "next";
import { format } from "date-fns";
import { listAdminExpenses } from "@/lib/admin";
import { formatCurrency } from "@/lib/format";
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

export const metadata: Metadata = { title: "Admin Expenses" };

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const data = await listAdminExpenses(page);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell>{expense.userName}</TableCell>
                <TableCell>
                  <Badge variant={expense.type === "income" ? "default" : "secondary"}>
                    {expense.type}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(expense.amount, expense.currency)}
                </TableCell>
              </TableRow>
            ))}
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No expenses yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination page={data.page} pageCount={data.pageCount} basePath="/admin/expenses" />
    </div>
  );
}
