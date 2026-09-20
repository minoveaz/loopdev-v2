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

type TimelineCategory = "all" | "files" | "media" | "links-places";

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
import { useI18n, useT } from "@/i18n";

function TimelineBody({ messages, onOpenChange, contextView, onContextViewChange }: Omit<ConversationTimelinePanelProps, "open">) {
  const { lang, t } = useI18n();
  const locale = lang === "es" ? "es" : "en";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TimelineCategory>("all");
  const markers = buildConversationTimelineMarkers(messages, locale);
  const categoryMatches = (type: string) => (
    category === "all"
    || (category === "files" && ["document", "catalog_item"].includes(type))
    || (category === "media" && ["audio", "image", "video"].includes(type))
    || (category === "links-places" && ["link", "location"].includes(type))
  );
  const filteredMarkers = markers.filter((marker) => (
    categoryMatches(marker.type)
    && `${marker.label} ${marker.detail}`.toLowerCase().includes(search.trim().toLowerCase())
  ));
  const categoryCounts = {
    all: markers.length,
    files: markers.filter((marker) => ["document", "catalog_item"].includes(marker.type)).length,
    media: markers.filter((marker) => ["audio", "image", "video"].includes(marker.type)).length,
    "links-places": markers.filter((marker) => ["link", "location"].includes(marker.type)).length,
  };
  const groupedMarkers = filteredMarkers.reduce<Record<string, typeof filteredMarkers>>((groups, marker) => {
    const date = formatDate(marker.occurredAt, "medium");
    groups[date] = [...(groups[date] ?? []), marker];
    return groups;
  }, {});
  const scrollToMarker = (messageId: string) => {
    document.getElementById(`conversation-message-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card">
      <ConversationContextPanelHeader
        icon={<span aria-hidden="true">TL</span>}
        title={t("crm.customer360.communications.timeline.title")}
        subtitle={t("crm.customer360.communications.timeline.subtitle")}
      />
      <ConversationContextTabs active={contextView} onChange={onContextViewChange} />
      <div className="border-b border-border px-4 py-4">
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label={t("crm.customer360.communications.timeline.categories")}>
          {([
            ["all", t("crm.customer360.communications.timeline.all")],
            ["files", t("crm.customer360.communications.timeline.files")],
            ["media", t("crm.customer360.communications.timeline.media")],
            ["links-places", t("crm.customer360.communications.timeline.linksPlaces")],
          ] as Array<[TimelineCategory, string]>).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              role="tab"
              aria-selected={category === value}
              variant="ghost"
              size="sm"
              className={cn("h-7 shrink-0 px-2 text-[11px]", category === value && "bg-primary-soft font-semibold text-primary")}
              onClick={() => setCategory(value)}
            >
              {label} <span className="ms-1 text-[10px] text-muted-foreground">{categoryCounts[value]}</span>
            </Button>
          ))}
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={t("crm.customer360.communications.timeline.search")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("crm.customer360.communications.timeline.search")} className="ps-9" />
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3">
        {filteredMarkers.length === 0 ? (
          <p className="px-3 py-5 text-center text-sm text-muted-foreground">
            {category === "files" ? t("crm.customer360.communications.timeline.noFiles") : category === "media" ? t("crm.customer360.communications.timeline.noMedia") : category === "links-places" ? t("crm.customer360.communications.timeline.noLinksPlaces") : t("crm.customer360.communications.timeline.noResults")}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMarkers).map(([date, dateMarkers]) => (
              <section key={date} aria-label={date}>
                <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{date}</h3>
                <div className="space-y-1">
                  {dateMarkers.map((marker) => (
                    <div key={marker.id} className="rounded-md border border-transparent transition-colors hover:border-border hover:bg-muted/40">
                      <Button type="button" variant="ghost" className="h-auto min-w-0 w-full justify-start gap-3 px-2.5 py-2 text-start" onClick={() => scrollToMarker(marker.messageId)}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
                          <span className="text-[10px] font-semibold">{marker.type === "day" ? "S" : marker.type.slice(0, 3).toUpperCase()}</span>
                        </span>
                        <span className="min-w-0 max-w-full overflow-hidden">
                          <span className="block truncate text-xs font-semibold">{marker.label}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{marker.detail || t("crm.customer360.communications.timeline.noDetail")}</span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatDate(marker.occurredAt, "datetime")}</span>
                        </span>
                      </Button>
                      <button type="button" className="ms-12 mb-2 text-[10px] font-medium text-primary hover:underline" onClick={() => scrollToMarker(marker.messageId)}>
                         {t("crm.customer360.communications.timeline.jumpToMessage")}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConversationTimelinePanel({ messages, open, onOpenChange, contextView, onContextViewChange }: ConversationTimelinePanelProps) {
  const t = useT();
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
        <SheetHeader className="sr-only"><SheetTitle>{t("crm.customer360.communications.timeline.title")}</SheetTitle><SheetDescription>{t("crm.customer360.communications.timeline.subtitle")}</SheetDescription></SheetHeader>
        <TimelineBody messages={messages} onOpenChange={onOpenChange} contextView={contextView} onContextViewChange={onContextViewChange} />
      </SheetContent>
    </Sheet>
  );
}
