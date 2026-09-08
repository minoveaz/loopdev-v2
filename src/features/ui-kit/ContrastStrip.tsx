import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** WCAG 2.1 relative luminance from sRGB 0–255 channels. */
function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function parseRgb(input: string): [number, number, number] | null {
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return [parts[0], parts[1], parts[2]];
}

function blend(
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number],
): [number, number, number] {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

function effectiveBg(el: HTMLElement): [number, number, number] {
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    const bg = style.backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      const alpha = parts.length === 4 ? parts[3] : 1;
      if (alpha > 0) {
        const rgb: [number, number, number] = [parts[0], parts[1], parts[2]];
        if (alpha >= 0.999) return rgb;
        const parentBg = node.parentElement ? effectiveBg(node.parentElement) : ([255, 255, 255] as [number, number, number]);
        return blend(rgb, alpha, parentBg);
      }
    }
    node = node.parentElement;
  }
  return [255, 255, 255];
}

function contrast(fg: [number, number, number], bg: [number, number, number]) {
  const L1 = luminance(...fg);
  const L2 = luminance(...bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function rating(ratio: number): { label: string; tone: "good" | "okay" | "fail" } {
  if (ratio >= 7) return { label: "AAA", tone: "good" };
  if (ratio >= 4.5) return { label: "AA", tone: "good" };
  if (ratio >= 3) return { label: "AA Large", tone: "okay" };
  return { label: "Fail", tone: "fail" };
}

interface Swatch {
  /** Short label (e.g. "Inline code"). */
  label: string;
  /** Sample text rendered inside the swatch. */
  sample: string;
  /** Tailwind classes producing the foreground/background under test. */
  className: string;
}

const swatches: Swatch[] = [
  {
    label: "Inline code",
    sample: "fetchOrders()",
    className: "rounded-md border border-border bg-muted px-2 py-1 font-mono text-[13px] text-foreground",
  },
  {
    label: "Table cell",
    sample: "ORD-30418",
    className: "rounded-md bg-card px-2 py-1 font-mono text-xs text-foreground",
  },
  {
    label: "Muted cell",
    sample: "128 ms",
    className: "rounded-md bg-card px-2 py-1 font-mono text-xs text-muted-foreground",
  },
  {
    label: "Badge · secondary",
    sample: "paid",
    className: "rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground",
  },
  {
    label: "Badge · primary",
    sample: "new",
    className: "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
  },
  {
    label: "Badge · destructive",
    sample: "failed",
    className: "rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground",
  },
];

const toneClass: Record<"good" | "okay" | "fail", string> = {
  good: "bg-success-soft text-success border-success/30",
  okay: "bg-warning-soft text-warning-foreground border-warning/40",
  fail: "bg-destructive-soft text-destructive border-destructive/30",
};

/**
 * ContrastStrip — renders representative swatches and measures the runtime
 * WCAG contrast ratio of the text vs. its background, so the same component
 * can be dropped into both a `.light` and `.dark` preview to verify
 * accessibility in each theme.
 */
export function ContrastStrip({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<{ ratio: number; rating: ReturnType<typeof rating> }[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    // Defer one frame so fonts/colors are computed.
    const id = requestAnimationFrame(() => {
      const els = Array.from(root.querySelectorAll<HTMLElement>("[data-swatch]"));
      const next = els.map((el) => {
        const fg = parseRgb(getComputedStyle(el).color) ?? [0, 0, 0];
        const bg = effectiveBg(el);
        const ratio = contrast(fg, bg);
        return { ratio, rating: rating(ratio) };
      });
      setResults(next);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-foreground">Contrast audit</h4>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">WCAG 2.1</span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {swatches.map((s, i) => {
          const r = results[i];
          return (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 surface-card-compact p-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span data-swatch className={s.className}>{s.sample}</span>
                <span className="truncate text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {r ? `${r.ratio.toFixed(2)}:1` : "—"}
                </span>
                <span
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    r ? toneClass[r.rating.tone] : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {r ? r.rating.label : "…"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        AAA ≥ 7:1 · AA ≥ 4.5:1 · AA Large ≥ 3:1 (≥18pt or bold ≥14pt).
      </p>
    </div>
  );
}