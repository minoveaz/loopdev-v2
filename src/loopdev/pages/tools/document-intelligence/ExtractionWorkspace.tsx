import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, FileText, Loader2, RefreshCw, Search } from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useT } from "@/i18n";
import { useExtractionSession } from "@/loopdev/domains/document-intelligence";
import { DocumentDropzone } from "@/loopdev/components/document-intelligence/DocumentDropzone";
import { DocumentViewer } from "@/loopdev/components/document-intelligence/DocumentViewer";
import { ExtractionProgressLoader } from "@/loopdev/components/document-intelligence/ExtractionProgressLoader";
import { ExtractionTransitionSpinner } from "@/loopdev/components/document-intelligence/ExtractionTransitionSpinner";
import { ExtractionReviewPanel } from "@/loopdev/components/document-intelligence/ExtractionReviewPanel";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import type { IdentityDocumentFields } from "@/loopdev/domains/document-intelligence";
import { promoteDocumentToPlatformFile } from "@/loopdev/domains/document-intelligence";

export default function DocumentIntelligenceExtractionWorkspace() {
  const t = useT();
  const { extractionId = "nueva" } = useParams<{ extractionId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();
  const [contactActionLoading, setContactActionLoading] = useState(false);
  const [contactMatches, setContactMatches] = useState<CRMContact[]>([]);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactSearchFields, setContactSearchFields] = useState<IdentityDocumentFields | null>(null);

  const session = useExtractionSession({
    extractionId,
    sourceSuite: "crm",
  });

  const handleConfirmAndFinish = async (fields: any) => {
    const record = await session.confirmExtraction(fields);
    if (record) {
      // Regresa al histórico global con la nueva extracción completada
      navigate("/app/tools/document-intelligence");
    }
  };

  const contactInputFromFields = (fields: IdentityDocumentFields) => {
    const fullName = fields.fullName?.trim() || "";
    const givenNames = fields.givenNames?.trim() || fullName.split(/\s+/)[0] || "Cliente";
    return {
      organizationId: session.currentRecord?.organizationId ?? "",
      firstName: givenNames,
      lastName: fields.firstSurname ?? fields.surnames ?? null,
      secondLastName: fields.secondSurname ?? null,
      documentType: fields.documentType || "passport",
      documentNumber: fields.documentNumber,
      birthDate: fields.birthDate,
      gender: fields.sex === "M" ? "male" : fields.sex === "F" ? "female" : null,
      country: fields.issuingCountry,
      attributes: {
        nationality: fields.nationality,
        passportIssueDate: fields.issueDate,
        passportExpiryDate: fields.expiryDate,
        mrz: fields.mrz,
        documentIntelligenceExtractionId: session.currentRecord?.id,
      },
    };
  };

  const findExistingContact = async (fields: IdentityDocumentFields) => {
    setContactSearchFields(fields);
    setContactDialogOpen(true);
    setContactActionLoading(true);
    setContactMessage(null);
    setContactMatches([]);
    try {
      const input = contactInputFromFields(fields);
      if (!input.organizationId) throw new Error("No hay una organización activa.");
      const page = await loopdevAdapter.crm.listContacts({ organizationId: input.organizationId, query: input.documentNumber ?? input.firstName, limit: 20 });
      const matches = page.items.filter((contact) =>
        (input.documentNumber && contact.documentNumber?.toLowerCase() === input.documentNumber.toLowerCase())
        || `${contact.firstName} ${contact.lastName ?? ""}`.toLowerCase().includes(input.firstName.toLowerCase()),
      );
      setContactMatches(matches);
      setContactMessage(matches.length ? "Encontramos posibles contactos existentes." : "No encontramos coincidencias. Puedes crear el contacto.");
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "No se pudieron buscar contactos.");
    } finally {
      setContactActionLoading(false);
    }
  };

  const createContact = async (fields: IdentityDocumentFields) => {
    setContactDialogOpen(false);
    navigate("/app/sales-crm/contacts", {
      state: {
        documentFields: fields,
        extractionId: session.currentRecord?.id ?? null,
        documentLifecycle: session.currentRecord?.lifecycle ?? null,
        documentFile: session.currentRecord?.files.front ?? null,
      },
    });
  };

  const linkExistingContact = async (contact: CRMContact) => {
    const record = session.currentRecord;
    if (!record?.lifecycle) {
      setContactMessage("La extracción no tiene una referencia persistente para promocionar el documento.");
      return;
    }
    setContactActionLoading(true);
    try {
      await promoteDocumentToPlatformFile({
        organizationId: record.organizationId,
        documentId: record.lifecycle.documentId,
        extractionId: record.id,
        sourceSuite: record.sourceSuite,
        documentType: record.documentType,
        contactId: contact.id,
        tempStoragePath: record.lifecycle.tempStoragePath,
        fileName: record.files.front?.name ?? record.title,
        mediaType: record.files.front?.mimeType ?? "application/pdf",
        size: record.files.front?.size ?? 0,
        expectedVersion: record.lifecycle.version,
        idempotencyKey: `document-promote:${record.id}:${contact.id}`,
      });
      setContactMessage(`Documento vinculado a ${contact.firstName} ${contact.lastName ?? ""} y promovido a Files.`);
      setContactMatches([contact]);
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "No se pudo promover el documento.");
    } finally {
      setContactActionLoading(false);
    }
  };

  const getFilePreviewData = () => {
    if (!session.frontFile) return { url: "", name: "Documento", mimeType: "image/jpeg" };
    const file = session.frontFile;
    const isNativeFile = file instanceof File;
    return {
      url: isNativeFile ? URL.createObjectURL(file) : file.previewUrl || "",
      name: file.name,
      mimeType: isNativeFile ? file.type : file.mimeType,
    };
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("common.loopdev.documentIntelligence.extraction", { id: extractionId })}
        description={t("common.loopdev.documentIntelligence.description")}
        breadcrumbs={
          trail.length
            ? trail
            : [
                { label: "Tools" },
                { label: "Document Intelligence", to: "/app/tools/document-intelligence" },
                { label: extractionId },
              ]
        }
        actions={
          <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
              <Link to="/app/tools/document-intelligence">
                <ArrowLeft className="me-1.5 h-3.5 w-3.5" />
                {t("common.loopdev.documentIntelligence.history")}
              </Link>
            </Button>
          </div>
        }
      />

      {session.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {session.error}
        </div>
      )}

      <div className="mt-2 min-h-[560px]">
        {/* Paso 1: Dropzone de subida */}
        {session.step === "intake" && (
          <DocumentDropzone
            onFileSelected={session.selectFile}
          />
        )}

        {/* Paso 2: Preview con visor y botón para extraer */}
        {session.step === "preview" && session.frontFile && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="space-y-4">
              <DocumentViewer
                previewUrl={preview.url}
                fileName={preview.name}
                mimeType={preview.mimeType}
                className="h-[520px]"
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button variant="outline" onClick={session.resetSession}>
                  {t("common.loopdev.documentIntelligence.changeDocument")}
                </Button>
                <Button onClick={session.startExtraction} className="gap-2">
                  {t("common.loopdev.documentIntelligence.extractInformation")}
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Paso 3: Loader detallado por pasos */}
        {session.step === "processing" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ExtractionProgressLoader
              steps={session.processingSteps}
              progressPercent={session.progressPercent}
            />
          </div>
        )}

        {/* Paso 4: Transición de 3 segundos con LogoSpinner */}
        {session.step === "transition" && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <ExtractionTransitionSpinner />
          </div>
        )}

        {/* Paso 5: Split-Screen con documento a la izquierda y campos a la derecha */}
        {session.step === "extracted" && session.currentRecord && (() => {
          const preview = getFilePreviewData();
          return (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 min-h-[640px]">
              {/* Lado izquierdo: Visor fijado con la imagen/pdf procesada */}
              <div className="flex flex-col">
                <DocumentViewer
                  previewUrl={preview.url}
                  fileName={preview.name}
                  mimeType={preview.mimeType}
                  className="h-full min-h-[540px]"
                />
              </div>

              {/* Lado derecho: Panel de campos con las 3 opciones de organización */}
              <div className="flex flex-col">
                <ExtractionReviewPanel
                  extraction={session.currentRecord}
                  onConfirm={handleConfirmAndFinish}
                  onReset={session.resetSession}
                  confirmLoading={session.actionLoading}
                  confirmLabel={t("common.loopdev.documentIntelligence.confirmExtraction")}
                  onCreateContact={createContact}
                  onFindExistingContact={findExistingContact}
                  contactActionLoading={contactActionLoading}
                />
              </div>
            </div>
          );
        })()}
      </div>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar contacto existente
            </DialogTitle>
            <DialogDescription>
              Comprobamos si ya existe un contacto asociado a los datos extraídos del documento.
            </DialogDescription>
          </DialogHeader>

          {contactActionLoading && (
            <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
              <span>Buscando contactos…</span>
            </div>
          )}

          {!contactActionLoading && contactMatches.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Encontramos posibles contactos existentes</p>
              <div className="space-y-2">
                {contactMatches.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                    <p>{contact.firstName} {contact.lastName ?? ""} · {contact.documentNumber ?? "sin documento"}</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => void linkExistingContact(contact)} disabled={contactActionLoading}>
                      Vincular
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!contactActionLoading && contactMatches.length === 0 && contactMessage && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900">
              {contactMessage}
            </div>
          )}

          <DialogFooter>
            {!contactActionLoading && contactMatches.length === 0 && contactSearchFields && (
              <Button type="button" onClick={() => void createContact(contactSearchFields)}>
                Crear contacto CRM
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
