"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { upsertBudget, deleteBudget, type BudgetItem } from "@/lib/actions/budgets";
import type { CategoryItem } from "@/lib/actions/categories";
import { cn } from "@/lib/utils";

interface Props {
  budgets: BudgetItem[];
  categories: CategoryItem[];
  month: number;
  year: number;
  currency: string;
}

export function BudgetsView({ budgets, categories, month, year, currency }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();

  const navigate = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) (m = 12), y--;
    if (m > 12) (m = 1), y++;
    router.push(`/budgets?month=${m}&year=${y}`);
  };

  const save = () => {
    const value = parseFloat(amount);
    if (!categoryId) return toast.error("Pick a category");
    if (!value || value <= 0) return toast.error("Enter a valid amount");
    startTransition(async () => {
      const res = await upsertBudget({ categoryId, amount: value, month, year });
      if (res.success) {
        toast.success("Budget saved");
        setOpen(false);
        setCategoryId("");
        setAmount("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteBudget(id);
      if (res.success) {
        toast.success("Budget removed");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center font-medium">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Set budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Set budget for {monthLabel}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-amount">Monthly limit</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <Button className="w-full" onClick={save} disabled={pending}>
                {pending ? "Saving..." : "Save budget"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
            <span className="text-muted-foreground">Overall</span>
            <span>
              <strong>{formatCurrency(totalSpent, currency)}</strong> of{" "}
              {formatCurrency(totalBudget, currency)} used
            </span>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <div className="rounded-xl border bg-background py-16 text-center">
          <p className="font-medium">No budgets for {monthLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Set category limits to track your spending.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? Math.min(100, (budget.spent / budget.amount) * 100) : 0;
            const over = budget.spent > budget.amount;
            return (
              <Card key={budget._id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: budget.categoryId?.color ?? "#64748b" }}
                      />
                      {budget.categoryId?.name ?? "Unknown"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(budget._id)}
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Progress value={pct} className={cn(over && "[&>div]:bg-destructive")} />
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn(over ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {formatCurrency(budget.spent, currency)} spent
                      {over && " — over budget!"}
                    </span>
                    <span className="text-muted-foreground">
                      of {formatCurrency(budget.amount, currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
