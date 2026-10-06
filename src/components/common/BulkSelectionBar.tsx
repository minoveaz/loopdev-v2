import { X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BulkSelectionAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

export interface BulkSelectionBarProps {
  selectedCount: number;
  entityLabel?: string;
  ariaLabel?: string;
  onClear: () => void;
  actions: BulkSelectionAction[];
}

export function BulkSelectionBar({ selectedCount, entityLabel = "selected", ariaLabel, onClear, actions }: BulkSelectionBarProps) {
  if (selectedCount < 1) return null;

  return (
    <div
      role="region"
      aria-label={ariaLabel ?? `Bulk ${entityLabel} actions`}
      className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between bg-primary-soft/40 animate-in fade-in slide-in-from-top-1"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary" aria-live="polite">
          {selectedCount} {entityLabel} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={action.destructive ? "destructive" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={action.onClick}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
