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
import { UploadButton } from "@/lib/uploadthing";
import { createGroup, updateGroup, type GroupInput } from "@/lib/actions/groups";

interface Props {
  trigger: React.ReactNode;
  group?: { _id: string; name: string; description?: string; coverImageUrl?: string };
}

export function GroupDialog({ trigger, group }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(group?.coverImageUrl ?? "");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const payload: GroupInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      coverImageUrl,
    };
    startTransition(async () => {
      const res = group ? await updateGroup(group._id, payload) : await createGroup(payload);
      if (res.success) {
        toast.success(group ? "Group updated" : "Group created");
        setOpen(false);
        if (!group) {
          setName("");
          setDescription("");
          setCoverImageUrl("");
        }
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Edit group" : "Create group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Roommates, Goa Trip, Office Team..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-desc">Description</Label>
            <Textarea
              id="group-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
            />
          </div>
          <div className="space-y-2">
            <Label>Cover image</Label>
            {coverImageUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="h-32 w-full rounded-lg object-cover"
                />
                <Button variant="outline" size="sm" onClick={() => setCoverImageUrl("")}>
                  Remove image
                </Button>
              </div>
            ) : (
              <UploadButton
                endpoint="groupCover"
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.ufsUrl) setCoverImageUrl(res[0].ufsUrl);
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
            {pending ? "Saving..." : group ? "Save changes" : "Create group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
