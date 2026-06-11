"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-items";

const PRIMARY = NAV_ITEMS.slice(0, 4);
const REST = NAV_ITEMS.slice(4);

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {PRIMARY.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.title}
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
            <Menu className="size-5" />
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetTitle className="px-2 pt-2">More</SheetTitle>
            <div className="grid grid-cols-3 gap-2 p-2">
              {[...REST, ...(isAdmin ? [{ title: "Admin", href: "/admin", icon: Menu }] : [])].map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <item.icon className="size-5" />
                    {item.title}
                  </Link>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
