"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { remindParticipant, deleteSplit } from "@/lib/actions/splits";

export function RemindButton({ splitId, participantId }: { splitId: string; participantId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await remindParticipant(splitId, participantId);
          if (res.success) toast.success("Reminder sent");
          else toast.error(res.error);
        })
      }
    >
      <BellRing className="size-3.5" /> Remind
    </Button>
  );
}

export function DeleteSplitButton({ splitId }: { splitId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteSplit(splitId);
          if (res.success) {
            toast.success("Split deleted");
            router.push("/splits");
          } else {
            toast.error(res.error);
          }
        })
      }
    >
      <Trash2 className="size-3.5" /> Delete
    </Button>
  );
}
