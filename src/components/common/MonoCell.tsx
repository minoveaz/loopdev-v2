import { type ReactNode } from "react";
import { TableCell } from "@/components/ui/table";
import { StatusBadge, type StatusTone } from "./StatusBadge";
import { InlineCode } from "./Typography";
import { cn } from "@/lib/utils";

/**
 * Field hint — chooses how the value is rendered:
 *   - "code"   → <InlineCode> (default for ids/methods/headers)
 *   - "method" → uppercase HTTP method as <InlineCode>
 *   - "status" → numeric or string status (HTTP-aware tone) as <StatusBadge>
 *   - "id"     → <InlineCode>, monospace identifier
 */
export type MonoFieldKind = "code" | "method" | "status" | "id";

export interface MonoCellProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "children"> {
  /** What the value represents — controls rendering. */
  kind?: MonoFieldKind;
  /** Raw value. Numbers/strings are best; ReactNode is also accepted. */
  value: ReactNode;
  /** Optional extra label rendered before the value (muted). */
  label?: ReactNode;
  /** Override the auto-detected status tone (for kind="status"). */
  tone?: StatusTone;
}

/** Map an HTTP status code to a semantic tone. */
function toneForStatus(value: ReactNode, override?: StatusTone): StatusTone {
  if (override) return override;
  const n = typeof value === "number" ? value : Number(String(value).match(/\d{3}/)?.[0]);
  if (!Number.isFinite(n)) {
    const v = String(value).toLowerCase();
    if (/(ok|success|paid|active|done|live)/.test(v)) return "success";
    if (/(pending|queued|running|retry|warn)/.test(v)) return "warning";
    if (/(fail|error|down|dead|refund)/.test(v)) return "destructive";
    return "neutral";
  }
  if (n >= 500) return "destructive";
  if (n >= 400) return "warning";
  if (n >= 300) return "info";
  if (n >= 200) return "success";
  return "neutral";
}

/** Map an HTTP method to a tone-tinted Tailwind class. */
function methodClass(method: string): string {
  const m = method.toUpperCase();
  if (m === "GET")    return "text-info";
  if (m === "POST")   return "text-success";
  if (m === "PUT" || m === "PATCH") return "text-warning";
  if (m === "DELETE") return "text-destructive";
  return "text-foreground";
}

/**
 * MonoCell — drop-in <TableCell> that consistently renders id / method /
 * status / code fields using InlineCode and StatusBadge. Keeps table rows
 * visually aligned across the app.
 *
 * @example
 *   <MonoCell kind="id"     value="ORD-30418" />
 *   <MonoCell kind="method" value="POST" />
 *   <MonoCell kind="status" value={200} />
 *   <MonoCell kind="code"   value="X-Trace-Id" label="header" />
 */
export function MonoCell({
  kind = "code",
  value,
  label,
  tone,
  className,
  ...rest
}: MonoCellProps) {
  const cellClass = cn(className);

  if (kind === "status") {
    const t = toneForStatus(value, tone);
    return (
      <TableCell className={cellClass} {...rest}>
        {label && <span className="mr-2 text-xs text-muted-foreground">{label}</span>}
        <StatusBadge tone={t} dot>{value}</StatusBadge>
      </TableCell>
    );
  }

  if (kind === "method") {
    const m = String(value).toUpperCase();
    return (
      <TableCell className={cellClass} {...rest}>
        {label && <span className="mr-2 text-xs text-muted-foreground">{label}</span>}
        <InlineCode className={cn("font-semibold", methodClass(m))}>{m}</InlineCode>
      </TableCell>
    );
  }

  // "code" or "id" — both render as <InlineCode>
  return (
    <TableCell className={cellClass} {...rest}>
      {label && <span className="mr-2 text-xs text-muted-foreground">{label}</span>}
      <InlineCode>{value}</InlineCode>
    </TableCell>
  );
}