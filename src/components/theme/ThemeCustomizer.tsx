import {
  createContext,
  Component,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type ErrorInfo,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlertTriangle,
  Download,
  LayoutGrid,
  Monitor,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Rows3,
  SlidersHorizontal,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemePreview } from "@/components/settings/ThemePreview";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import {
  APPEARANCE_ALLOWED,
  BRAND_PALETTE,
  DEFAULT_APPEARANCE,
  sanitizeAppearance,
  type AppearanceConfig,
  type BrandColor,
} from "@/config/themeConfig";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type {
  ChartStyle,
  ColorMode,
  ContentWidth,
  Density,
  Direction,
  HeaderHeight,
  HeaderPosition,
  NavbarStyle,
  Radius,
  SidebarMode,
  SidebarStyle,
} from "@/config/themeConfig";

interface CustomizerCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<CustomizerCtx | undefined>(undefined);

export function ThemeCustomizerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<CustomizerCtx>(
    () => ({ open, setOpen, toggle: () => setOpen((v) => !v) }),
    [open],
  );
  return (
    <Ctx.Provider value={value}>
      {children}
      <ThemeCustomizerPanel />
    </Ctx.Provider>
  );
}

export function useThemeCustomizer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeCustomizer must be used within ThemeCustomizerProvider");
  return ctx;
}

function Section({
  title,
  description,
  children,
  labelId,
}: {
  title: string;
  description?: string;
  children: (labelId: string) => ReactNode;
  labelId?: string;
}) {
  const autoId = useId();
  const id = labelId ?? autoId;
  return (
    <section className="space-y-2.5" aria-labelledby={id}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3
          id={id}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-muted-foreground/80">{description}</p>
        )}
      </header>
      {children(id)}
    </section>
  );
}

/** Roving focus + arrow-key navigation across a list of buttons (radiogroup). */
function useRovingFocus(itemCount: number, onActivate?: (idx: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (idx: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const last = itemCount - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = idx === 0 ? last : idx - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onActivate?.(idx);
      return;
    }
    if (next !== null) {
      e.preventDefault();
      refs.current[next]?.focus();
      onActivate?.(next);
    }
  };
  const setRef = (idx: number) => (el: HTMLButtonElement | null) => {
    refs.current[idx] = el;
  };
  return { setRef, onKeyDown };
}

interface SegOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabelledBy,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabelledBy?: string;
}) {
  const { setRef, onKeyDown } = useRovingFocus(options.length, (i) => onChange(options[i].value));
  const activeIdx = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-orientation="horizontal"
      aria-labelledby={ariaLabelledBy}
      className="grid w-full min-w-0 gap-1 rounded-md border border-border bg-muted/40 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt, idx) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (activeIdx === -1 && idx === 0) ? 0 : -1}
            ref={setRef(idx)}
            onKeyDown={onKeyDown(idx)}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-2 text-xs font-medium transition-fast focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-8 sm:px-2",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon && (
              <span aria-hidden="true" className="hidden shrink-0 xs:inline-flex">
                {opt.icon}
              </span>
            )}
            <span className="min-w-0 truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ColorSwatches({
  value,
  onChange,
  ariaLabelledBy,
}: {
  value: BrandColor;
  onChange: (v: BrandColor) => void;
  ariaLabelledBy?: string;
}) {
  const entries = Object.entries(BRAND_PALETTE) as [BrandColor, (typeof BRAND_PALETTE)[BrandColor]][];
  const { setRef, onKeyDown } = useRovingFocus(entries.length, (i) => onChange(entries[i][0]));
  const activeIdx = entries.findIndex(([k]) => k === value);
  return (
    <div
      role="radiogroup"
      aria-orientation="horizontal"
      aria-labelledby={ariaLabelledBy}
      className="grid grid-cols-7 gap-2"
    >
      {entries.map(([key, palette], idx) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${palette.label}${active ? " (selected)" : ""}`}
            tabIndex={active || (activeIdx === -1 && idx === 0) ? 0 : -1}
            ref={setRef(idx)}
            onKeyDown={onKeyDown(idx)}
            onClick={() => onChange(key)}
            title={palette.label}
            className={cn(
              "relative flex aspect-square w-full min-h-[40px] min-w-0 items-center justify-center rounded-md transition-fast focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "ring-1 ring-black/10 hover:scale-[1.06]",
            )}
            style={{ background: palette.swatch }}
          >
            {active && <Check aria-hidden="true" className="h-3.5 w-3.5 text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}

function ThemeCustomizerPanel() {

  return <ThemeCustomizerPanelInner />;
}

/** Local error boundary so a single broken option can't kill the whole drawer. */
class CustomizerErrorBoundary extends Component<
  { onReset: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ThemeCustomizer] render error", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
        >
          <AlertTriangle aria-hidden="true" className="h-6 w-6 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Customizer hit a snag</p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              We restored a safe default. Reset to recover all settings.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              this.props.onReset();
              this.setState({ error: null });
            }}
            className="gap-1.5"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset to defaults
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThemeCustomizerPanelInner() {
  const { open, setOpen } = useThemeCustomizer();
  const { config, set, setMany, reset } = useThemeConfig();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleReset = useCallback(() => {
    reset();
    setResetConfirmOpen(false);
    toast.success("Theme reset", { description: "All appearance settings restored to defaults." });
  }, [reset]);

  const handleExport = useCallback(() => {
    try {
      const payload = {
        $schema: "rivera.theme/v1",
        version: 1,
        exportedAt: new Date().toISOString(),
        appearance: config,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rivera-theme-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Theme exported", { description: "Saved as JSON file." });
    } catch (err) {
      console.error("[ThemeCustomizer] export failed", err);
      toast.error("Export failed", { description: "Could not generate theme file." });
    }
  }, [config]);

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          toast.error("Import failed", { description: "File is not valid JSON." });
          return;
        }
        // Accept either { appearance: {...} } v1 envelope, or a raw appearance object.
        const candidate =
          parsed && typeof parsed === "object" && "appearance" in (parsed as Record<string, unknown>)
            ? (parsed as { appearance: unknown }).appearance
            : parsed;

        if (!candidate || typeof candidate !== "object") {
          setMany(DEFAULT_APPEARANCE);
          toast.warning("Imported with defaults", {
            description: "File didn't contain theme data — restored defaults.",
          });
          return;
        }

        // Count how many fields will fall back to default.
        const src = candidate as Record<string, unknown>;
        const keys = Object.keys(DEFAULT_APPEARANCE) as (keyof AppearanceConfig)[];
        const coerced = keys.filter((k) => {
          const v = src[k as string];
          const allowed = APPEARANCE_ALLOWED[k] as readonly unknown[];
          return !(typeof v === "string" && allowed.includes(v));
        });

        const safe = sanitizeAppearance(candidate);
        setMany(safe);

        if (coerced.length === keys.length) {
          toast.warning("Imported with defaults", {
            description: "No recognized settings found — using defaults.",
          });
        } else if (coerced.length > 0) {
          toast.success("Theme imported", {
            description: `${coerced.length} unknown value${coerced.length === 1 ? "" : "s"} reverted to defaults.`,
          });
        } else {
          toast.success("Theme imported", { description: "All settings applied." });
        }
      } catch (err) {
        console.error("[ThemeCustomizer] import failed", err);
        toast.error("Import failed", { description: "Could not read theme file." });
      }
    },
    [setMany],
  );

  /**
   * Coerce a config value back to its default if it's missing or unknown
   * (e.g. localStorage was edited by hand, or schema added a new option).
   * Guarantees Segmented/ColorSwatches always receive a valid `value`.
   */
  const safeValue = useCallback(
    <K extends keyof AppearanceConfig>(key: K): AppearanceConfig[K] => {
      const v = config[key];
      const allowed = APPEARANCE_ALLOWED[key] as readonly AppearanceConfig[K][];
      return allowed.includes(v) ? v : DEFAULT_APPEARANCE[key];
    },
    [config],
  );

  // Surface a one-time toast if persisted state was invalid and got coerced.
  const hasInvalid = useMemo(
    () =>
      (Object.keys(DEFAULT_APPEARANCE) as (keyof AppearanceConfig)[]).some(
        (k) =>
          !(APPEARANCE_ALLOWED[k] as readonly unknown[]).includes(config[k]),
      ),
    [config],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        id="rivera-theme-customizer"
        aria-describedby="rivera-theme-customizer-desc"
        className="flex w-full max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[380px] sm:p-0 [&>button.absolute]:hidden overflow-y-hidden"
      >
        <CustomizerErrorBoundary onReset={reset}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportFile(f);
            e.target.value = "";
          }}
        />
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/70 bg-card/95 px-4 py-3.5 backdrop-blur-xl sm:px-5">
          <div className="min-w-0">
            <SheetTitle className="text-[15px] font-semibold leading-tight text-foreground">
              Theme Customizer
            </SheetTitle>
            <SheetDescription id="rivera-theme-customizer-desc" className="mt-0.5 text-[11px] text-muted-foreground">
              Personalize Rivera’s interface
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close customizer"
            className="-mr-1 flex h-7 w-7 items-center justify-center rounded-md text-foreground/80 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="min-w-0 divide-y divide-border/60">
            {hasInvalid && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300 sm:px-5"
              >
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">
                  Some saved settings were unrecognized and reverted to defaults.
                </span>
              </div>
            )}
            <div className="px-4 py-4 sm:px-5">
              <ThemePreview />
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-5">
              <Section title="Theme mode">
                {(id) => (
                  <Segmented<ColorMode>
                    ariaLabelledBy={id}
                    value={safeValue("mode")}
                    onChange={(v) => set("mode", v)}
                    options={[
                      { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
                      { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
                      { value: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
                    ]}
                  />
                )}
              </Section>

              <Section title="Primary color">
                {(id) => (
                  <ColorSwatches ariaLabelledBy={id} value={safeValue("brand")} onChange={(v) => set("brand", v)} />
                )}
              </Section>

              <Section title="Layout density">
                {(id) => (
                  <Segmented<Density>
                    ariaLabelledBy={id}
                    value={safeValue("density")}
                    onChange={(v) => set("density", v)}
                    options={[
                      { value: "comfortable", label: "Comfortable", icon: <Rows3 className="h-3.5 w-3.5" /> },
                      { value: "compact", label: "Compact", icon: <AlignJustify className="h-3.5 w-3.5" /> },
                    ]}
                  />
                )}
              </Section>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-5">
              <Section title="Sidebar style">
                {(id) => (
                  <Segmented<SidebarStyle>
                    ariaLabelledBy={id}
                    value={safeValue("sidebarStyle")}
                    onChange={(v) => set("sidebarStyle", v)}
                    options={[
                      { value: "default", label: "Default" },
                      { value: "compact", label: "Compact" },
                      { value: "floating", label: "Floating" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Sidebar mode">
                {(id) => (
                  <Segmented<SidebarMode>
                    ariaLabelledBy={id}
                    value={safeValue("sidebarMode")}
                    onChange={(v) => set("sidebarMode", v)}
                    options={[
                      { value: "expanded", label: "Expanded" },
                      { value: "collapsed", label: "Collapsed" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Navbar style">
                {(id) => (
                  <Segmented<NavbarStyle>
                    ariaLabelledBy={id}
                    value={safeValue("navbarStyle")}
                    onChange={(v) => set("navbarStyle", v)}
                    options={[
                      { value: "sticky", label: "Sticky" },
                      { value: "static", label: "Static" },
                      { value: "glass", label: "Glass" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Header height">
                {(id) => (
                  <Segmented<HeaderHeight>
                    ariaLabelledBy={id}
                    value={safeValue("headerHeight")}
                    onChange={(v) => set("headerHeight", v)}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "standard", label: "Standard" },
                      { value: "tall", label: "Tall" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Header position">
                {(id) => (
                  <Segmented<HeaderPosition>
                    ariaLabelledBy={id}
                    value={safeValue("headerPosition")}
                    onChange={(v) => set("headerPosition", v)}
                    options={[
                      { value: "fixed", label: "Fixed" },
                      { value: "sticky", label: "Sticky" },
                      { value: "static", label: "Static" },
                      { value: "hidden", label: "Hidden" },
                    ]}
                  />
                )}
              </Section>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-5">
              <Section title="Border radius">
                {(id) => (
                  <Segmented<Radius>
                    ariaLabelledBy={id}
                    value={safeValue("radius")}
                    onChange={(v) => set("radius", v)}
                    options={[
                      { value: "sharp", label: "Sharp" },
                      { value: "standard", label: "Standard" },
                      { value: "soft", label: "Soft" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Content width">
                {(id) => (
                  <Segmented<ContentWidth>
                    ariaLabelledBy={id}
                    value={safeValue("contentWidth")}
                    onChange={(v) => set("contentWidth", v)}
                    options={[
                      { value: "full", label: "Full", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                      { value: "centered", label: "Centered", icon: <AlignCenter className="h-3.5 w-3.5" /> },
                    ]}
                  />
                )}
              </Section>

              <Section title="Chart style">
                {(id) => (
                  <Segmented<ChartStyle>
                    ariaLabelledBy={id}
                    value={safeValue("chartStyle")}
                    onChange={(v) => set("chartStyle", v)}
                    options={[
                      { value: "smooth", label: "Smooth" },
                      { value: "linear", label: "Linear" },
                      { value: "minimal", label: "Minimal" },
                    ]}
                  />
                )}
              </Section>

              <Section title="Direction">
                {(id) => (
                  <Segmented<Direction>
                    ariaLabelledBy={id}
                    value={safeValue("direction")}
                    onChange={(v) => set("direction", v)}
                    options={[
                      { value: "ltr", label: "LTR", icon: <AlignLeft className="h-3.5 w-3.5" /> },
                      { value: "rtl", label: "RTL", icon: <AlignLeft className="h-3.5 w-3.5 -scale-x-100" /> },
                    ]}
                  />
                )}
              </Section>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur-xl sm:px-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="More theme actions"
                className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-48">
              <DropdownMenuItem onSelect={() => setResetConfirmOpen(true)}>
                <RotateCcw className="me-2 h-3.5 w-3.5" />
                Reset to defaults
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleExport()}>
                <Download className="me-2 h-3.5 w-3.5" />
                Export theme
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload className="me-2 h-3.5 w-3.5" />
                Import theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setOpen(false)} className="px-5">
            Done
          </Button>
        </footer>
        </CustomizerErrorBoundary>
        <ConfirmDialog
          open={resetConfirmOpen}
          onOpenChange={setResetConfirmOpen}
          title="Reset appearance to defaults?"
          description="This restores theme mode, brand color, density, sidebar, navbar, radius, content width, charts, and direction to Rivera's defaults. This action only affects this device."
          confirmLabel="Reset to defaults"
          cancelLabel="Cancel"
          tone="warning"
          onConfirm={handleReset}
        />
      </SheetContent>
    </Sheet>
  );
}

/** Trigger button — slot into the topbar. */
export function ThemeCustomizerTrigger({ className }: { className?: string }) {
  const { toggle, open } = useThemeCustomizer();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open theme customizer"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="rivera-theme-customizer"
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
    >
      <SlidersHorizontal aria-hidden="true" className="h-[17px] w-[17px]" />
    </button>
  );
}

/** Floating action button — bottom-right of viewport. */
export function ThemeCustomizerFab() {
  const { toggle, open } = useThemeCustomizer();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open theme customizer"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="rivera-theme-customizer"
      className="fixed bottom-6 right-6 z-40 hidden h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/95 text-foreground shadow-elegant backdrop-blur-xl transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
    >
      <SlidersHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
    </button>
  );
}