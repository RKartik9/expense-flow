"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, TIMEZONES } from "@/lib/format";
import { updateProfile, type ProfileInput } from "@/lib/actions/user";

interface Props {
  initial: ProfileInput & { email: string };
}

const PREF_LABELS: { key: keyof ProfileInput["notificationPrefs"]; label: string; hint: string }[] = [
  { key: "emailReminders", label: "Payment reminders", hint: "Emails about pending payments and settlements" },
  { key: "splitNotifications", label: "Split notifications", hint: "Emails when you are added to a split" },
  { key: "weeklySummary", label: "Weekly summary", hint: "Your weekly expense summary every Monday" },
  { key: "monthlyReport", label: "Monthly report", hint: "Your monthly financial report" },
];

export function SettingsForm({ initial }: Props) {
  const [form, setForm] = useState<ProfileInput>({
    name: initial.name,
    currency: initial.currency,
    timezone: initial.timezone,
    notificationPrefs: initial.notificationPrefs,
  });
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await updateProfile(form);
      if (res.success) toast.success("Settings saved");
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={initial.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Preferred currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm({ ...form, currency: v as ProfileInput["currency"] })}
            >
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
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm({ ...form, timezone: v as ProfileInput["timezone"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email notifications</CardTitle>
          <CardDescription>Choose which emails you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREF_LABELS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={form.notificationPrefs[key]}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    notificationPrefs: { ...form.notificationPrefs, [key]: checked },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
