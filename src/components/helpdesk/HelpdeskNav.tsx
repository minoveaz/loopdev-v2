import { NavLink } from "react-router-dom";
import { BookOpen, LifeBuoy, Sparkles, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

const TABS = [
  { to: "/helpdesk/support", key: "support", icon: LifeBuoy },
  { to: "/helpdesk/documentation", key: "documentation", icon: BookOpen },
  { to: "/helpdesk/tickets", key: "tickets", icon: Ticket },
  { to: "/helpdesk/changelog", key: "changelog", icon: Sparkles },
] as const;

export function HelpdeskNav() {
  const t = useT();
  return (
    <nav
      aria-label={t("helpdesk.sectionsLabel")}
      className="-mx-1 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1"
    >
      {TABS.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/helpdesk/documentation" ? false : true}
          className={({ isActive }) =>
            cn(
              "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-fast sm:flex-initial",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span>{t(`helpdesk.${key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}