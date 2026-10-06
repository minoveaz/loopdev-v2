import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormSectionNavItem {
  id: string;
  label: string;
  status?: "neutral" | "progress" | "complete" | "error";
  icon?: ReactNode;
}

export function FormSectionNav({ items, activeId, onSelect }: { items: FormSectionNavItem[]; activeId?: string; onSelect: (id: string) => void }) {
  return (
    <nav className="mb-1 flex min-w-0 border-b border-border/80" aria-label="Form sections">
      <div className="flex min-w-0 gap-4 overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-1 py-2.5 text-xs font-medium transition-colors",
              activeId === item.id ? "border-primary text-primary" : "text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.status === "error" && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
            {item.status === "complete" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    </nav>
  );
}
