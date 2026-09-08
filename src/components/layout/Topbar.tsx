import {
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { MessagesMenu } from "./MessagesMenu";
import { CommandMenu } from "./CommandMenu";
import { ThemeCustomizerTrigger } from "@/components/theme/ThemeCustomizer";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n";

interface TopbarProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onSidebarToggle, sidebarCollapsed }: TopbarProps) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang, t, languages } = useI18n();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pickLang = (code: typeof languages[number]["code"]) => {
    setLang(code);
    const l = languages.find((x) => x.code === code);
    toast.success(t("topbar.languageSet", { name: l?.label ?? code }));
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out", { description: "See you soon." });
    navigate("/pages/login", { replace: true });
  };

  const initials = (session?.name ?? "RA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentLang = languages.find((l) => l.code === lang) ?? languages[0];

  return (
    <header data-app-topbar className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 bg-card px-4 md:gap-3 md:px-6">
      <button
        onClick={onSidebarToggle}
        aria-label={sidebarCollapsed ? t("topbar.expandSidebar") : t("topbar.collapseSidebar")}
        aria-pressed={sidebarCollapsed}
        aria-controls="app-sidebar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden nav:flex"
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
      </button>

      <div className="hidden md:flex md:flex-1 md:max-w-sm">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          aria-label={t("topbar.openCommandMenu")}
          className="group relative flex h-9 w-full items-center rounded-lg border border-border bg-muted/50 ps-9 pe-14 text-start text-[13px] text-foreground/80 transition-smooth hover:border-border hover:bg-muted/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
          <span className="truncate">{t("common.search")}</span>
          <kbd className="pointer-events-none absolute end-2 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded-md border border-border/80 bg-card px-1.5 font-mono text-[10px] leading-none text-muted-foreground md:inline-flex">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        aria-label={t("topbar.openCommandMenu")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />

      <div className="flex flex-1 items-center justify-end gap-0.5 md:gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${t("common.language")}: ${currentLang.label}`}
            title={`${t("common.language")}: ${currentLang.label}`}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-sm text-foreground/90 transition-fast hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
          >
            <span aria-hidden="true" className="text-base leading-none">{currentLang.flag}</span>
            <span className="sr-only">{currentLang.label} ({currentLang.code})</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" aria-label={t("common.language")}>
            <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => pickLang(l.code)}
                className="gap-2"
                role="menuitemradio"
                aria-checked={lang === l.code}
                aria-label={`${l.label}${lang === l.code ? `, ${t("common.selected") || "selected"}` : ""}`}
              >
                <span aria-hidden="true" className="text-base leading-none">{l.flag}</span>
                <span className="flex-1" dir={l.dir} lang={l.code}>{l.label}</span>
                <span aria-hidden="true" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l.dir}</span>
                {lang === l.code && <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <MessagesMenu />
        <NotificationsMenu />
        <ThemeToggle />
        <ThemeCustomizerTrigger />

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-border/70 md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-card/60 py-1 ps-1 pe-3 transition-smooth hover:border-border hover:bg-muted/70">
              <Avatar className="h-7 w-7 ring-1 ring-border/60">
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-start leading-tight md:block">
                <p className="text-[13px] font-semibold text-foreground">{session?.name ?? t("common.guest")}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{session?.role ?? "viewer"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{session?.name ?? t("common.guest")}</span>
              <span className="text-xs font-normal text-muted-foreground">{session?.email ?? t("common.notSignedIn")}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account/profile" className="gap-2">
                <User className="h-4 w-4" />
                {t("common.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account/settings" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                {t("common.accountSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account/security" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("common.security")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account/billing" className="gap-2">
                <CreditCard className="h-4 w-4" />
                {t("common.billing")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
