import type { CommunicationMessage } from "../../../src/loopdev/domains/communications";

export type TimelineMarkerType =
  | "day"
  | "document"
  | "audio"
  | "image"
  | "video"
  | "location"
  | "link"
  | "catalog_item";

export type TimelineCategory = "all" | "files" | "media" | "links-places";

export interface TimelineMarker {
  id: string;
  messageId: string;
  type: TimelineMarkerType;
  label: string;
  occurredAt: string;
  detail: string;
  authorName?: string;
  direction: "inbound" | "outbound" | "internal";
}

const contentLabels: Record<NonNullable<CommunicationMessage["contentType"]>, string> = {
  text: "Mensaje",
  document: "Documento adjunto",
  audio: "Mensaje de voz",
  image: "Imagen",
  video: "Video",
  location: "Ubicación compartida",
  link: "Enlace web",
  catalog_item: "Producto del catálogo",
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Ahora";
    if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 604800) return `Hace ${Math.floor(diffSec / 86400)} d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function formatDateHeader(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Hoy";
    if (isYesterday) return "Ayer";

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Builds timeline markers from conversation messages matching desktop semantics.
 */
export function buildConversationTimelineMarkers(
  messages: CommunicationMessage[]
): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const nonInternal = messages.filter((m) => m.direction !== "internal");
  const firstInboundIndex = nonInternal.findIndex((m) => m.direction === "inbound");

  nonInternal.forEach((message, index) => {
    // 1. Initial milestone: Conversation started
    if (index === (firstInboundIndex >= 0 ? firstInboundIndex : 0)) {
      markers.push({
        id: `start-${message.id}`,
        messageId: message.id,
        type: "day",
        label: `Conversación iniciada`,
        occurredAt: message.occurredAt,
        detail: message.body || "Inicio de interacción",
        authorName: message.authorName,
        direction: message.direction,
      });
    }

    // 2. Rich content milestones
    if (message.contentType && message.contentType !== "text") {
      const label = `${contentLabels[message.contentType]} · ${formatRelativeTime(message.occurredAt)}`;
      const detailParts = [
        message.contentMetadata?.name,
        message.contentMetadata?.url,
        message.contentMetadata?.locationLabel,
        message.body,
      ].filter(Boolean);

      markers.push({
        id: `content-${message.id}`,
        messageId: message.id,
        type: message.contentType,
        label,
        occurredAt: message.occurredAt,
        detail: detailParts.length > 0 ? detailParts.join(" · ") : "Elemento compartido",
        authorName: message.authorName,
        direction: message.direction,
      });
    }
  });

  return markers;
}

/**
 * Tests whether a marker type belongs to the selected category.
 */
export function categoryMatchesMarker(category: TimelineCategory, type: TimelineMarkerType): boolean {
  if (category === "all") return true;
  if (category === "files") return type === "document" || type === "catalog_item";
  if (category === "media") return type === "audio" || type === "image" || type === "video";
  if (category === "links-places") return type === "link" || type === "location";
  return false;
}

/**
 * Calculates item counts for each timeline category.
 */
export function getTimelineCategoryCounts(markers: TimelineMarker[]): Record<TimelineCategory, number> {
  return {
    all: markers.length,
    files: markers.filter((m) => m.type === "document" || m.type === "catalog_item").length,
    media: markers.filter((m) => ["audio", "image", "video"].includes(m.type)).length,
    "links-places": markers.filter((m) => ["link", "location"].includes(m.type)).length,
  };
}

/**
 * Filters markers by category and search query.
 */
export function filterTimelineMarkers(
  markers: TimelineMarker[],
  category: TimelineCategory,
  query: string
): TimelineMarker[] {
  const q = query.trim().toLowerCase();
  return markers.filter((marker) => {
    if (!categoryMatchesMarker(category, marker.type)) return false;
    if (!q) return true;
    const textToMatch = `${marker.label} ${marker.detail} ${marker.authorName || ""}`.toLowerCase();
    return textToMatch.includes(q);
  });
}

/**
 * Groups filtered markers chronologically by date string.
 */
export function groupTimelineMarkersByDate(
  markers: TimelineMarker[]
): Record<string, TimelineMarker[]> {
  const groups: Record<string, TimelineMarker[]> = {};
  for (const marker of markers) {
    const groupKey = formatDateHeader(marker.occurredAt);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(marker);
  }
  return groups;
}
