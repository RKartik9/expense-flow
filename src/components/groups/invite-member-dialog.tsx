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
import { inviteMember } from "@/lib/actions/groups";

export function InviteMemberDialog({ groupId, trigger }: { groupId: string; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await inviteMember(groupId, email);
      if (res.success) {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
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
          <DialogTitle>Invite member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll email them an invitation. If they already have an account, they&apos;re
              added instantly.
            </p>
          </div>
          <Button className="w-full" onClick={submit} disabled={pending || !email.includes("@")}>
            {pending ? "Sending..." : "Send invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
