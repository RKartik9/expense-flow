import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getRecurringExpenses } from "@/lib/actions/recurring";
import { getCategories } from "@/lib/actions/categories";
import { PageHeader } from "@/components/page-header";
import { RecurringView } from "@/components/recurring/recurring-view";

export const metadata: Metadata = { title: "Recurring" };

export default async function RecurringPage() {
  const user = await requireUser();
  const [items, categories] = await Promise.all([getRecurringExpenses(), getCategories()]);

  return (
    <>
      <PageHeader
        title="Recurring expenses"
        description="Automatically log rent, EMIs, and other repeating expenses."
      />
      <RecurringView items={items} categories={categories} defaultCurrency={user.currency} />
    </>
  );
}
