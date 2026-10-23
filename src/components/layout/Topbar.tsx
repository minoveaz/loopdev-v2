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
  Building2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { MessagesMenu } from "./MessagesMenu";
import { CommandMenu } from "./CommandMenu";
import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoSpinner } from "@/loopdev/components";
import { useI18n } from "@/i18n";
import { getWebUserPreferencesAdapter } from "@/loopdev/domains/platform/adapter/user-preferences";
import type { UserPreferencesSyncResult } from "../../../packages/contracts/src/user-preferences-sync";
import type { Organization } from "@contracts/auth-port";
import { accountDestinations } from "../../../packages/contracts/src/account-navigation";

interface TopbarProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

function preferenceMutationId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
}

export function Topbar({ onSidebarToggle, sidebarCollapsed }: TopbarProps) {
  const { session, signOut } = useAuth();
  const {
    activeOrganization,
    isSuperAdmin,
    listOrganizations,
    selectOrganization,
  } = useTenantContext();

  const navigate = useNavigate();
  const { lang, setLang, t, languages } = useI18n();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState<{ isSwitching: boolean; orgName: string } | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    void listOrganizations().then((res) => {
      if (res.success) {
        setAvailableOrgs(res.data);
      }
    });
  }, [listOrganizations, session]);

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

  const pickLang = async (code: typeof languages[number]["code"]) => {
    if (code === lang) return;
    const l = languages.find((x) => x.code === code);
    const successMessage = t("topbar.languageSet", { name: l?.label ?? code });
    if (!session) {
      setLang(code);
      toast.success(successMessage);
      return;
    }

    try {
      const adapter = getWebUserPreferencesAdapter();
      const pending = await adapter.pendingForCurrentUser();
      let current: UserPreferencesSyncResult | null = pending
        ? await adapter.retryPending(lang)
        : null;
      if (!current) current = await adapter.read(lang);

      if (current.success && current.state === "pending_sync") {
        toast.error(t("common.accountPreferences.saveError"), {
          description: current.message,
        });
        return;
      }
      if (current.success === false) {
        toast.error(t("common.accountPreferences.saveError"), {
          description: current.error.message,
        });
        return;
      }

      let result = await adapter.patch({
        patch: { language: code },
        expectedVersion: current.preferences.version,
        mutationId: preferenceMutationId(),
      });
      if (!result.success && result.state === "conflict") {
        result = await adapter.patch({
          patch: { language: code },
          expectedVersion: result.latest.version,
          mutationId: preferenceMutationId(),
        });
      }
      if (result.success === false) {
        toast.error(t("common.accountPreferences.saveError"), {
          description: result.error.message,
        });
        return;
      }

      setLang(code);
      if (result.state === "pending_sync") {
        toast(t("common.accountPreferences.pending"));
      } else {
        toast.success(successMessage);
      }
    } catch (cause) {
      toast.error(t("common.accountPreferences.saveError"), {
        description: cause instanceof Error ? cause.message : undefined,
      });
    }
  };

  const handleSignOut = () => {
    toast.dismiss();
    setConfirmLogoutOpen(false);
    setSigningOut(true);
    setTimeout(async () => {
      await signOut();
      navigate("/pages/login", { replace: true });
    }, 850);
  };

  const handleOrgSwitch = async (orgId: string, orgName: string) => {
    if (orgId === activeOrganization?.id) return;
    toast.dismiss();
    setSwitchingOrg({ isSwitching: true, orgName });
    const res = await selectOrganization(orgId);
    if (res.success) {
      const orgsRes = await listOrganizations();
      if (orgsRes.success) setAvailableOrgs(orgsRes.data);
      setTimeout(() => {
        setSwitchingOrg(null);
        navigate("/launchpad", { replace: true });
        toast.success(`Switched to ${orgName}`, {
          description: "Workspace reloaded & local tenant caches purged.",
        });
      }, 750);
    } else {
      setSwitchingOrg(null);
      toast.error("Failed to switch organization", {
        description: (res as { error: { message: string } }).error.message,
      });
    }
  };

  const initials = (session?.name ?? "AD")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const currentLang = languages.find((l) => l.code === lang) ?? languages[0];

  return (
    <header data-app-topbar className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-border/70 bg-card px-4 md:gap-3 md:px-6">
      <button
        onClick={onSidebarToggle}
        aria-label={sidebarCollapsed ? t("topbar.expandSidebar") : t("topbar.collapseSidebar")}
        aria-pressed={sidebarCollapsed}
        aria-controls="app-sidebar"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden nav:flex"
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
      </button>

      <div className="hidden min-w-0 md:flex md:flex-1 md:max-w-sm">
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

      <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 md:ms-auto md:flex-none md:shrink-0 md:gap-1">
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

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-border/70 md:block" />

        {/* User Profile & Organization Dropdown (matching desktop-account-org-selector.svg) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-w-0 max-w-[min(18rem,32vw)] items-center gap-2.5 rounded-lg border border-border/70 bg-card/60 py-1 ps-1 pe-3 transition-smooth hover:border-border hover:bg-muted/70">
              <Avatar className="h-7 w-7 ring-1 ring-border/60">
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 text-start leading-tight md:block">
                <p className="truncate text-[13px] font-semibold text-foreground">{session?.name ?? t("common.guest")}</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                  {isSuperAdmin ? "Super Admin" : (session?.role ?? "viewer")}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{session?.name ?? t("common.guest")}</span>
                {isSuperAdmin && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                    Global Owner
                  </span>
                )}
              </div>
              <span className="text-xs font-normal text-muted-foreground">{session?.email ?? t("common.notSignedIn")}</span>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* Embedded Organization Switcher inside Account menu */}
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Active Organization</span>
                {isSuperAdmin && <span className="text-primary font-semibold">Global Access</span>}
              </div>
              <div className="space-y-1">
                {availableOrgs.map((org) => {
                  const isActive = org.id === activeOrganization?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id, org.name)}
                      className={`flex w-full items-center justify-between rounded-md p-2 text-start text-xs transition-colors ${
                        isActive
                          ? "border border-primary/50 bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                          {org.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate">{org.name}</span>
                      </div>
                      {isActive ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to={accountDestinations.profile.path} className="gap-2">
                <User className="h-4 w-4" />
                {t("common.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={accountDestinations.settings.path} className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                {t("common.accountSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={accountDestinations.security.path} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("common.security")}
              </Link>
            </DropdownMenuItem>
            {accountDestinations.billing.enabled ? (
              <DropdownMenuItem asChild>
                <Link to={accountDestinations.billing.path} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t("common.billing")}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="gap-2">
                <CreditCard className="h-4 w-4" />
                {t("common.billing")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmLogoutOpen(true)}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <LogOut className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-center text-lg font-semibold">
                Sign out of LoopDev?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-sm text-muted-foreground">
                You will be signed out from your active workspace and organization. Any unsaved data will be cleared from cache.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialogCancel className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {signingOut && (
          <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-5">
              <LogoSpinner size="2xl" speed="fast" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground tracking-tight">Signing out of LoopDev...</p>
                <p className="text-xs text-muted-foreground">Purging local tenant cache and session security tokens...</p>
              </div>
            </div>
          </div>
        )}

        {switchingOrg && (
          <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-5">
              <LogoSpinner size="2xl" speed="fast" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground tracking-tight">
                  Switching to {switchingOrg.orgName}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Purging local cache and reloading workspace launchpad...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
