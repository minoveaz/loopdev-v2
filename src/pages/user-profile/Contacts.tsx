import { Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataCard, StatusBadge } from "@/components/common";
import { UserProfileLayout } from "./_layout";
import { useLocalStore } from "@/lib/localStore";
import { mockUsers, usersStore } from "@/data";
import { getInitials } from "@/lib/formatters";

export default function UserProfileContacts() {
  const users = useLocalStore(usersStore);
  const list = users.length ? users : mockUsers;
  return (
    <UserProfileLayout title="Contacts" description="Teammates and connections.">
      <DataCard>
        <ul className="divide-y divide-border">
          {list.slice(0, 14).map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar className="h-9 w-9 border border-border"><AvatarFallback className="bg-primary-soft text-primary text-[11px]">{getInitials(u.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.title ?? "Team member"}{u.department ? ` · ${u.department}` : ""}</p>
              </div>
              <a href={`mailto:${u.email}`} className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Mail className="h-3.5 w-3.5" />{u.email}</a>
              <StatusBadge tone={u.status === "active" ? "success" : "neutral"} dot>{u.status}</StatusBadge>
            </li>
          ))}
        </ul>
      </DataCard>
    </UserProfileLayout>
  );
}