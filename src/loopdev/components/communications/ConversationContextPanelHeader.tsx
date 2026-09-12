import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversationContextPanelHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function ConversationContextPanelHeader({
  icon,
  title,
  subtitle,
  onClose,
  closeLabel,
}: ConversationContextPanelHeaderProps) {
  return (
    <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {onClose && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={closeLabel ?? `Close ${title}`} onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
}
