import { createLocalStore } from "@/lib/localStore";
import type { OrganizationEntitlement } from "../types";

const organizationId = "local-development-organization";

export const localOrganizationEntitlementsStore = createLocalStore<OrganizationEntitlement>({
  key: "loopdev:platform:entitlements",
  idPrefix: "entitlement",
  seed: [
    { id: "entitlement-automations", organizationId, key: "crm.automations", enabled: true, limit: 10, used: 0, createdAt: "", updatedAt: "" },
    { id: "entitlement-executions", organizationId, key: "crm.automation.executions", enabled: true, limit: 100, used: 0, createdAt: "", updatedAt: "" },
    { id: "entitlement-contacts", organizationId, key: "crm.contacts", enabled: true, limit: null, used: 0, createdAt: "", updatedAt: "" },
    { id: "entitlement-opportunities", organizationId, key: "crm.opportunities", enabled: true, limit: null, used: 0, createdAt: "", updatedAt: "" },
  ],
});

