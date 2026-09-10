import { beforeEach, describe, expect, it } from "vitest";
import { localLoopdevAdapter } from "@/loopdev/domains/crm/adapter/local";
import {
  crmCustomFieldDefinitionsStore,
  crmCustomFieldValuesStore,
  crmEntityTagsStore,
  crmSavedViewsStore,
  crmTagsStore,
} from "@/loopdev/domains/crm/operations/data/localOperations";
import { CRM_LOCAL_CONTEXT } from "@/loopdev/domains/crm/operations/types";

describe("CRM operations local contracts", () => {
  beforeEach(() => {
    crmSavedViewsStore.reset();
    crmTagsStore.reset();
    crmEntityTagsStore.reset();
    crmCustomFieldDefinitionsStore.reset();
    crmCustomFieldValuesStore.reset();
  });

  it("searches authorized records and persists reusable filtered views", async () => {
    const results = await localLoopdevAdapter.crm.operations.search({
      ...CRM_LOCAL_CONTEXT,
      query: "Aria",
      entityTypes: ["contact"],
    });
    expect(results[0]).toMatchObject({ entityType: "contact", title: "Aria Blackwood" });

    const view = await localLoopdevAdapter.crm.operations.createSavedView(CRM_LOCAL_CONTEXT, {
      name: "Priority contacts",
      entityType: "contact",
      filters: [{ field: "company", operator: "contains", value: "Acme" }],
      columns: ["name", "email"],
      visibility: "workspace",
    });
    expect((await localLoopdevAdapter.crm.operations.listSavedViews(CRM_LOCAL_CONTEXT)).some((item) => item.id === view.id)).toBe(true);
  });

  it("backs tag bulk actions and custom field values with stores", async () => {
    const tag = await localLoopdevAdapter.crm.operations.createTag(CRM_LOCAL_CONTEXT, { name: "Renewal", color: "#0ea5e9", visibility: "workspace" });
    const action = await localLoopdevAdapter.crm.operations.bulkUpdateEntityTags({
      ...CRM_LOCAL_CONTEXT,
      entityType: "contact",
      entityIds: ["crm_cust_1", "crm_cust_2"],
      tagId: tag.id,
      operation: "add",
    });
    expect(action.updated).toBe(2);
    expect((await localLoopdevAdapter.crm.operations.listEntityTags(CRM_LOCAL_CONTEXT, "contact")).length).toBe(2);

    const field = await localLoopdevAdapter.crm.operations.createCustomFieldDefinition(CRM_LOCAL_CONTEXT, {
      entityType: "contact",
      key: "renewal_score",
      label: "Renewal score",
      type: "number",
      required: false,
      visibility: "workspace",
      options: [],
    });
    const value = await localLoopdevAdapter.crm.operations.setCustomFieldValue({
      ...CRM_LOCAL_CONTEXT,
      entityType: "contact",
      entityId: "crm_cust_1",
      definitionId: field.id,
      value: 5,
    });
    expect(value.value).toBe(5);
  });

  it("rejects custom field values that violate their definition", async () => {
    await expect(localLoopdevAdapter.crm.operations.setCustomFieldValue({
      ...CRM_LOCAL_CONTEXT,
      entityType: "contact",
      entityId: "crm_cust_1",
      definitionId: "crm_field_account_tier",
      value: "Unknown",
    })).rejects.toThrow("configured options");
  });

  it("validates, deduplicates, and reports each CSV row", async () => {
    const csv = [
      "name,email,phone,company",
      "Imported Person,imported@example.com,+1 555 9000,Acme",
      "Duplicate Person,aria.blackwood@example.com,+1 555 0100,Acme",
      ",invalid@example.com,+1 555 9001,Acme",
      "Repeated Person,repeated@example.com,+1 555 9002,Acme",
      "Repeated Again,repeated@example.com,+1 555 9003,Acme",
    ].join("\n");
    const result = await localLoopdevAdapter.crm.operations.importContacts({
      ...CRM_LOCAL_CONTEXT,
      csv,
      mode: "commit",
      deduplicateBy: "email_or_phone",
    });
    expect(result).toMatchObject({ totalRows: 5, importedRows: 2, duplicateRows: 2, invalidRows: 1 });
    expect(result.results.map((row) => row.status)).toEqual(["imported", "duplicate", "invalid", "imported", "duplicate"]);
  });

  it("exports stable CSV headers through the adapter", async () => {
    const csv = await localLoopdevAdapter.crm.operations.exportCsv({ ...CRM_LOCAL_CONTEXT, entityType: "contact", query: "Aria" });
    expect(csv.split("\r\n")[0]).toBe("id,name,email,phone,company,city,country");
    expect(csv).toContain("Aria Blackwood");
  });
});
