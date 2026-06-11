"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/format";
import {
  deleteExpense,
  getExpensesPage,
  type ExpenseFilters,
  type ExpenseItem,
} from "@/lib/actions/expenses";
import type { CategoryItem } from "@/lib/actions/categories";
import { ExpenseDialog } from "./expense-dialog";
import { cn } from "@/lib/utils";

interface Props {
  initialItems: ExpenseItem[];
  initialCursor: string | null;
  filters: ExpenseFilters;
  categories: CategoryItem[];
  defaultCurrency: string;
}

export function ExpenseList({
  initialItems,
  initialCursor,
  filters,
  categories,
  defaultCurrency,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await getExpensesPage(filters, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const onDelete = (id: string) => {
    const prev = items;
    setItems(items.filter((i) => i._id !== id));
    startTransition(async () => {
      const res = await deleteExpense(id);
      if (!res.success) {
        setItems(prev);
        toast.error(res.error);
      } else {
        toast.success("Expense deleted");
        router.refresh();
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-background py-16 text-center text-muted-foreground">
        <p className="font-medium">No expenses found</p>
        <p className="mt-1 text-sm">Add your first expense or adjust the filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-xl border bg-background">
        {items.map((expense) => (
          <div key={expense._id} className="flex items-center gap-3 p-3 sm:p-4">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: expense.categoryId?.color ?? "#64748b" }}
              title={expense.categoryId?.name}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{expense.title}</p>
                {expense.receiptUrl && (
                  <a href={expense.receiptUrl} target="_blank" rel="noreferrer">
                    <Paperclip className="size-3.5 text-muted-foreground" />
                  </a>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{expense.categoryId?.name ?? "Uncategorized"}</span>
                <span>·</span>
                <span>{format(new Date(expense.date), "dd MMM yyyy")}</span>
                <span>·</span>
                <span>{PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}</span>
                {expense.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <p
              className={cn(
                "shrink-0 font-semibold tabular-nums",
                expense.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""
              )}
            >
              {expense.type === "income" ? "+" : "-"}
              {formatCurrency(expense.amount, expense.currency)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ExpenseDialog
                  categories={categories}
                  defaultCurrency={defaultCurrency}
                  expense={expense}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(expense._id)}>
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="size-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
