import { describe, expect, it } from "vitest";
import type { CommunicationMessage } from "@/loopdev/domains/communications";
import {
  buildConversationTimelineMarkers,
  filterTimelineMarkers,
  getTimelineCategoryCounts,
  groupTimelineMarkersByDate,
} from "../../../apps/mobile/domains/communicationsTimeline";

const testMessages: CommunicationMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    direction: "inbound",
    body: "Hola, necesito información",
    authorName: "Carlos Gómez",
    occurredAt: "2026-09-18T10:00:00Z",
    deliveryStatus: null,
    contentType: "text",
  },
  {
    id: "msg-internal",
    conversationId: "conv-1",
    direction: "internal",
    body: "Nota interna del equipo de ventas",
    authorName: "Agente",
    occurredAt: "2026-09-18T10:02:00Z",
    deliveryStatus: null,
    contentType: "text",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    direction: "inbound",
    body: "Adjunto la orden de compra",
    authorName: "Carlos Gómez",
    occurredAt: "2026-09-18T10:05:00Z",
    deliveryStatus: null,
    contentType: "document",
    contentMetadata: { name: "orden_compra_2026.pdf", size: "2.4 MB" },
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    direction: "inbound",
    body: "Foto de la factura",
    authorName: "Carlos Gómez",
    occurredAt: "2026-09-18T10:10:00Z",
    deliveryStatus: null,
    contentType: "image",
    contentMetadata: { url: "https://example.com/factura.png" },
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    direction: "inbound",
    body: "Ubicación de entrega",
    authorName: "Carlos Gómez",
    occurredAt: "2026-09-18T10:15:00Z",
    deliveryStatus: null,
    contentType: "location",
    contentMetadata: { locationLabel: "Av. Reforma 222, CDMX" },
  },
];

describe("Mobile Communications Timeline Domain", () => {
  it("builds timeline markers from messages ignoring internal notes", () => {
    const markers = buildConversationTimelineMarkers(testMessages);
    expect(markers).toHaveLength(4); // start + document + image + location

    expect(markers[0].type).toBe("day");
    expect(markers[0].label).toContain("Conversación iniciada");

    expect(markers[1].type).toBe("document");
    expect(markers[1].detail).toContain("orden_compra_2026.pdf");

    expect(markers[2].type).toBe("image");
    expect(markers[2].detail).toContain("factura.png");

    expect(markers[3].type).toBe("location");
    expect(markers[3].detail).toContain("Av. Reforma 222");
  });

  it("computes category counts accurately", () => {
    const markers = buildConversationTimelineMarkers(testMessages);
    const counts = getTimelineCategoryCounts(markers);

    expect(counts.all).toBe(4);
    expect(counts.files).toBe(1); // document
    expect(counts.media).toBe(1); // image
    expect(counts["links-places"]).toBe(1); // location
  });

  it("filters markers by category and search keyword", () => {
    const markers = buildConversationTimelineMarkers(testMessages);

    // Filter by category 'files'
    const filesOnly = filterTimelineMarkers(markers, "files", "");
    expect(filesOnly).toHaveLength(1);
    expect(filesOnly[0].type).toBe("document");

    // Search query
    const searchMatch = filterTimelineMarkers(markers, "all", "factura");
    expect(searchMatch).toHaveLength(1);
    expect(searchMatch[0].type).toBe("image");

    // Search no match
    const noMatch = filterTimelineMarkers(markers, "all", "inexistente");
    expect(noMatch).toHaveLength(0);
  });

  it("groups markers by date headers", () => {
    const markers = buildConversationTimelineMarkers(testMessages);
    const grouped = groupTimelineMarkersByDate(markers);

    const keys = Object.keys(grouped);
    expect(keys.length).toBeGreaterThan(0);
    expect(grouped[keys[0]].length).toBe(4);
  });
});
