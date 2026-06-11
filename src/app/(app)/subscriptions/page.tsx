import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSubscriptions } from "@/lib/actions/subscriptions";
import { PageHeader } from "@/components/page-header";
import { SubscriptionsView } from "@/components/subscriptions/subscriptions-view";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const user = await requireUser();
  const subscriptions = await getSubscriptions();

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Track renewals and never get surprised by a charge."
      />
      <SubscriptionsView subscriptions={subscriptions} defaultCurrency={user.currency} />
    </>
  );
}
