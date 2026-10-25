import type { Workspace, WorkspaceSuiteKey } from "./auth-port";

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
  availability: { kind: "workspace"; suiteKey: WorkspaceSuiteKey };
  entryPath?: string;
};

export const launchpadSuites: LaunchpadSuite[] = [
  {
    id: "marketing-studio",
    title: "Marketing Studio",
    description: "Brand management and generative content tools for modern teams.",
    version: "1.0.4",
    status: "locked",
    illustration: "marketing",
    availability: { kind: "workspace", suiteKey: "marketing" },
  },
  {
    id: "sales-crm",
    title: "Sales & CRM",
    description: "Manage your sales pipeline and customer relationships with intelligent insights.",
    version: "0.8.2",
    status: "ready",
    illustration: "crm",
    availability: { kind: "workspace", suiteKey: "crm" },
    entryPath: "/app/sales-crm/overview",
  },
  {
    id: "erp",
    title: "ERP",
    description: "Manage products, categories and services for LoopDev operations.",
    version: "0.1.0",
    status: "ready",
    illustration: "erp",
    availability: { kind: "workspace", suiteKey: "operations" },
    entryPath: "/app/erp/products",
  },
  {
    id: "financial-ops",
    title: "Financial Ops",
    description: "Automate billing, payroll, and fiscal compliance.",
    version: "0.5.0",
    status: "locked",
    illustration: "financial",
    availability: { kind: "workspace", suiteKey: "finance" },
  },
  {
    id: "quant-ops",
    title: "Quant Ops",
    description: "Algorithmic trading and high-frequency execution tools.",
    version: "0.0.1",
    status: "lab",
    illustration: "quant",
    availability: { kind: "workspace", suiteKey: "quant" },
  },
  {
    id: "health-os",
    title: "Health OS",
    description: "Clinical workflows, electronic health records, and medical scheduling for healthcare providers.",
    version: "0.1.0",
    status: "locked",
    illustration: "health",
    availability: { kind: "workspace", suiteKey: "health" },
  },
];

export function getAvailableLaunchpadSuites(workspaces: readonly Workspace[]): LaunchpadSuite[] {
  const activeSuiteKeys = new Set(
    workspaces.filter((workspace) => workspace.status === "active").map((workspace) => workspace.suiteKey),
  );

  return launchpadSuites.filter((suite) => {
    if (suite.status !== "ready") return false;
    return activeSuiteKeys.has(suite.availability.suiteKey);
  });
}

export function getLaunchpadSuitesForOrganization(
  organizationSlug: string,
  workspaces: readonly Workspace[],
): LaunchpadSuite[] {
  if (organizationSlug === "loopdev") return launchpadSuites;
  return getAvailableLaunchpadSuites(workspaces);
}
