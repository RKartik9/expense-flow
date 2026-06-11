import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getBudgets } from "@/lib/actions/budgets";
import { getCategories } from "@/lib/actions/categories";
import { PageHeader } from "@/components/page-header";
import { BudgetsView } from "@/components/budgets/budgets-view";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireUser()]);
  const now = new Date();
  const month = Math.min(12, Math.max(1, Number(params.month) || now.getMonth() + 1));
  const year = Number(params.year) || now.getFullYear();

  const [budgets, categories] = await Promise.all([getBudgets(month, year), getCategories()]);

  return (
    <>
      <PageHeader title="Budgets" description="Set monthly limits per category and stay on track." />
      <BudgetsView
        budgets={budgets}
        categories={categories}
        month={month}
        year={year}
        currency={user.currency}
      />
    </>
  );
}
