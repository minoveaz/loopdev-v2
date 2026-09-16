import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveConfidenceLevel, type ExportProfileField } from "@/loopdev/domains/document-intelligence";

interface ExtractionFieldItemProps {
  field: ExportProfileField;
  label: string;
  value: string;
  confidence?: number;
  span?: "full";
  onChange: (field: ExportProfileField, nextValue: string) => void;
}

export function ExtractionFieldItem({
  field,
  label,
  value,
  confidence,
  span,
  onChange,
}: ExtractionFieldItemProps) {
  const [copied, setCopied] = useState(false);
  const confidenceLevel = resolveConfidenceLevel(confidence);
  const isMrz = field === "mrz";

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getConfidenceBadgeColor = () => {
    if (confidenceLevel === "high") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }
    if (confidenceLevel === "medium") {
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  };

  return (
    <div className={`space-y-1.5 ${span === "full" ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`field-${field}`} className="text-xs font-medium text-foreground">
          {label}
        </Label>

        <div className="flex items-center gap-1.5">
          {confidence !== undefined && (
            <Badge
              variant="outline"
              className={`h-5 px-1.5 font-mono text-[10px] font-semibold ${getConfidenceBadgeColor()}`}
              title={`Confianza de extracción: ${Math.round(confidence * 100)}%`}
            >
              {Math.round(confidence * 100)}%
            </Badge>
          )}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title={`Copiar ${label}`}
            onClick={handleCopy}
            disabled={!value}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {isMrz ? (
        <Textarea
          id={`field-${field}`}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder="No detectado"
          rows={3}
          className="font-mono text-xs leading-relaxed"
        />
      ) : (
        <Input
          id={`field-${field}`}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder="No detectado"
          className="h-9 text-xs"
        />
      )}
    </div>
  );
}
