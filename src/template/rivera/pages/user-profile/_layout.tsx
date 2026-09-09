import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/user-profile/overview", label: "Overview" },
  { to: "/user-profile/activity", label: "Activity" },
  { to: "/user-profile/followers", label: "Followers" },
  { to: "/user-profile/contacts", label: "Contacts" },
  { to: "/user-profile/projects", label: "Projects" },
  { to: "/user-profile/gallery", label: "Gallery" },
];

export function UserProfileLayout({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  const { trail } = useBreadcrumbs();
  const { session } = useAuth();
  const name = session?.name ?? "Aria Bennet";
  const email = session?.email ?? "aria@rivera.app";
  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User profile"
        title={title}
        description={description}
        breadcrumbs={trail.length ? trail : [{ label: "User Profile" }, { label: title }]}
      />
      <DataCard>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone="success" dot>Active</StatusBadge>
              <StatusBadge tone="primary">Founder</StatusBadge>
              <span className="text-xs text-muted-foreground">Joined Mar 2024</span>
            </div>
          </div>
        </div>
        <div className="-mb-1 mt-5 flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) => cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-fast",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >{t.label}</NavLink>
          ))}
        </div>
      </DataCard>
      {children}
    </PageContainer>
  );
}