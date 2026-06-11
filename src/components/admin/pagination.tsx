import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminPagination({
  page,
  pageCount,
  basePath,
  extraParams = {},
}: {
  page: number;
  pageCount: number;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams({ ...extraParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1}>
          <ChevronLeft className="size-4" /> Prev
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Button variant="outline" size="sm" asChild disabled={page >= pageCount}>
        <Link href={href(Math.min(pageCount, page + 1))} aria-disabled={page >= pageCount}>
          Next <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
