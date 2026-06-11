"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/format";
import {
  createRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  type RecurringItem,
  type RecurringInput,
} from "@/lib/actions/recurring";
import type { CategoryItem } from "@/lib/actions/categories";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

export function RecurringView({
  items,
  categories,
  defaultCurrency,
}: {
  items: RecurringItem[];
  categories: CategoryItem[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringInput["frequency"]>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<RecurringInput["paymentMethod"]>("upi");
  const [nextRunAt, setNextRunAt] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    const value = parseFloat(amount);
    if (!title.trim()) return toast.error("Title is required");
    if (!value || value <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    if (!nextRunAt) return toast.error("Pick the first run date");
    startTransition(async () => {
      const res = await createRecurringExpense({
        title: title.trim(),
        amount: value,
        currency,
        categoryId,
        frequency,
        paymentMethod,
        nextRunAt,
      });
      if (res.success) {
        toast.success("Recurring expense created");
        setOpen(false);
        setTitle("");
        setAmount("");
        setNextRunAt("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const act = (fn: () => Promise<{ success: boolean; error?: string }>, msg: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(msg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Add recurring expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add recurring expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rec-title">Title</Label>
                <Input
                  id="rec-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Rent, Gym membership..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rec-amount">Amount</Label>
                  <Input
                    id="rec-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as RecurringInput["frequency"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-next">First run</Label>
                  <Input
                    id="rec-next"
                    type="date"
                    value={nextRunAt}
                    onChange={(e) => setNextRunAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as RecurringInput["paymentMethod"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={save} disabled={pending}>
                {pending ? "Saving..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-background py-16 text-center">
          <Repeat className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium">No recurring expenses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rent, EMIs, memberships — they&apos;ll be added automatically on schedule.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-background">
          {items.map((item) => (
            <div
              key={item._id}
              className={`flex items-center gap-3 p-4 ${!item.active ? "opacity-60" : ""}`}
            >
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.categoryId?.color ?? "#64748b" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.categoryId?.name ?? "Uncategorized"} ·{" "}
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                    {item.frequency}
                  </Badge>{" "}
                  · next on {format(new Date(item.nextRunAt), "dd MMM yyyy")}
                </p>
              </div>
              <p className="font-semibold tabular-nums">
                {formatCurrency(item.amount, item.currency)}
              </p>
              <Switch
                checked={item.active}
                onCheckedChange={(checked) =>
                  act(() => toggleRecurringExpense(item._id, checked), checked ? "Resumed" : "Paused")
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => act(() => deleteRecurringExpense(item._id), "Deleted")}
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
