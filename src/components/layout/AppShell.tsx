import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { RiveraShell } from "@/template/rivera/RiveraShell";
import { LoopdevShell } from "@/loopdev/LoopdevShell";
import { Topbar } from "./Topbar";
import { AppFooter } from "./AppFooter";
import { ThemeCustomizerFab } from "@/components/theme/ThemeCustomizer";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useTheme } from "@/hooks/use-theme";
import { useThemeConfig } from "@/hooks/useThemeConfig";

export function AppShell() {
  const { collapsed, setCollapsed, toggle } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { t, lang, dir } = useI18n();
  const { theme } = useTheme();
  const { config } = useThemeConfig();
  const savedOverflow = useRef<string | null>(null);
  const previousCommunicationsSidebarState = useRef<boolean | null>(null);
  const isLoopdevWorkspace = pathname === "/launchpad" || pathname.startsWith("/app/");
  const isCommunicationsRoute = pathname.startsWith("/app/sales-crm/communications");

  // Communications is a full-width workspace, so collapse the desktop
  // sidebar while it is active without changing the user's normal preference.
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1200px)").matches;
    if (isCommunicationsRoute && isDesktop) {
      if (previousCommunicationsSidebarState.current === null) {
        previousCommunicationsSidebarState.current = collapsed;
        setCollapsed(true);
      }
      return;
    }
    if (previousCommunicationsSidebarState.current !== null) {
      setCollapsed(previousCommunicationsSidebarState.current);
      previousCommunicationsSidebarState.current = null;
    }
  }, [collapsed, isCommunicationsRoute, setCollapsed]);

  // Centralized scroll-lock release. Always restores whatever inline value
  // was on <body> before we locked it (or clears it if none).
  const releaseScrollLock = () => {
    if (savedOverflow.current !== null) {
      document.body.style.overflow = savedOverflow.current;
      savedOverflow.current = null;
    } else {
      document.body.style.removeProperty("overflow");
    }
  };

  // Close mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Force-close + release lock on language flip, dir flip, theme mode flip,
  // or any appearance config change. The I18nProvider remounts the subtree
  // on `lang` change which can otherwise leave us with a stale lock if the
  // drawer was open mid-flip.
  useEffect(() => {
    setMobileOpen(false);
    releaseScrollLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, dir, theme, config]);

  // Esc closes mobile drawer; lock body scroll while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    savedOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseScrollLock();
    };
  }, [mobileOpen]);

  // If the viewport widens past the md breakpoint while the mobile drawer
  // is open, close it so we don't leave the body scroll locked and the
  // (now redundant) drawer rendered above the desktop sidebar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileOpen(false);
        releaseScrollLock();
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Final safety net: when AppShell unmounts (e.g. user signs out and the
  // shell is torn down), make sure we never leave <body> stuck with
  // overflow:hidden.
  useEffect(() => {
    return () => releaseScrollLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-surface text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-elegant"
      >
        {t("common.skipToContent")}
      </a>
      {isLoopdevWorkspace ? (
        <LoopdevShell
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      ) : (
        <RiveraShell
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}
      <div
        data-app-content
        data-sidebar-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[padding] duration-300",
          // Forced mini (60px) between md (768px) and nav (1200px).
          "md:ps-[60px]",
          // Above the nav breakpoint, respect the user's collapsed choice.
          collapsed ? "nav:ps-[60px]" : "nav:ps-[260px]",
        )}
      >
      <Topbar
        onSidebarToggle={() => {
          if (typeof window === "undefined") return;
          if (window.matchMedia("(min-width: 1200px)").matches) {
            // Large desktop: toggle full ↔ mini.
            toggle();
          } else if (window.matchMedia("(min-width: 768px)").matches) {
            // Laptop/tablet: sidebar is forced mini, nothing to toggle.
            return;
          } else {
            // Mobile: open drawer.
            setMobileOpen(true);
          }
        }}
        sidebarCollapsed={collapsed}
      />
        <main
          id="main-content"
          tabIndex={-1}
          key={isCommunicationsRoute ? undefined : pathname}
          className="flex-1 animate-fade-in px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-7 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
        <AppFooter />
      </div>
      {!pathname.startsWith("/launchpad") && !isCommunicationsRoute && <ThemeCustomizerFab />}
    </div>
  );
}
