import {
  CalendarDays,
  FileText,
  Image,
  Link2,
  MapPin,
  Mic,
  Search,
  Video,
} from "lucide-react";
import type { CommunicationMessage } from "@/loopdev/domains/communications";
import { formatDate, formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type TimelineMarkerType = "day" | NonNullable<CommunicationMessage["contentType"]>;

interface TimelineMarker {
  id: string;
  messageId: string;
  type: TimelineMarkerType;
  label: string;
  occurredAt: string;
  detail: string;
}

interface ConversationTimelineRailProps {
  messages: CommunicationMessage[];
  onOpenDetails?: () => void;
}

const markerIcons: Record<TimelineMarkerType, typeof CalendarDays> = {
  day: CalendarDays,
  text: CalendarDays,
  document: FileText,
  audio: Mic,
  image: Image,
  video: Video,
  location: MapPin,
  link: Link2,
};

const contentLabels: Record<NonNullable<CommunicationMessage["contentType"]>, string> = {
  text: "Message",
  document: "Document",
  audio: "Audio",
  image: "Image",
  video: "Video",
  location: "Location",
  link: "Link",
};

export function buildConversationTimelineMarkers(messages: CommunicationMessage[]): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const firstInboundIndex = messages.findIndex((message) => message.direction === "inbound");

  messages.forEach((message, index) => {
    if (index === (firstInboundIndex >= 0 ? firstInboundIndex : 0)) {
      markers.push({
        id: `start-${message.id}`,
        messageId: message.id,
        type: "day",
        label: `Conversation started · ${formatDate(message.occurredAt, "medium")}`,
        occurredAt: message.occurredAt,
        detail: message.body,
      });
    }

    if (message.direction === "inbound" && message.contentType && message.contentType !== "text") {
      markers.push({
        id: `content-${message.id}`,
        messageId: message.id,
        type: message.contentType,
        label: `${contentLabels[message.contentType]} · ${formatRelative(message.occurredAt)}`,
        occurredAt: message.occurredAt,
        detail: [message.body, message.contentMetadata?.name, message.contentMetadata?.url, message.contentMetadata?.locationLabel]
          .filter(Boolean)
          .join(" · "),
      });
    }
  });

  return markers;
}

export function ConversationTimelineRail({ messages, onOpenDetails }: ConversationTimelineRailProps) {
  const markers = buildConversationTimelineMarkers(messages);
  if (markers.length < 2) return null;

  const scrollToMarker = (marker: TimelineMarker) => {
    document.getElementById(`conversation-message-${marker.messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <aside className="hidden w-9 shrink-0 flex-col items-center border-s border-border/60 bg-muted/10 py-4 lg:flex" aria-label="Conversation timeline">
        <button type="button" className="mb-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open conversation timeline details" title="Open timeline details" onClick={onOpenDetails}>
          <Search className="h-3.5 w-3.5" />
        </button>
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-around gap-2">
          <span className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-border/70" aria-hidden="true" />
          {markers.map((marker) => {
            const Icon = markerIcons[marker.type];
            return (
              <button
                key={marker.id}
                type="button"
                title={marker.label}
                aria-label={`Jump to ${marker.label}`}
                className={cn(
                  "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary",
                  marker.type !== "day" && "h-6 w-6 text-primary",
                )}
                onClick={() => scrollToMarker(marker)}
              >
                <Icon className={cn("h-2.5 w-2.5", marker.type !== "day" && "h-3.5 w-3.5")} />
              </button>
            );
          })}
        </div>
      </aside>
      <div className="border-t border-border/60 bg-muted/10 px-3 py-1.5 lg:hidden">
        <button type="button" className="flex w-full items-center justify-between text-xs text-muted-foreground" onClick={onOpenDetails}>
          <span>Conversation timeline</span>
          <span className="font-medium text-primary">{markers.length} checkpoints</span>
        </button>
      </div>
    </>
  );
}
