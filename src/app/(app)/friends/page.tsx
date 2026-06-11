import type { Metadata } from "next";
import { getFriendsData } from "@/lib/actions/friends";
import { PageHeader } from "@/components/page-header";
import { FriendsView } from "@/components/friends/friends-view";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, data] = await Promise.all([searchParams, getFriendsData()]);

  return (
    <>
      <PageHeader
        title="Friends"
        description="Add friends to split bills with them faster."
      />
      <FriendsView data={data} initialQuery={q} />
    </>
  );
}
