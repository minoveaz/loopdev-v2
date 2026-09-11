import type { ReactNode } from "react";

interface ConversationContextPanelHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function ConversationContextPanelHeader({
  icon,
  title,
  subtitle,
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
    </header>
  );
}
