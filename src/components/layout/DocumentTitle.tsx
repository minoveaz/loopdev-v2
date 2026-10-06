import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTenantContext } from "@/hooks/use-tenant-context";

const moduleLabels: Record<string, string> = {
  crm: "CRM",
  "document-intelligence": "Document Intelligence",
  tools: "Herramientas",
  settings: "Configuración",
  launchpad: "Launchpad",
  "sales-crm": "CRM",
  erp: "ERP",
  projects: "Proyectos",
  apps: "Aplicaciones",
  dashboards: "Panel",
  reports: "Informes",
};

function getModuleLabel(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.includes("document-intelligence")) return moduleLabels["document-intelligence"];

  const segment = segments.find((value) => moduleLabels[value]);
  if (!segment) return "Inicio";
  return moduleLabels[segment];
}

export function DocumentTitle() {
  const { pathname } = useLocation();
  const { activeOrganization } = useTenantContext();

  useEffect(() => {
    const moduleLabel = getModuleLabel(pathname);
    const tenantLabel = activeOrganization?.name;
    document.title = tenantLabel
      ? `LoopDev | ${tenantLabel} | {${moduleLabel}}`
      : `LoopDev | {${moduleLabel}}`;
  }, [activeOrganization?.name, pathname]);

  return null;
}
