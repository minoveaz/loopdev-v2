import { BookOpen, ChevronDown, LifeBuoy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n";

const links: { to: string; key: "docs" | "changelog" | "support"; icon: typeof BookOpen }[] = [
  { to: "/helpdesk/documentation", key: "docs", icon: BookOpen },
  { to: "/helpdesk/changelog", key: "changelog", icon: Sparkles },
  { to: "/helpdesk/support", key: "support", icon: LifeBuoy },
];

export function AppFooter() {
  const year = new Date().getFullYear();
  const t = useT();
  return (
    <footer className="mt-auto border-t border-border bg-card-muted/60 px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-foreground">Loopdev</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            v0.0.1
          </span>
          <span className="hidden sm:inline">· {t("footer.copyright", { year })}</span>
        </div>
        <nav aria-label={t("footer.resources")} className="flex items-center justify-center gap-1">
          {/* Compact dropdown on small screens */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-medium transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <BookOpen className="h-3.5 w-3.5" />
                {t("footer.resources")}
                <ChevronDown className="h-3 w-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("footer.resources")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map(({ to, key, icon: Icon }) => (
                  <DropdownMenuItem key={to} asChild>
                    <Link to={to} className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t(`footer.${key}`)}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground/80">
                  <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  {t("footer.allSystemsNormal")}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Inline links on sm+ */}
          <div className="hidden flex-wrap items-center gap-1 sm:flex">
            {links.map(({ to, key, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-3.5 w-3.5" />
                {t(`footer.${key}`)}
              </Link>
            ))}
            <span aria-hidden className="mx-1 h-3 w-px bg-border" />
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground/80">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              {t("footer.allSystemsNormal")}
            </span>
          </div>
        </nav>
      </div>
    </footer>
  );
}
