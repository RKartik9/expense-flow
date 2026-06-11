import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Receipt,
  Users,
  PieChart,
  Split,
  BellRing,
  Wallet,
  ShieldCheck,
  Repeat,
} from "lucide-react";

const features = [
  {
    icon: Receipt,
    title: "Expense Tracking",
    description: "Log daily expenses with categories, tags, receipts, and payment methods.",
  },
  {
    icon: Split,
    title: "Smart Bill Splitting",
    description: "Split equally, by percentage, or exact amounts with friends and groups.",
  },
  {
    icon: Users,
    title: "Groups & Teams",
    description: "Family, roommates, trips, office — manage shared expenses in one place.",
  },
  {
    icon: PieChart,
    title: "Analytics Dashboard",
    description: "Trends, category breakdowns, heatmaps, and monthly comparisons.",
  },
  {
    icon: BellRing,
    title: "Automated Reminders",
    description: "Email reminders for pending payments, renewals, and weekly summaries.",
  },
  {
    icon: Wallet,
    title: "Budgets",
    description: "Set monthly category budgets and get alerts before you overspend.",
  },
  {
    icon: Repeat,
    title: "Recurring & Subscriptions",
    description: "Auto-track rent, EMIs, Netflix, AWS — never miss a renewal.",
  },
  {
    icon: ShieldCheck,
    title: "Debt Simplification",
    description: "Our settlement engine minimizes transactions when settling up.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-heading text-lg tracking-wide">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Split className="size-4" />
            </div>
            ExpenseFlow
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <div className="mx-auto mb-6 w-fit rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            Track. Split. Settle. All in one place.
          </div>
          <h1 className="mx-auto max-w-3xl text-balance bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text font-heading text-4xl tracking-wide text-transparent uppercase sm:text-6xl">
            Money management for you and your people
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            ExpenseFlow combines daily expense tracking, group bill splitting, debt
            simplification, budgets, and automated email reminders — so nobody has to chase
            anybody for money again.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start for free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center font-heading text-3xl tracking-wide">
              Everything your wallet needs
            </h2>
            <p className="mt-3 text-center text-muted-foreground">
              A complete toolkit for personal and shared finances.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border bg-background p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 text-center">
          <h2 className="font-heading text-3xl tracking-wide">Ready to settle up?</h2>
          <p className="mt-3 text-muted-foreground">
            Join ExpenseFlow today — free while in beta.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Create your account <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        ExpenseFlow — built with Next.js, MongoDB, Clerk, and Resend.
      </footer>
    </div>
  );
}
