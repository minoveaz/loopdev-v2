export type LaunchpadSuiteStatus = "ready" | "lab" | "locked";

export type LaunchpadIllustrationKey =
  | "marketing"
  | "crm"
  | "erp"
  | "financial"
  | "quant"
  | "health";

export type LaunchpadSuite = {
  id: string;
  title: string;
  description: string;
  version: string;
  status: LaunchpadSuiteStatus;
  illustration: LaunchpadIllustrationKey;
  entryPath?: string;
};

export const launchpadSuites: LaunchpadSuite[] = [
  {
    id: "marketing-studio",
    title: "Marketing Studio",
    description: "High-performance identity governance and generative content engine for modern teams.",
    version: "1.0.4",
    status: "locked",
    illustration: "marketing",
  },
  {
    id: "sales-crm",
    title: "Sales & CRM",
    description: "Pipeline intelligence and relationship management powered by predictive neural models.",
    version: "0.8.2",
    status: "ready",
    illustration: "crm",
    entryPath: "/app/sales-crm/overview",
  },
  {
    id: "document-intelligence",
    title: "Document Intelligence",
    description: "OCR inteligente, extracción de identidad y tipificación de documentos.",
    version: "1.0.0",
    status: "ready",
    illustration: "crm",
    entryPath: "/app/tools/document-intelligence",
  },
  {
    id: "erp",
    title: "ERP",
    description: "Shared product and service catalogs for the next generation of LoopDev operations.",
    version: "0.1.0",
    status: "ready",
    illustration: "erp",
    entryPath: "/app/erp/overview",
  },
  {
    id: "financial-ops",
    title: "Financial Ops",
    description: "Automated billing, payroll, and industrial-grade fiscal compliance orchestration.",
    version: "0.5.0",
    status: "locked",
    illustration: "financial",
  },
  {
    id: "quant-ops",
    title: "Quant Ops",
    description: "Algorithmic trading engine and high-frequency execution command center.",
    version: "0.0.1",
    status: "lab",
    illustration: "quant",
  },
  {
    id: "health-os",
    title: "Health OS",
    description: "Industrial-grade clinical care, electronic health records, and medical agenda for IPS providers.",
    version: "0.1.0",
    status: "locked",
    illustration: "health",
  },
];
