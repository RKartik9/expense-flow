"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory, type CategoryItem } from "@/lib/actions/categories";

const COLORS = [
  "#f97316", "#0ea5e9", "#ec4899", "#8b5cf6", "#eab308",
  "#f43f5e", "#ef4444", "#14b8a6", "#6366f1", "#22c55e", "#64748b",
];

export function ManageCategoriesDialog({
  categories,
  trigger,
}: {
  categories: CategoryItem[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [pending, startTransition] = useTransition();

  const add = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createCategory({ name: name.trim(), color, icon: "circle" });
      if (res.success) {
        toast.success("Category created");
        setName("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success("Category deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add} disabled={pending || !name.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "var(--foreground)" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {categories.map((c) => (
              <div key={c._id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                {c.isDefault ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Default
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(c._id)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
