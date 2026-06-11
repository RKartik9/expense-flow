"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, UserPlus, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, formatCurrency } from "@/lib/format";
import { computeShares, type SplitType } from "@/lib/settlement/split-math";
import { createSplit } from "@/lib/actions/splits";

export interface PersonOption {
  email: string;
  name: string;
}

export interface GroupOption {
  _id: string;
  name: string;
  members: PersonOption[];
}

interface Participant {
  email: string;
  name: string;
  value?: number;
}

interface Props {
  myEmail: string;
  myName: string;
  defaultCurrency: string;
  friends: PersonOption[];
  groups: GroupOption[];
  initialGroupId?: string;
}

export function SplitForm({ myEmail, myName, defaultCurrency, friends, groups, initialGroupId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [groupId, setGroupId] = useState(initialGroupId ?? "");
  const [emailInput, setEmailInput] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const initialGroup = groups.find((g) => g._id === initialGroupId);
    if (initialGroup) {
      return initialGroup.members.map((m) => ({ email: m.email, name: m.name }));
    }
    return [{ email: myEmail, name: `${myName} (you)` }];
  });
  const [pending, startTransition] = useTransition();

  const amount = parseFloat(totalAmount) || 0;

  const addParticipant = (p: PersonOption) => {
    const email = p.email.toLowerCase();
    if (participants.some((x) => x.email === email)) return;
    setParticipants([...participants, { email, name: p.name }]);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    addParticipant({ email, name: email.split("@")[0] });
    setEmailInput("");
  };

  const selectGroup = (id: string) => {
    setGroupId(id);
    const group = groups.find((g) => g._id === id);
    if (group) {
      const merged = new Map<string, Participant>();
      [{ email: myEmail, name: `${myName} (you)` }, ...group.members].forEach((m) =>
        merged.set(m.email.toLowerCase(), { email: m.email.toLowerCase(), name: m.name })
      );
      setParticipants(Array.from(merged.values()));
    }
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const setValue = (email: string, value: string) => {
    setParticipants(
      participants.map((p) =>
        p.email === email ? { ...p, value: value === "" ? undefined : parseFloat(value) } : p
      )
    );
  };

  const preview = useMemo(() => {
    if (amount <= 0 || participants.length === 0) return null;
    try {
      return computeShares(
        splitType,
        amount,
        participants.map((p) => ({ key: p.email, value: p.value }))
      );
    } catch {
      return null;
    }
  }, [amount, participants, splitType]);

  const valueSum = participants.reduce((s, p) => s + (p.value ?? 0), 0);

  const submit = () => {
    if (!title.trim()) return toast.error("Title is required");
    if (amount <= 0) return toast.error("Enter a valid amount");
    if (participants.length < 2) return toast.error("Add at least one other participant");
    if (splitType === "percentage" && Math.abs(valueSum - 100) > 0.01)
      return toast.error(`Percentages must total 100% (currently ${valueSum}%)`);
    if (splitType === "exact" && Math.abs(valueSum - amount) > 0.01)
      return toast.error(`Exact amounts must total ${amount} (currently ${valueSum})`);

    startTransition(async () => {
      const res = await createSplit({
        title: title.trim(),
        description: description.trim() || undefined,
        totalAmount: amount,
        currency,
        splitType,
        date,
        groupId: groupId || null,
        receiptUrl: "",
        participants: participants.map((p) => ({
          email: p.email,
          name: p.name.replace(" (you)", ""),
          value: p.value,
        })),
      });
      if (res.success && res.data) {
        toast.success("Split created");
        router.push(`/splits/${res.data.id}`);
      } else if (!res.success) {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="split-title">Title</Label>
              <Input
                id="split-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dinner at Olive Garden"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="split-amount">Total amount</Label>
                <Input
                  id="split-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="1000"
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
                <Label htmlFor="split-date">Date</Label>
                <Input
                  id="split-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Group (optional)</Label>
                <Select value={groupId || "none"} onValueChange={(v) => selectGroup(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g._id} value={g._id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-desc">Notes</Label>
              <Textarea
                id="split-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                  placeholder="Add by email..."
                />
              </div>
              <Button type="button" variant="outline" onClick={addEmail}>
                <UserPlus className="size-4" /> Add
              </Button>
            </div>

            {friends.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" /> From friends
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {friends.map((f) => {
                    const added = participants.some((p) => p.email === f.email.toLowerCase());
                    return (
                      <button
                        key={f.email}
                        type="button"
                        disabled={added}
                        onClick={() => addParticipant(f)}
                        className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.email} className="flex items-center gap-2 rounded-lg border p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  {splitType !== "equal" && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 w-24 text-right"
                        placeholder={splitType === "percentage" ? "%" : "Amount"}
                        value={p.value ?? ""}
                        onChange={(e) => setValue(p.email, e.target.value)}
                      />
                      {splitType === "percentage" && (
                        <span className="text-xs text-muted-foreground">%</span>
                      )}
                    </div>
                  )}
                  {p.email !== myEmail && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() => removeParticipant(p.email)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {splitType === "percentage" && (
              <p className="text-xs text-muted-foreground">
                Total: <strong>{valueSum}%</strong> of 100%
              </p>
            )}
            {splitType === "exact" && (
              <p className="text-xs text-muted-foreground">
                Total: <strong>{formatCurrency(valueSum, currency)}</strong> of{" "}
                {formatCurrency(amount, currency)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Split type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={splitType} onValueChange={(v) => setSplitType(v as SplitType)}>
              <TabsList className="w-full">
                <TabsTrigger value="equal" className="flex-1">
                  Equal
                </TabsTrigger>
                <TabsTrigger value="percentage" className="flex-1">
                  Percentage
                </TabsTrigger>
                <TabsTrigger value="exact" className="flex-1">
                  Exact
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="mt-3 text-xs text-muted-foreground">
              {splitType === "equal" && "Everyone pays the same share."}
              {splitType === "percentage" && "Assign a percentage to each participant (must total 100%)."}
              {splitType === "exact" && "Assign an exact amount to each participant (must total the bill)."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!preview ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Enter an amount and participants to preview shares.
              </p>
            ) : (
              <div className="space-y-2">
                {preview.map((share) => {
                  const p = participants.find((x) => x.email === share.key);
                  return (
                    <div key={share.key} className="flex items-center justify-between text-sm">
                      <span className="truncate">{p?.name ?? share.key}</span>
                      <span className="flex items-center gap-2">
                        {share.percentage != null && (
                          <Badge variant="secondary">{share.percentage}%</Badge>
                        )}
                        <strong className="tabular-nums">
                          {formatCurrency(share.shareAmount, currency)}
                        </strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={submit} disabled={pending}>
          {pending ? "Creating..." : "Create split"}
        </Button>
      </div>
    </div>
  );
}
