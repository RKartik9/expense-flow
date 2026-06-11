"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { UploadButton } from "@/lib/uploadthing";
import { formatCurrency } from "@/lib/format";
import { recordPayment } from "@/lib/actions/splits";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
] as const;

interface Props {
  splitId: string;
  participantId: string;
  participantName: string;
  outstanding: number;
  currency: string;
  trigger: React.ReactNode;
}

export function RecordPaymentDialog({
  splitId,
  participantId,
  participantName,
  outstanding,
  currency,
  trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("upi");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return toast.error("Enter a valid amount");
    startTransition(async () => {
      const res = await recordPayment({
        splitId,
        participantId,
        amount: value,
        method,
        proofUrl,
        note: note.trim() || undefined,
      });
      if (res.success) {
        toast.success("Payment recorded");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {participantName} owes {formatCurrency(outstanding, currency)}. Record a full or
            partial payment.
          </p>
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0"
              max={outstanding}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-note">Note</Label>
            <Textarea
              id="pay-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment proof</Label>
            {proofUrl ? (
              <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <a href={proofUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                  View proof
                </a>
                <Button type="button" variant="ghost" size="sm" onClick={() => setProofUrl("")}>
                  Remove
                </Button>
              </div>
            ) : (
              <UploadButton
                endpoint="paymentProof"
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.ufsUrl) setProofUrl(res[0].ufsUrl);
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
          <Button className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Recording..." : "Record payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
