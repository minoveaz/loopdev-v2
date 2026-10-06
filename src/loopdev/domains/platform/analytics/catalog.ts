import type { AnalyticsMetricDefinition, AnalyticsMetricId } from "./types";

export const analyticsMetricCatalog: Record<AnalyticsMetricId, AnalyticsMetricDefinition> = {
  "crm.contacts": { id: "crm.contacts", suite: "crm", label: "Contactos", format: "number", version: 1 },
  "crm.open_leads": { id: "crm.open_leads", suite: "crm", label: "Leads abiertos", format: "number", version: 1 },
  "crm.open_opportunities": { id: "crm.open_opportunities", suite: "crm", label: "Oportunidades abiertas", format: "number", version: 1 },
  "crm.pipeline_value": { id: "crm.pipeline_value", suite: "crm", label: "Valor del pipeline", format: "currency", version: 1 },
  "crm.pending_tasks": { id: "crm.pending_tasks", suite: "crm", label: "Tareas pendientes", format: "number", version: 1 },
  "crm.activity_volume": { id: "crm.activity_volume", suite: "crm", label: "Actividad", format: "number", version: 1 },
  "document_intelligence.processed": { id: "document_intelligence.processed", suite: "document-intelligence", label: "Documentos procesados", format: "number", version: 1 },
  "document_intelligence.pending_review": { id: "document_intelligence.pending_review", suite: "document-intelligence", label: "Pendientes de revisión", format: "number", version: 1 },
  "document_intelligence.average_confidence": { id: "document_intelligence.average_confidence", suite: "document-intelligence", label: "Confianza media", format: "percent", version: 1 },
  "document_intelligence.estimated_cost": { id: "document_intelligence.estimated_cost", suite: "document-intelligence", label: "Coste estimado", format: "currency", version: 1 },
};
