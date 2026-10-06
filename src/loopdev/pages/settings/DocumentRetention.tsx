import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTenantContext } from "@/hooks/use-tenant-context";
import {
  getDocumentRetentionSettings,
  updateDocumentRetentionPolicy,
  type DocumentRetentionPolicy,
  type DocumentType,
} from "@/loopdev/domains/document-intelligence";

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: "spanish-dni", label: "Spanish DNI" },
  { value: "spanish-nie", label: "Spanish NIE" },
  { value: "passport", label: "Passport" },
  { value: "driver-license", label: "Driver license" },
  { value: "foreign-id", label: "Foreign identity document" },
];

export default function DocumentRetentionSettings() {
  const { activeOrganization } = useTenantContext();
  const { trail } = useBreadcrumbs();
  const organizationId = activeOrganization?.id ?? "";
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!organizationId) {
      setLoading(false);
      setError("Selecciona una organización activa para configurar la retención.");
      return () => { active = false; };
    }
    setLoading(true);
    void getDocumentRetentionSettings(organizationId)
      .then((settings) => {
        if (!active) return;
        setValues(Object.fromEntries(DOCUMENT_TYPES.map(({ value }) => [
          value,
          settings.policies.find((policy) => policy.documentType === value)?.retentionDays
            ?? settings.defaultRetentionDays,
        ])));
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load retention settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [organizationId]);

  const save = async (documentType: DocumentType) => {
    setSaving(documentType);
    setMessage(null);
    setError(null);
    const policy: DocumentRetentionPolicy = {
      organizationId,
      documentType,
      retentionDays: values[documentType] ?? 365,
    };
    try {
      const saved = await updateDocumentRetentionPolicy(policy);
      setValues((current) => ({ ...current, [documentType]: saved.retentionDays }));
      setMessage(`${documentType} retention saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save retention policy.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Document retention"
        description="Configure how long associated identity documents remain in Files."
        breadcrumbs={trail.length ? trail : [{ label: "Settings" }, { label: "Document retention" }]}
      />
      <SurfaceCard>
        <SurfaceCardHeader
          title="Retention by document type"
          description="Unassociated documents remain temporary for 30 days. Associated documents default to 365 days."
          icon={ShieldCheck}
        />
        <SurfaceCardBody className="space-y-3">
          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {message && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
          {loading ? <p className="text-sm text-muted-foreground">Loading retention policies…</p> : DOCUMENT_TYPES.map(({ value, label }) => (
            <div key={value} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">Allowed range: 1–3650 days</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`${label} retention days`}
                  type="number"
                  min={1}
                  max={3650}
                  value={values[value] ?? 365}
                  onChange={(event) => setValues((current) => ({ ...current, [value]: Number(event.target.value) }))}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">days</span>
                <Button size="sm" onClick={() => void save(value)} disabled={saving === value}>
                  <Save className="me-1.5 h-4 w-4" />
                  {saving === value ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ))}
        </SurfaceCardBody>
      </SurfaceCard>
    </PageContainer>
  );
}
