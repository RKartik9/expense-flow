import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/emails", label: "Email Logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <>
      <PageHeader title="Admin" description="Platform management and analytics." />
      <nav className="mb-6 flex flex-wrap gap-1 rounded-lg border bg-background p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
