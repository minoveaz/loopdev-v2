import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ReadOnlyFieldProps {
  label: string;
  value: string | null;
  mono?: boolean;
  copyable?: boolean;
}

export function ReadOnlyField({ label, value, mono = false, copyable = false }: ReadOnlyFieldProps) {
  const [copied, setCopied] = useState(false);
  const displayValue = value || "—";
  const canCopy = copyable && Boolean(value);

  const copyValue = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Unable to copy", description: "Clipboard access was denied.", variant: "destructive" });
    }
  };

  return (
    <div className="group rounded-md border border-border bg-card-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        {canCopy && (
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground opacity-70 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100" onClick={copyValue} aria-label={`Copy ${label}`}>
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
      <dd className={`mt-0.5 break-words text-sm ${mono ? "font-mono" : ""}`}>{displayValue}</dd>
    </div>
  );
}
