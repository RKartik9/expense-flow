"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt, Users, Split, Tag, User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

const ICONS = {
  expense: Receipt,
  group: Users,
  split: Split,
  category: Tag,
  user: User,
} as const;

const TYPE_LABELS = {
  expense: "Expenses",
  group: "Groups",
  split: "Splits",
  category: "Categories",
  user: "People",
} as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await globalSearch(value));
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-xs justify-start gap-2 text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Global search</DialogTitle>
          </DialogHeader>
          <Command shouldFilter={false} className="**:data-[slot=command-input-wrapper]:h-12">
            <CommandInput
              placeholder="Search expenses, groups, splits, people..."
              value={query}
              onValueChange={runSearch}
            />
            <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : query.length < 2 ? "Type to search" : "No results found."}
          </CommandEmpty>
          {Object.entries(grouped).map(([type, items]) => {
            const Icon = ICONS[type as keyof typeof ICONS];
            return (
              <CommandGroup key={type} heading={TYPE_LABELS[type as keyof typeof TYPE_LABELS]}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={`${item.type}-${item.id}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.link);
                    }}
                  >
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
