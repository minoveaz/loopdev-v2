import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ChevronDown,
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { launchpadNavigation, navigation } from "@/app/navigation";
import type { NavNode, NavSection } from "@/app/nav-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useT, useI18n } from "@/i18n";

function useNavLabel() {
  const t = useT();
  return (label: string) => {
    const translated = t(`nav.${label}`);
    // If the key was missing, our t() falls back to the key itself
    // (e.g. "nav.Dashboards"). Strip the prefix so we render the
    // original English label as a graceful default.
    return translated.startsWith("nav.") ? label : translated;
  };
}

function SectionLabel({ raw }: { raw: string }) {
  const tNav = useNavLabel();
  return <>{tNav(raw)}</>;
}

function nodeContainsActive(node: NavNode, pathname: string): boolean {
  if (node.to && (pathname === node.to || pathname.startsWith(node.to + "/"))) return true;
  return !!node.children?.some((c) => nodeContainsActive(c, pathname));
}

type FlatItem = {
  key: string;
  parent: string | null;
  level: number;
  hasChildren: boolean;
  node: NavNode;
};

function buildFlatNav(items: NavSection[]): FlatItem[] {
  const list: FlatItem[] = [];
  const walk = (node: NavNode, parent: string | null, level: number, baseKey: string) => {
    list.push({ key: baseKey, parent, level, hasChildren: !!node.children?.length, node });
    node.children?.forEach((c, i) => walk(c, baseKey, level + 1, `${baseKey}/${i}`));
  };
  items.forEach((section) => {
    section.items.forEach((item, i) => walk(item, null, 1, `${section.label}/${i}`));
  });
  return list;
}

interface NavController {
  openKeys: Set<string>;
  toggle: (key: string) => void;
  setOpen: (key: string, open: boolean) => void;
  focusedKey: string | null;
  setFocusedKey: (key: string) => void;
  registerRef: (key: string, el: HTMLElement | null) => void;
  onItemKeyDown: (e: ReactKeyboardEvent, key: string) => void;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  navigationOverride?: NavSection[];
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose, navigationOverride }: SidebarProps) {
  const { pathname } = useLocation();
  const { dir } = useI18n();
  const asideRef = useRef<HTMLElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Viewport tracking:
  // - isMobileViewport: < 768px → use drawer/dialog semantics.
  // - isForcedMini: 768px–1199px → sidebar is forced into mini mode.
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? !window.matchMedia("(min-width: 768px)").matches : false,
  );
  const [isForcedMini, setIsForcedMini] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(min-width: 1200px)").matches
    );
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqMobile = window.matchMedia("(min-width: 768px)");
    const mqLarge = window.matchMedia("(min-width: 1200px)");
    const sync = () => {
      setIsMobileViewport(!mqMobile.matches);
      setIsForcedMini(mqMobile.matches && !mqLarge.matches);
    };
    mqMobile.addEventListener("change", sync);
    mqLarge.addEventListener("change", sync);
    return () => {
      mqMobile.removeEventListener("change", sync);
      mqLarge.removeEventListener("change", sync);
    };
  }, []);
  // The `collapsed` prop only takes effect above the nav breakpoint.
  // Between md and nav we always render mini.
  const effectiveCollapsed = isForcedMini || collapsed;
  // When the writing direction flips (e.g. user switches between English and
  // Arabic) the closed-state transform jumps from `-translate-x-full` to
  // `+translate-x-full`. Without intervention the browser would animate that
  // change and we'd see the sidebar whoosh across the screen. We disable
  // transitions for one frame whenever `dir` changes to make the swap
  // instantaneous.
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevDir = useRef(dir);
  useEffect(() => {
    if (prevDir.current === dir) return;
    prevDir.current = dir;
    setSuppressTransition(true);
    const id = window.requestAnimationFrame(() => {
      // Two RAFs: first commits the flipped transform, second re-enables transitions.
      window.requestAnimationFrame(() => setSuppressTransition(false));
    });
    return () => window.cancelAnimationFrame(id);
  }, [dir]);

  // Mobile-drawer focus management:
  // - When the drawer opens, remember the element that opened it and move
  //   focus into the drawer (to the first focusable, e.g. a nav item).
  // - While open, trap Tab and Shift+Tab inside the aside.
  // - When it closes, restore focus to the opener.
  // ESC handling lives in AppShell so it can also tear down body scroll lock.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = () => !window.matchMedia("(min-width: 768px)").matches;
    if (!mobileOpen || !isMobile()) return;

    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null;

    const aside = asideRef.current;
    if (!aside) return;

    const focusables = () =>
      Array.from(
        aside.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      ).filter((el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null);

    // Defer initial focus a frame so the open transition has applied and
    // focusable elements are in the layout.
    const raf = window.requestAnimationFrame(() => {
      const list = focusables();
      (list[0] ?? aside).focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        aside.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !aside.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      // Restore focus to the opener if it's still in the document.
      const target = previouslyFocused.current;
      if (target && document.contains(target)) {
        target.focus();
      }
    };
  }, [mobileOpen]);

  const isLoopdevWorkspace = pathname.startsWith("/app/");
  const activeNavigation = navigationOverride ?? (
    pathname === "/launchpad" || isLoopdevWorkspace
      ? launchpadNavigation
      : navigation
  );
  const flat = useMemo(() => buildFlatNav(activeNavigation), [activeNavigation]);
  const flatByKey = useMemo(() => new Map(flat.map((it) => [it.key, it])), [flat]);
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    const next = new Set<string>();
    flat.forEach((it) => {
      if (it.hasChildren && nodeContainsActive(it.node, pathname)) next.add(it.key);
    });
    return next;
  });
  const [focusedKey, setFocusedKeyState] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());

  // Auto-expand ancestors of the active route on navigation.
  useEffect(() => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      flat.forEach((it) => {
        if (it.hasChildren && nodeContainsActive(it.node, pathname)) next.add(it.key);
      });
      return next;
    });
  }, [pathname, flat]);

  const isVisible = useCallback(
    (item: FlatItem) => {
      let p = item.parent;
      while (p) {
        if (!openKeys.has(p)) return false;
        p = flatByKey.get(p)?.parent ?? null;
      }
      return true;
    },
    [openKeys, flatByKey],
  );

  const visibleKeys = useMemo(() => flat.filter(isVisible).map((it) => it.key), [flat, isVisible]);

  // Ensure focusedKey is always a visible item; default to active route or first item.
  useEffect(() => {
    if (focusedKey && visibleKeys.includes(focusedKey)) return;
    const activeLeaf = flat.find((it) => !it.hasChildren && it.node.to && (pathname === it.node.to || pathname.startsWith(it.node.to + "/")));
    const fallback = activeLeaf && visibleKeys.includes(activeLeaf.key) ? activeLeaf.key : visibleKeys[0] ?? null;
    setFocusedKeyState(fallback);
  }, [visibleKeys, focusedKey, flat, pathname]);

  const setFocusedKey = useCallback((key: string) => {
    setFocusedKeyState(key);
    // Defer focus to next paint so refs are stable after open/close.
    requestAnimationFrame(() => refs.current.get(key)?.focus());
  }, []);

  const registerRef = useCallback((key: string, el: HTMLElement | null) => {
    if (el) refs.current.set(key, el);
    else refs.current.delete(key);
  }, []);

  const setOpen = useCallback((key: string, open: boolean) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (open) {
        // Accordion behaviour: only one branch open per parent.
        // Close every sibling (same parent) and all of its descendants.
        const target = flatByKey.get(key);
        const parent = target?.parent ?? null;
        flat.forEach((it) => {
          if (it.key === key) return;
          if (it.parent === parent) {
            // Sibling — close it and any descendants below it.
            next.delete(it.key);
            flat.forEach((d) => {
              if (d.key.startsWith(it.key + "/")) next.delete(d.key);
            });
          }
        });
        next.add(key);
      } else {
        next.delete(key);
        // Also collapse any descendants of the closed branch.
        flat.forEach((d) => {
          if (d.key.startsWith(key + "/")) next.delete(d.key);
        });
      }
      return next;
    });
  }, [flat, flatByKey]);

  const toggle = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const isOpen = prev.has(key);
      const next = new Set(prev);
      if (isOpen) {
        next.delete(key);
        flat.forEach((d) => {
          if (d.key.startsWith(key + "/")) next.delete(d.key);
        });
        return next;
      }
      // Open + close siblings (accordion).
      const target = flatByKey.get(key);
      const parent = target?.parent ?? null;
      flat.forEach((it) => {
        if (it.key === key) return;
        if (it.parent === parent) {
          next.delete(it.key);
          flat.forEach((d) => {
            if (d.key.startsWith(it.key + "/")) next.delete(d.key);
          });
        }
      });
      next.add(key);
      return next;
    });
  }, [flat, flatByKey]);

  const onItemKeyDown = useCallback(
    (e: ReactKeyboardEvent, key: string) => {
      const item = flatByKey.get(key);
      if (!item) return;
      const visible = flat.filter(isVisible);
      const idx = visible.findIndex((x) => x.key === key);
      if (idx === -1) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (idx < visible.length - 1) setFocusedKey(visible[idx + 1].key);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (idx > 0) setFocusedKey(visible[idx - 1].key);
          break;
        }
        case "ArrowRight":
        case "ArrowLeft": {
          e.preventDefault();
          const isRtl =
            typeof document !== "undefined" &&
            document.documentElement.getAttribute("dir") === "rtl";
          // In RTL, the "expand toward start" direction is ArrowLeft.
          const wantsExpand = isRtl ? e.key === "ArrowLeft" : e.key === "ArrowRight";
          if (wantsExpand) {
            if (!item.hasChildren) break;
            if (collapsed && item.level === 1) break;
            if (!openKeys.has(key)) {
              setOpen(key, true);
            } else {
              const firstChild = flat.find((x) => x.parent === key);
              if (firstChild) setFocusedKey(firstChild.key);
            }
          } else {
            if (item.hasChildren && openKeys.has(key)) {
              setOpen(key, false);
            } else if (item.parent) {
              setFocusedKey(item.parent);
            }
          }
          break;
        }
        case "Home": {
          e.preventDefault();
          if (visible[0]) setFocusedKey(visible[0].key);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = visible[visible.length - 1];
          if (last) setFocusedKey(last.key);
          break;
        }
        case " ":
        case "Enter": {
          if (item.hasChildren) {
            if (collapsed && item.level === 1) break;
            e.preventDefault();
            toggle(key);
          }
          // Leaf links activate natively via Enter on <a>.
          break;
        }
      }
    },
    [flat, flatByKey, isVisible, openKeys, setOpen, setFocusedKey, toggle, collapsed],
  );

  const controller: NavController = {
    openKeys,
    toggle,
    setOpen,
    focusedKey,
    setFocusedKey: setFocusedKeyState,
    registerRef,
    onItemKeyDown,
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-foreground/50 backdrop-blur-md md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          "transition-opacity duration-300 ease-out",
        )}
        onClick={onMobileClose}
      />
      <aside
        ref={asideRef}
        id="app-sidebar"
        role={isMobileViewport ? "dialog" : "navigation"}
        aria-label="Main navigation"
        aria-modal={isMobileViewport && mobileOpen ? true : undefined}
        aria-hidden={isMobileViewport && !mobileOpen ? true : undefined}
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground",
          suppressTransition
            ? "transition-none"
            : "transition-[width,transform] duration-300 ease-out",
          "border-e border-sidebar-border shadow-2xl md:shadow-none",
          // Width tiers:
          //   < md (mobile): full-width drawer (284px)
          //   md..nav: forced mini (60px)
          //   ≥ nav: respect `collapsed` (60px) or full (260px)
          "w-[284px] md:w-[60px]",
          collapsed ? "nav:w-[60px]" : "nav:w-[260px]",
          // Above md the sidebar is always pinned in place.
          "md:translate-x-0",
          // Below md we drive the drawer with `translate-x`. Tailwind's
          // translate isn't a logical property, so the closed state needs
          // different signs per direction.
          mobileOpen
            ? "max-md:translate-x-0"
            : "max-md:-translate-x-full max-md:rtl:translate-x-full",
        )}
      >
        <div
          className={cn(
            "relative flex h-16 shrink-0 items-center border-b border-sidebar-border",
            effectiveCollapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Logo collapsed={effectiveCollapsed} />
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Top/bottom fade masks for scroll affordance */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-sidebar to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-sidebar to-transparent"
          />
          <ScrollArea type="hover" scrollHideDelay={400} className="h-full">
            <nav
              role="tree"
              aria-label="Primary"
              aria-orientation="vertical"
              className={cn("py-4", effectiveCollapsed ? "px-2" : "px-3")}
            >
            <TooltipProvider delayDuration={100}>
              {activeNavigation.map((section, sIdx) => {
                void sIdx;
                return (
              <div
                key={section.label}
                className={cn(
                  "mb-2 last:mb-0",
                  effectiveCollapsed
                    ? "border-b border-sidebar-border/60 pb-2 last:border-b-0"
                    : "pb-2",
                )}
              >
                {!effectiveCollapsed ? (
                  <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/85">
                    <SectionLabel raw={section.label} />
                  </div>
                ) : (
                  <div className="sr-only"><SectionLabel raw={section.label} /></div>
                )}
                <ul role="group" aria-label={section.label} className={cn(effectiveCollapsed ? "space-y-1" : "space-y-0.5")}>
                  {section.items.map((item, i) => (
                    <SidebarNode
                      key={`${section.label}-${item.label}-${i}`}
                      node={item}
                      depth={0}
                      itemKey={`${section.label}/${i}`}
                      collapsed={effectiveCollapsed}
                      onNavigate={onMobileClose}
                      controller={controller}
                    />
                  ))}
                </ul>
              </div>
              );
              })}
            </TooltipProvider>
            </nav>
            <ScrollBar className="!w-1.5 hover:!w-2.5" />
          </ScrollArea>
        </div>

      </aside>
    </>
  );
}

function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const name = session?.name ?? "Guest";
  const email = session?.email ?? "Not signed in";
  const role = session?.role ?? "viewer";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    toast.success("Signed out", { description: "See you soon." });
    navigate("/pages/login", { replace: true });
  };

  // Global keyboard shortcuts for the account menu.
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;
      // Toggle account menu: ⌘/Ctrl + .
      if (meta && e.key === ".") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!(meta && e.shiftKey)) return;
      const key = e.key.toLowerCase();
      const map: Record<string, string> = {
        p: "/account/profile",
        a: "/account/settings",
        s: "/account/security",
        b: "/account/billing",
      };
      if (map[key]) {
        e.preventDefault();
        setOpen(false);
        navigate(map[key]);
        return;
      }
      if (key === "q") {
        e.preventDefault();
        handleSignOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerLabel = `Account menu — ${name}`;
  const trigger = (
    <DropdownMenuTrigger
      aria-label={triggerLabel}
      title={collapsed ? undefined : triggerLabel}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 p-2 text-start transition-smooth hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:ring-2 data-[state=open]:ring-sidebar-ring",
        collapsed && "justify-center p-1.5",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{name}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/75">{role}</p>
          </div>
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/70" />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-medium">
            <div className="flex flex-col">
              <span>{name}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">{role}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span className="text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account/profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Account Settings
            <DropdownMenuShortcut>⇧⌘A</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security
            <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
            <DropdownMenuShortcut>⇧⌘B</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Logout
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNode({
  node,
  depth,
  itemKey,
  collapsed,
  onNavigate,
  controller,
}: {
  node: NavNode;
  depth: number;
  itemKey: string;
  collapsed: boolean;
  onNavigate: () => void;
  controller: NavController;
}) {
  const { pathname } = useLocation();
  const hasChildren = !!node.children?.length;
  const tNav = useNavLabel();
  const label = tNav(node.label);
  const containsActive = hasChildren && nodeContainsActive(node, pathname);
  const open = controller.openKeys.has(itemKey);
  const isFocused = controller.focusedKey === itemKey;
  const tabIndex = isFocused ? 0 : -1;
  const handleKeyDown = (e: ReactKeyboardEvent) => controller.onItemKeyDown(e, itemKey);
  const handleFocus = () => controller.setFocusedKey(itemKey);
  // Suppress unused warning
  void containsActive;

  const Icon = node.icon;

  // Top-level button styles
  const isRoot = depth === 0;
  const isLoopdevItem = node.to === "/launchpad" || node.to?.startsWith("/app/");
  const ariaLevel = depth + 1;
  const branchActive = hasChildren && nodeContainsActive(node, pathname);

  if (hasChildren) {
    const trigger = (
      <button
        ref={(el) => controller.registerRef(itemKey, el)}
        type="button"
        role="treeitem"
        aria-level={ariaLevel}
        aria-expanded={open}
        tabIndex={tabIndex}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onClick={() => (collapsed && isRoot ? null : controller.toggle(itemKey))}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg text-start transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isRoot ? "px-3 py-2 text-sm font-medium" : "px-2.5 py-1.5 text-[13px] font-medium",
          branchActive
            ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
            : "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          collapsed && isRoot && "h-10 w-10 justify-center gap-0 rounded-lg px-0 py-0 mx-auto",
        )}
      >
        {Icon && (
          <Icon className={cn(
            "shrink-0 transition-[transform,color] group-hover:scale-105",
            "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground group-aria-[current=page]:text-current",
            branchActive && "text-current",
            collapsed && isRoot ? "h-5 w-5" : "h-[18px] w-[18px]",
          )} />
        )}
        {!(collapsed && isRoot) && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-sidebar-foreground/80 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </>
        )}
      </button>
    );

    return (
      <li role="none">
        {collapsed && isRoot ? (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="font-medium">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        {!(collapsed && isRoot) && open && (
          <ul
            role="group"
            className={cn(
              "mt-1 space-y-0.5 overflow-hidden",
              "ms-[14px] ps-3",
              "animate-accordion-down",
            )}
          >
            {node.children!.map((child, i) => (
              <SidebarNode
                key={`${child.label}-${i}`}
                node={child}
                depth={depth + 1}
                itemKey={`${itemKey}/${i}`}
                collapsed={collapsed}
                onNavigate={onNavigate}
                controller={controller}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Leaf
  const link = (
    <NavLink
      ref={(el) => controller.registerRef(itemKey, el)}
      to={node.to!}
      end={node.to === "/"}
      onClick={onNavigate}
      role="treeitem"
      aria-level={ariaLevel}
      tabIndex={tabIndex}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      data-sidebar-item
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isRoot
            ? "px-3 py-2 text-sm font-medium"
            : "px-2.5 py-1.5 text-[13px] font-medium",
          isActive
            ? isRoot && !isLoopdevItem
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant ring-1 ring-sidebar-primary/40"
              : "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          collapsed && isRoot && "h-10 w-10 justify-center gap-0 rounded-lg px-0 py-0 mx-auto",
        )
      }
    >
      {Icon && (
        <Icon className={cn(
          "shrink-0 transition-[transform,color] group-hover:scale-105",
          "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground group-aria-[current=page]:text-current",
          collapsed && isRoot ? "h-5 w-5" : "h-[18px] w-[18px]",
        )} />
      )}
      {!(collapsed && isRoot) && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {node.badge && (
            <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent ring-1 ring-accent/20">
              {node.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <li role="none">
      {collapsed && isRoot ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="font-medium">
            {label}
            {node.badge && (
              <span className="ms-2 rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {node.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}
