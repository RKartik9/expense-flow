"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, ShieldCheck, Shield, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { changeMemberRole, removeMember, type GroupMemberItem } from "@/lib/actions/groups";

interface Props {
  groupId: string;
  members: GroupMemberItem[];
  myRole: "owner" | "admin" | "member";
}

export function MemberList({ groupId, members, myRole }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canManage = myRole === "owner" || myRole === "admin";

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

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member._id} className="flex items-center gap-3 rounded-lg border p-2.5">
          <Avatar className="size-8">
            <AvatarImage src={member.imageUrl} alt={member.name} />
            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
          {member.status === "invited" && <Badge variant="outline">Invited</Badge>}
          <Badge variant="secondary" className="capitalize">
            {member.role}
          </Badge>
          {canManage && member.role !== "owner" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" disabled={pending}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {myRole === "owner" &&
                  (member.role === "member" ? (
                    <DropdownMenuItem
                      onClick={() =>
                        act(() => changeMemberRole(groupId, member._id, "admin"), "Promoted to admin")
                      }
                    >
                      <ShieldCheck className="size-4" /> Make admin
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() =>
                        act(() => changeMemberRole(groupId, member._id, "member"), "Demoted to member")
                      }
                    >
                      <Shield className="size-4" /> Make member
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => act(() => removeMember(groupId, member._id), "Member removed")}
                >
                  <UserMinus className="size-4" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}
