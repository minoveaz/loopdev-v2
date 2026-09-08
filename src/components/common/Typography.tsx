import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * InlineCode — short, in-flow snippets like <InlineCode>npm install</InlineCode>.
 * Renders a styled <code>; inherits all base mono styles from index.css.
 */
export const InlineCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <code ref={ref} className={cn(className)} {...props} />
  )
);
InlineCode.displayName = "InlineCode";

export interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  /**
   * Language hint. When set to a Prism-supported language
   * (ts, tsx, js, jsx, json, bash, shell, css, html, markdown, yaml, sql, python, go, rust, etc.),
   * the code is syntax highlighted. Also rendered as a small label in the top-right.
   */
  language?: string;
  /** Children — for highlighting, pass a plain string. */
  children: ReactNode;
  /** Force-disable syntax highlighting even if `language` is set. */
  noHighlight?: boolean;
  /** Hide the copy-to-clipboard button (shown by default when children is a string). */
  hideCopy?: boolean;
  /**
   * Keyboard shortcut to copy when the block is hovered or focused.
   * Defaults to "mod+c" (⌘/Ctrl + C). Set to `null` to disable.
   */
  copyShortcut?: string | null;
}

/** Languages we explicitly support out of the box. */
const SUPPORTED: ReadonlySet<string> = new Set([
  "ts", "tsx", "js", "jsx", "json", "bash", "shell", "sh",
  "css", "scss", "html", "markdown", "md", "yaml", "yml",
  "sql", "python", "py", "go", "rust", "rs", "diff", "graphql",
]);

/** Normalise common aliases to Prism's language keys. */
function normalize(lang?: string): Language | undefined {
  if (!lang) return undefined;
  const l = lang.toLowerCase();
  const map: Record<string, Language> = {
    sh: "bash" as Language,
    shell: "bash" as Language,
    py: "python" as Language,
    rs: "rust" as Language,
    md: "markdown" as Language,
    yml: "yaml" as Language,
  };
  return (map[l] ?? (l as Language));
}

/**
 * CodeBlock — multiline code sample. Wraps <pre><code> with consistent
 * Geist Mono sizing, padding, scroll, an optional language chip, and
 * Prism-powered syntax highlighting when `language` is supported.
 */
/** Match a keyboard shortcut string like "mod+c", "shift+enter". */
function matchShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
  const key = parts.pop() ?? "";
  const needMod = parts.includes("mod") || parts.includes("ctrl") || parts.includes("cmd");
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt") || parts.includes("option");
  const mod = e.metaKey || e.ctrlKey;
  return (
    e.key.toLowerCase() === key &&
    (!needMod || mod) &&
    (!needShift || e.shiftKey) &&
    (!needAlt || e.altKey)
  );
}

/**
 * Resolve the effective theme for a given DOM node by walking up to the
 * nearest `.dark` / `.light` scope, falling back to <html>.
 */
function resolveTheme(el: HTMLElement | null): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const scope = el?.closest(".dark, .light") as HTMLElement | null;
  if (scope?.classList.contains("dark")) return "dark";
  if (scope?.classList.contains("light")) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(
  (
    { className, language, children, noHighlight, hideCopy, copyShortcut = "mod+c", ...props },
    ref,
  ) => {
    const lang = normalize(language);
    const canHighlight =
      !noHighlight && typeof children === "string" && lang && SUPPORTED.has(lang);
    const copyText = typeof children === "string" ? children : null;
    const showCopy = !hideCopy && copyText !== null;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState<"light" | "dark">("light");

    // Detect the effective theme synchronously on mount, and react to
    // changes on <html> or any wrapping `.dark`/`.light` scope.
    useLayoutEffect(() => {
      const el = wrapperRef.current;
      setMode(resolveTheme(el));
      if (typeof window === "undefined") return;

      const observers: MutationObserver[] = [];
      const update = () => setMode(resolveTheme(el));

      // Observe <html> class changes (global theme toggle).
      const htmlObs = new MutationObserver(update);
      htmlObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      observers.push(htmlObs);

      // Observe the nearest scope's class changes if any.
      const scope = el?.closest(".dark, .light") as HTMLElement | null;
      if (scope && scope !== document.documentElement) {
        const scopeObs = new MutationObserver(update);
        scopeObs.observe(scope, { attributes: true, attributeFilter: ["class"] });
        observers.push(scopeObs);
      }
      return () => observers.forEach((o) => o.disconnect());
    }, []);

    const copy = useCallback(async () => {
      if (!copyText) return;
      try {
        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        toast.success("Copied to clipboard", {
          description: language ? `${language} snippet` : "Snippet",
        });
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Copy failed", { description: "Clipboard access was denied." });
      }
    }, [copyText, language]);

    // Keyboard shortcut — only fires while the block is hovered or focused-within.
    useEffect(() => {
      if (!showCopy || !copyShortcut) return;
      const el = wrapperRef.current;
      if (!el) return;

      const onKey = (e: KeyboardEvent) => {
        const hovered = el.matches(":hover");
        const focused = el.contains(document.activeElement);
        if (!hovered && !focused) return;
        // Don't intercept text selection copies
        const sel = window.getSelection?.()?.toString();
        if (sel && sel.length > 0) return;
        if (matchShortcut(e, copyShortcut)) {
          e.preventDefault();
          void copy();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [copy, copyShortcut, showCopy]);

    const copyBtn = showCopy ? (
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        title={copyShortcut ? `Copy (${copyShortcut.replace("mod", "⌘/Ctrl").toUpperCase()})` : "Copy"}
        className={cn(
          "absolute right-2 top-2 z-20 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 font-mono text-[11px] text-muted-foreground opacity-0 shadow-sm transition-fast hover:bg-card-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100",
          copied && "border-success/30 text-success opacity-100",
        )}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    ) : null;

    const langChip = language ? (
      <span
        className={cn(
          "absolute z-10 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
          showCopy ? "right-[5.25rem] top-2" : "right-2 top-2",
        )}
      >
        {language}
      </span>
    ) : null;

    return (
      <div ref={wrapperRef} className="group relative" tabIndex={-1}>
        {langChip}
        {copyBtn}

        {canHighlight ? (
          <Highlight
            code={(children as string).replace(/\n$/, "")}
            language={lang as Language}
            theme={mode === "dark" ? themes.vsDark : themes.vsLight}
          >
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre ref={ref} {...props} className={cn(className)}>
                <code>
                  {tokens.map((line, i) => {
                    const { key: _lk, ...lineProps } = getLineProps({ line });
                    return (
                      <div key={i} {...lineProps}>
                        {line.map((token, j) => {
                          const { key: _tk, ...tokenProps } = getTokenProps({ token });
                          return <span key={j} {...tokenProps}>{token.content}</span>;
                        })}
                      </div>
                    );
                  })}
                </code>
              </pre>
            )}
          </Highlight>
        ) : (
          <pre ref={ref} className={cn(className)} {...props}>
            <code>{children}</code>
          </pre>
        )}
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

/**
 * Kbd — keyboard hint pill. Compose multiple for shortcuts:
 *   <Kbd>⌘</Kbd> <Kbd>K</Kbd>
 */
export const Kbd = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd ref={ref} className={cn(className)} {...props} />
  )
);
Kbd.displayName = "Kbd";

/**
 * Samp — sample program output. Renders semantic <samp> with mono styling
 * and a subtle muted surface to differentiate from input/code.
 */
export const Samp = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <samp
      ref={ref}
      className={cn(
        "rounded-[calc(var(--radius-sm)-2px)] border border-border bg-card-muted px-1.5 py-0.5 text-[0.875em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
);
Samp.displayName = "Samp";