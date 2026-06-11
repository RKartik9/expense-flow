import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus, Tags } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/actions/categories";
import { getExpensesPage, type ExpenseFilters as Filters } from "@/lib/actions/expenses";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ManageCategoriesDialog } from "@/components/expenses/manage-categories-dialog";

export const metadata: Metadata = { title: "Expenses" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function ExpensesContent({ filters, defaultCurrency }: { filters: Filters; defaultCurrency: string }) {
  const [categories, page] = await Promise.all([getCategories(), getExpensesPage(filters)]);
  return (
    <ExpenseList
      key={JSON.stringify(filters)}
      initialItems={page.items}
      initialCursor={page.nextCursor}
      filters={filters}
      categories={categories}
      defaultCurrency={defaultCurrency}
    />
  );
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireUser();
  const categories = await getCategories();

  const filters: Filters = {
    q: params.q,
    categoryId: params.category,
    type: params.type === "income" || params.type === "expense" ? params.type : undefined,
    dateFrom: params.from,
    dateTo: params.to,
    minAmount: params.min ? Number(params.min) : undefined,
    maxAmount: params.max ? Number(params.max) : undefined,
  };

  return (
    <>
      <PageHeader title="Expenses" description="Track and manage your daily expenses.">
        <ManageCategoriesDialog
          categories={categories}
          trigger={
            <Button variant="outline">
              <Tags className="size-4" /> Categories
            </Button>
          }
        />
        <ExpenseDialog
          categories={categories}
          defaultCurrency={user.currency}
          trigger={
            <Button>
              <Plus className="size-4" /> Add expense
            </Button>
          }
        />
      </PageHeader>
      <ExpenseFilters categories={categories} />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <ExpensesContent filters={filters} defaultCurrency={user.currency} />
      </Suspense>
    </>
  );
}
