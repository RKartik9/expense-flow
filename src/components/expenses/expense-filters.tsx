"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryItem } from "@/lib/actions/categories";

const ALL = "all";

export function ExpenseFilters({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const onSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value || null), 350);
  };

  const hasFilters = ["q", "category", "type", "from", "to", "min", "max"].some((k) =>
    searchParams.get(k)
  );

  return (
    <div className="mb-4 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
      <div className="relative col-span-2 sm:col-span-1 sm:w-56">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search expenses..."
          className="w-full pl-8"
        />
      </div>
      <Select
        value={searchParams.get("category") ?? ALL}
        onValueChange={(v) => setParam("category", v)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("type") ?? ALL} onValueChange={(v) => setParam("type", v)}>
        <SelectTrigger className="w-full sm:w-30">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="income">Income</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        className="w-full sm:w-36"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value || null)}
        aria-label="From date"
      />
      <Input
        type="date"
        className="w-full sm:w-36"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value || null)}
        aria-label="To date"
      />
      <Input
        type="number"
        placeholder="Min"
        className="w-full sm:w-20"
        defaultValue={searchParams.get("min") ?? ""}
        onBlur={(e) => setParam("min", e.target.value || null)}
        aria-label="Min amount"
      />
      <Input
        type="number"
        placeholder="Max"
        className="w-full sm:w-20"
        defaultValue={searchParams.get("max") ?? ""}
        onBlur={(e) => setParam("max", e.target.value || null)}
        aria-label="Max amount"
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 sm:col-span-1"
          onClick={() => {
            setQ("");
            router.replace(pathname);
          }}
        >
          <X className="size-4" /> Clear
        </Button>
      )}
    </div>
  );
}
