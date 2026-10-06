import type { CommunicationMessage } from "../../../packages/contracts/src/communications";
import type { MobileLangCode } from "../i18n";

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

const contentLabels: Record<MobileLangCode, Record<NonNullable<CommunicationMessage["contentType"]>, string>> = {
  es: {
    text: "Mensaje",
    document: "Documento adjunto",
    audio: "Mensaje de voz",
    image: "Imagen",
    video: "Vídeo",
    location: "Ubicación compartida",
    link: "Enlace web",
    catalog_item: "Producto del catálogo",
  },
  en: {
    text: "Message",
    document: "Attached document",
    audio: "Voice message",
    image: "Image",
    video: "Video",
    location: "Shared location",
    link: "Web link",
    catalog_item: "Catalog item",
  },
};

function formatRelativeTime(dateStr: string, lang: MobileLangCode): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return lang === "es" ? "Ahora" : "Now";
    if (diffSec < 3600) return lang === "es" ? `Hace ${Math.floor(diffSec / 60)} min` : `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return lang === "es" ? `Hace ${Math.floor(diffSec / 3600)} h` : `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return lang === "es" ? `Hace ${Math.floor(diffSec / 86400)} d` : `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function formatDateHeader(dateStr: string, lang: MobileLangCode): string {
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

    if (isToday) return lang === "es" ? "Hoy" : "Today";
    if (isYesterday) return lang === "es" ? "Ayer" : "Yesterday";

    return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
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
  messages: CommunicationMessage[],
  lang: MobileLangCode = "es",
): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const inboundMessages = messages.filter((m) => m.direction === "inbound");

  inboundMessages.forEach((message, index) => {
    // 1. Initial milestone: Conversation started
    if (index === 0) {
      markers.push({
        id: `start-${message.id}`,
        messageId: message.id,
        type: "day",
        label: lang === "es" ? "Conversación iniciada" : "Conversation started",
        occurredAt: message.occurredAt,
        detail: message.body || (lang === "es" ? "Inicio de interacción" : "Interaction started"),
        authorName: message.authorName,
        direction: message.direction,
      });
    }

    // 2. Rich content milestones
    if (message.contentType && message.contentType !== "text") {
      const label = `${contentLabels[lang][message.contentType]} · ${formatRelativeTime(message.occurredAt, lang)}`;
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
        detail: detailParts.length > 0 ? detailParts.join(" · ") : (lang === "es" ? "Elemento compartido" : "Shared item"),
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
  markers: TimelineMarker[],
  lang: MobileLangCode = "es",
): Record<string, TimelineMarker[]> {
  const groups: Record<string, TimelineMarker[]> = {};
  for (const marker of markers) {
    const groupKey = formatDateHeader(marker.occurredAt, lang);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(marker);
  }
  return groups;
}
