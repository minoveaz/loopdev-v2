import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CommunicationMessage } from "@/loopdev/domains/communications";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { buildConversationTimelineMarkers } from "./ConversationTimelineRail";
import { ConversationContextPanelHeader } from "./ConversationContextPanelHeader";
import { ConversationContextTabs, type ConversationContextView } from "./ConversationContextTabs";

interface ConversationTimelinePanelProps {
  messages: CommunicationMessage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextView: ConversationContextView;
  onContextViewChange: (view: ConversationContextView) => void;
}

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(() => typeof window === "undefined" || !window.matchMedia || window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return desktop;
}

function TimelineBody({ messages, onOpenChange, contextView, onContextViewChange }: Omit<ConversationTimelinePanelProps, "open">) {
  const [search, setSearch] = useState("");
  const markers = buildConversationTimelineMarkers(messages);
  const filteredMarkers = markers.filter((marker) => `${marker.label} ${marker.detail}`.toLowerCase().includes(search.trim().toLowerCase()));
  const scrollToMarker = (messageId: string) => {
    document.getElementById(`conversation-message-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    onOpenChange(false);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
      <ConversationContextPanelHeader
        icon={<span aria-hidden="true">TL</span>}
        title="Conversation Timeline"
        subtitle="Important moments received from the customer"
      />
      <ConversationContextTabs active={contextView} onChange={onContextViewChange} />
      <div className="border-b border-border px-4 py-4">
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search conversation milestones" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search milestones" className="ps-9" />
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3">
        {filteredMarkers.length === 0 ? (
          <p className="px-3 py-5 text-center text-sm text-muted-foreground">No milestones match your search.</p>
        ) : (
          <div className="space-y-1">
            {filteredMarkers.map((marker) => (
              <Button key={marker.id} type="button" variant="ghost" className="h-auto min-w-0 w-full justify-start gap-3 px-2.5 py-2 text-start" onClick={() => scrollToMarker(marker.messageId)}>
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary")}>
                  <span className="text-[10px] font-semibold">{marker.type === "day" ? "S" : marker.type.slice(0, 3).toUpperCase()}</span>
                </span>
                <span className="min-w-0 max-w-full overflow-hidden">
                  <span className="block truncate text-xs font-semibold">{marker.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{marker.detail || "No additional detail"}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatDate(marker.occurredAt, "datetime")}</span>
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationTimelinePanel({ messages, open, onOpenChange, contextView, onContextViewChange }: ConversationTimelinePanelProps) {
  const desktop = useDesktopLayout();
  if (desktop) {
    return (
      <aside className={cn("w-[480px] min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-s border-border bg-card xl:w-[min(40vw,560px)]", open ? "flex" : "hidden")} aria-label="Conversation timeline details" aria-hidden={!open}>
        <TimelineBody messages={messages} onOpenChange={onOpenChange} contextView={contextView} onContextViewChange={onContextViewChange} />
      </aside>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent forceMount side="right" className="flex min-h-0 w-full max-w-none flex-col overflow-hidden p-0 sm:w-[min(92vw,480px)]">
        <SheetHeader className="sr-only"><SheetTitle>Conversation timeline</SheetTitle><SheetDescription>Important moments from the selected conversation.</SheetDescription></SheetHeader>
        <TimelineBody messages={messages} onOpenChange={onOpenChange} contextView={contextView} onContextViewChange={onContextViewChange} />
      </SheetContent>
    </Sheet>
  );
}
