import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/common";
import { UserProfileLayout } from "./_layout";
import { useLocalStore } from "@/lib/localStore";
import { customersStore } from "@/data";
import { getInitials } from "@/lib/formatters";

export default function UserProfileFollowers() {
  const customers = useLocalStore(customersStore);
  const followers = customers.slice(0, 12);
  return (
    <UserProfileLayout title="Followers" description="People who follow your activity.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {followers.map((f) => (
          <DataCard key={f.id}>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border"><AvatarFallback className="bg-primary-soft text-primary">{getInitials(f.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">{f.email}</p>
              </div>
              <Button size="sm" variant="outline">Follow</Button>
            </div>
          </DataCard>
        ))}
      </div>
    </UserProfileLayout>
  );
}