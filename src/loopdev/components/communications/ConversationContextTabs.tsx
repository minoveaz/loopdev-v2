import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationContextView = "crm" | "operations" | "timeline";

interface ConversationContextTabsProps {
  active: ConversationContextView;
  onChange: (view: ConversationContextView) => void;
}

const tabs: Array<{ value: ConversationContextView; label: string }> = [
  { value: "crm", label: "CRM Context" },
  { value: "operations", label: "Operations" },
  { value: "timeline", label: "Timeline" },
];

export function ConversationContextTabs({ active, onChange }: ConversationContextTabsProps) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2" role="tablist" aria-label="Conversation context">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          variant="ghost"
          size="sm"
          className={cn("h-7 shrink-0 px-2 text-[11px]", active === tab.value && "bg-primary-soft font-semibold text-primary")}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
