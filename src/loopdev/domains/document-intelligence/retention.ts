import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";
import {
  DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS,
  type DocumentRetentionPolicy,
  type DocumentRetentionSettings,
  TEMPORARY_DOCUMENT_RETENTION_DAYS,
} from "./lifecycle";
import { validateRetentionDays } from "./lifecycle-contracts";

const client = defaultWebAuthAdapter.getClient();

export async function getDocumentRetentionSettings(organizationId: string): Promise<DocumentRetentionSettings> {
  if (!client) throw new Error("Shared Supabase client unavailable.");
  const { data, error } = await client
    .from("document_intelligence_retention_policies")
    .select("organization_id, document_type, retention_days, updated_at, updated_by")
    .eq("organization_id", organizationId)
    .order("document_type");
  if (error) throw error;
  return {
    organizationId,
    defaultRetentionDays: DEFAULT_PERSISTED_DOCUMENT_RETENTION_DAYS,
    temporaryRetentionDays: TEMPORARY_DOCUMENT_RETENTION_DAYS,
    policies: (data ?? []).map((row) => ({
      organizationId: row.organization_id,
      documentType: row.document_type,
      retentionDays: row.retention_days,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    })),
  };
}

export async function updateDocumentRetentionPolicy(
  policy: DocumentRetentionPolicy,
): Promise<DocumentRetentionPolicy> {
  validateRetentionDays(policy.retentionDays);
  if (!client) throw new Error("Shared Supabase client unavailable.");
  const { data, error } = await client
    .from("document_intelligence_retention_policies")
    .upsert({
      organization_id: policy.organizationId,
      document_type: policy.documentType,
      retention_days: policy.retentionDays,
    }, { onConflict: "organization_id,document_type" })
    .select("organization_id, document_type, retention_days, updated_at, updated_by")
    .single();
  if (error) throw error;
  return {
    organizationId: data.organization_id,
    documentType: data.document_type,
    retentionDays: data.retention_days,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
}
