"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, UserPlus, Check, X, UserMinus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  type FriendsData,
  type FriendUser,
} from "@/lib/actions/friends";

function UserRow({ user, children }: { user: FriendUser; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
      <Avatar>
        <AvatarImage src={user.imageUrl} alt={user.name} />
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      {children}
    </div>
  );
}

export function FriendsView({ data, initialQuery }: { data: FriendsData; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchUsers(value));
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const act = (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  };

  const friendIds = new Set(data.friends.map((f) => f._id));
  const outgoingIds = new Set(data.outgoing.map((o) => o.recipient._id));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4" /> Find people
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search by name or email..."
          />
          {searching && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="space-y-2">
            {results.map((u) => (
              <UserRow key={u._id} user={u}>
                {friendIds.has(u._id) ? (
                  <Badge variant="secondary">Friends</Badge>
                ) : outgoingIds.has(u._id) ? (
                  <Badge variant="outline">Requested</Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => act(() => sendFriendRequest(u._id), "Friend request sent")}
                  >
                    <UserPlus className="size-4" /> Add
                  </Button>
                )}
              </UserRow>
            ))}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your network</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends">
            <TabsList className="w-full">
              <TabsTrigger value="friends" className="flex-1">
                Friends ({data.friends.length})
              </TabsTrigger>
              <TabsTrigger value="incoming" className="flex-1">
                Requests {data.incoming.length > 0 && `(${data.incoming.length})`}
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="flex-1">
                Sent {data.outgoing.length > 0 && `(${data.outgoing.length})`}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="friends" className="mt-3 space-y-2">
              {data.friends.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No friends yet. Search for people to add them.
                </p>
              )}
              {data.friends.map((f) => (
                <UserRow key={f._id} user={f}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={pending}
                    onClick={() => act(() => removeFriend(f._id), "Friend removed")}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                </UserRow>
              ))}
            </TabsContent>
            <TabsContent value="incoming" className="mt-3 space-y-2">
              {data.incoming.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No pending requests.
                </p>
              )}
              {data.incoming.map((r) => (
                <UserRow key={r._id} user={r.requester}>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => act(() => respondToFriendRequest(r._id, true), "Request accepted")}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => act(() => respondToFriendRequest(r._id, false), "Request rejected")}
                  >
                    <X className="size-4" />
                  </Button>
                </UserRow>
              ))}
            </TabsContent>
            <TabsContent value="outgoing" className="mt-3 space-y-2">
              {data.outgoing.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No sent requests.</p>
              )}
              {data.outgoing.map((r) => (
                <UserRow key={r._id} user={r.recipient}>
                  <Badge variant="outline">Pending</Badge>
                </UserRow>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
