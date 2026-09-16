export interface CatalogItem {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "cat_item_crm_core",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    key: "CRM-CORE-ANNUAL",
    name: "LoopDev Sales CRM Core (Anual)",
    description: "Licencia corporativa anual para gestión de contactos, tareas y pipelines.",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat_item_doc_intel",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    key: "AI-DOC-INTELLIGENCE",
    name: "Document Intelligence AI Pack",
    description: "Extracción neuronal automatizada de documentos de identidad, nóminas y contratos.",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat_item_erp_connect",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    key: "ERP-SYNC-BRIDGE",
    name: "Conector ERP Financiero",
    description: "Sincronización bidireccional de facturas, cotizaciones y catálogo.",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat_item_support_prem",
    organizationId: "80fce911-57c5-4a83-809f-78df6a3736f7",
    key: "PREMIUM-SLA-SUPPORT",
    name: "Soporte Técnico 24/7 Premium",
    description: "Acuerdo de nivel de servicio prioritario con gestor de cuenta dedicado.",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const mobileCatalogAdapter = {
  async listCatalogItems(params?: { organizationId?: string; includeArchived?: boolean }): Promise<CatalogItem[]> {
    return DEFAULT_CATALOG_ITEMS.filter((item) => (params?.includeArchived ? true : item.status !== "archived"));
  },
};
