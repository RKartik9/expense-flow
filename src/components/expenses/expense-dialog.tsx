"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadButton } from "@/lib/uploadthing";
import { CURRENCIES, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { createExpense, updateExpense, type ExpenseItem } from "@/lib/actions/expenses";
import type { CategoryItem } from "@/lib/actions/categories";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.coerce.number<number>().positive("Amount must be positive"),
  currency: z.string(),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().min(1, "Pick a category"),
  description: z.string().max(2000).optional(),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["cash", "upi", "bank_transfer", "credit_card", "debit_card", "other"]),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  categories: CategoryItem[];
  defaultCurrency: string;
  expense?: ExpenseItem;
  trigger: React.ReactNode;
}

export function ExpenseDialog({ categories, defaultCurrency, expense, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: expense?.title ?? "",
      amount: expense?.amount ?? ("" as unknown as number),
      currency: expense?.currency ?? defaultCurrency,
      type: expense?.type ?? "expense",
      categoryId: expense?.categoryId?._id ?? "",
      description: expense?.description ?? "",
      date: expense ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      paymentMethod: (expense?.paymentMethod as FormValues["paymentMethod"]) ?? "cash",
      tags: expense?.tags.join(", ") ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setReceiptUrl(expense?.receiptUrl ?? "");
  }, [open, expense]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...values,
        tags: (values.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
        receiptUrl: receiptUrl || "",
        description: values.description || undefined,
      };
      const res = expense
        ? await updateExpense(expense._id, payload)
        : await createExpense(payload);
      if (res.success) {
        toast.success(expense ? "Expense updated" : "Expense added");
        setOpen(false);
        if (!expense) form.reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const { register, handleSubmit, watch, setValue, formState } = form;
  const type = watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setValue("type", v as "expense" | "income")}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Lunch at cafe" {...register("title")} />
            {formState.errors.title && (
              <p className="text-xs text-destructive">{formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
              {formState.errors.amount && (
                <p className="text-xs text-destructive">{formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={watch("currency")} onValueChange={(v) => setValue("currency", v)}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
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
              {formState.errors.categoryId && (
                <p className="text-xs text-destructive">{formState.errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={watch("paymentMethod")}
              onValueChange={(v) => setValue("paymentMethod", v as FormValues["paymentMethod"])}
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

          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" rows={2} placeholder="Optional notes" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" placeholder="work, trip, urgent (comma separated)" {...register("tags")} />
          </div>

          <div className="space-y-2">
            <Label>Receipt</Label>
            {receiptUrl ? (
              <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary underline"
                >
                  View receipt
                </a>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptUrl("")}>
                  Remove
                </Button>
              </div>
            ) : (
              <UploadButton
                endpoint="receipt"
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.ufsUrl) setReceiptUrl(res[0].ufsUrl);
                }}
                onUploadError={(e) => {
                  toast.error(e.message);
                }}
                appearance={{
                  button:
                    "ut-ready:bg-primary ut-ready:text-primary-foreground text-sm h-9 px-4 rounded-md w-full",
                  allowedContent: "text-xs text-muted-foreground",
                }}
              />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : expense ? "Save changes" : "Add expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
