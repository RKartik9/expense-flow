"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Plus, Trash2, CalendarSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CURRENCIES, formatCurrency } from "@/lib/format";
import {
  createSubscription,
  toggleSubscription,
  deleteSubscription,
  type SubscriptionItem,
} from "@/lib/actions/subscriptions";

const CYCLES = [
  { value: "weekly", label: "Weekly", perYear: 52 },
  { value: "monthly", label: "Monthly", perYear: 12 },
  { value: "quarterly", label: "Quarterly", perYear: 4 },
  { value: "yearly", label: "Yearly", perYear: 1 },
] as const;

export function SubscriptionsView({
  subscriptions,
  defaultCurrency,
}: {
  subscriptions: SubscriptionItem[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [billingCycle, setBillingCycle] = useState<SubscriptionItem["billingCycle"]>("monthly");
  const [nextRenewalAt, setNextRenewalAt] = useState("");
  const [reminderDays, setReminderDays] = useState("3");
  const [pending, startTransition] = useTransition();

  const annual = (s: SubscriptionItem) =>
    s.amount * (CYCLES.find((c) => c.value === s.billingCycle)?.perYear ?? 12);

  const activeSubs = subscriptions.filter((s) => s.active);
  const totalAnnual = activeSubs.reduce((sum, s) => sum + annual(s), 0);

  const save = () => {
    const value = parseFloat(amount);
    if (!name.trim()) return toast.error("Name is required");
    if (!value || value <= 0) return toast.error("Enter a valid amount");
    if (!nextRenewalAt) return toast.error("Pick the next renewal date");
    startTransition(async () => {
      const res = await createSubscription({
        name: name.trim(),
        amount: value,
        currency,
        billingCycle,
        nextRenewalAt,
        reminderDaysBefore: parseInt(reminderDays) || 3,
      });
      if (res.success) {
        toast.success("Subscription added");
        setOpen(false);
        setName("");
        setAmount("");
        setNextRenewalAt("");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Card className="flex-1">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
            <span className="text-muted-foreground">
              {activeSubs.length} active subscription{activeSubs.length === 1 ? "" : "s"}
            </span>
            <span>
              Annual spending:{" "}
              <strong>{formatCurrency(totalAnnual, defaultCurrency)}</strong>
            </span>
          </CardContent>
        </Card>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Add subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">Name</Label>
                <Input
                  id="sub-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Netflix, Spotify, AWS..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sub-amount">Amount</Label>
                  <Input
                    id="sub-amount"
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Billing cycle</Label>
                  <Select
                    value={billingCycle}
                    onValueChange={(v) => setBillingCycle(v as SubscriptionItem["billingCycle"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CYCLES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-renewal">Next renewal</Label>
                  <Input
                    id="sub-renewal"
                    type="date"
                    value={nextRenewalAt}
                    onChange={(e) => setNextRenewalAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-remind">Remind me (days before)</Label>
                <Input
                  id="sub-remind"
                  type="number"
                  min="0"
                  max="30"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={save} disabled={pending}>
                {pending ? "Saving..." : "Add subscription"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-xl border bg-background py-16 text-center">
          <CalendarSync className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium">No subscriptions tracked</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track Netflix, Spotify, AWS, and more — get reminded before renewals.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const daysLeft = differenceInDays(new Date(sub.nextRenewalAt), new Date());
            return (
              <Card key={sub._id} className={!sub.active ? "opacity-60" : undefined}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{sub.name}</CardTitle>
                  <Switch
                    checked={sub.active}
                    onCheckedChange={(checked) =>
                      act(
                        () => toggleSubscription(sub._id, checked),
                        checked ? "Subscription resumed" : "Subscription paused"
                      )
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCurrency(sub.amount, sub.currency)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / {sub.billingCycle.replace("ly", "")}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"}>
                      {daysLeft <= 0 ? "Due now" : `Renews in ${daysLeft}d`}
                    </Badge>
                    <span>{format(new Date(sub.nextRenewalAt), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>{formatCurrency(annual(sub), sub.currency)} / year</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:text-destructive"
                      onClick={() => act(() => deleteSubscription(sub._id), "Subscription deleted")}
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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
