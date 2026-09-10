import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, FileText, Pencil, Plus } from "lucide-react";
import { DataCard, DataTable, PageContainer, PageHeader, StatusBadge, type DataTableAction, type DataTableColumn } from "@/components/common";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  platformAdapter,
  usePlatformTaskTemplates,
  type TaskPriority,
  type TaskTemplateRecord,
} from "@/loopdev/domains/platform";

const relationOptions = ["contact", "lead", "opportunity"] as const;

function TemplateForm({
  template,
  formId,
  onDirtyChange,
  onSubmit,
}: {
  template: TaskTemplateRecord | null;
  formId: string;
  onDirtyChange: (dirty: boolean) => void;
  onSubmit: (input: {
    key: string;
    name: string;
    description: string;
    defaultPriority: TaskPriority;
    defaultDueDays: number | null;
    relationTypes: string[];
  }) => Promise<unknown>;
}) {
  const [key, setKey] = useState(template?.key ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(template?.defaultPriority ?? "normal");
  const [dueDays, setDueDays] = useState(template?.defaultDueDays == null ? "" : String(template.defaultDueDays));
  const [relationTypes, setRelationTypes] = useState<string[]>(template?.relationTypes ?? ["contact"]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setKey(template?.key ?? "");
    setName(template?.name ?? "");
    setDescription(template?.description ?? "");
    setPriority(template?.defaultPriority ?? "normal");
    setDueDays(template?.defaultDueDays == null ? "" : String(template.defaultDueDays));
    setRelationTypes(template?.relationTypes ?? ["contact"]);
    setError(null);
    onDirtyChange(false);
  }, [onDirtyChange, template]);

  const mark = () => onDirtyChange(true);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!key.trim() || !name.trim() || !relationTypes.length) {
      setError("Add a key, name and at least one related record type.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({
        key: key.trim(),
        name: name.trim(),
        description: description.trim(),
        defaultPriority: priority,
        defaultDueDays: dueDays === "" ? null : Number(dueDays),
        relationTypes,
      });
      onDirtyChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save template.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-4" aria-label={template ? "Edit task template" : "Create task template"}>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-key`}>Template key</Label>
        <Input id={`${formId}-key`} value={key} onChange={(event) => { setKey(event.target.value); mark(); }} disabled={pending || Boolean(template)} placeholder="commercial-follow-up" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input id={`${formId}-name`} value={name} onChange={(event) => { setName(event.target.value); mark(); }} disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Textarea id={`${formId}-description`} value={description} onChange={(event) => { setDescription(event.target.value); mark(); }} disabled={pending} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-priority`}>Default priority</Label>
          <Select value={priority} onValueChange={(value) => { setPriority(value as TaskPriority); mark(); }} disabled={pending}>
            <SelectTrigger id={`${formId}-priority`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-due-days`}>Default due days</Label>
          <Input id={`${formId}-due-days`} type="number" min="0" value={dueDays} onChange={(event) => { setDueDays(event.target.value); mark(); }} disabled={pending} placeholder="Optional" />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Available for</legend>
        <div className="flex flex-wrap gap-2">
          {relationOptions.map((relationType) => {
            const checked = relationTypes.includes(relationType);
            return (
              <Button
                key={relationType}
                type="button"
                variant={checked ? "secondary" : "outline"}
                aria-pressed={checked}
                onClick={() => {
                  setRelationTypes((current) => checked ? current.filter((item) => item !== relationType) : [...current, relationType]);
                  mark();
                }}
              >
                {relationType}
              </Button>
            );
          })}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

export default function TaskTemplates() {
  const { trail } = useBreadcrumbs();
  const scope = platformAdapter.getScope();
  const organizationScope = useMemo(
    () => ({ organizationId: scope.organizationId, workspaceId: scope.workspaceId, brandId: scope.brandId }),
    [scope.brandId, scope.organizationId, scope.workspaceId],
  );
  const templates = usePlatformTaskTemplates({ scope: organizationScope, includeArchived: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplateRecord | null>(null);
  const [formKey, setFormKey] = useState(0);
  const dirtyRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openCreate = () => {
    setEditing(null);
    setFormKey((value) => value + 1);
    setDrawerOpen(true);
  };
  const openEdit = (template: TaskTemplateRecord) => {
    setEditing(template);
    setFormKey((value) => value + 1);
    setDrawerOpen(true);
  };
  const columns: DataTableColumn<TaskTemplateRecord>[] = useMemo(() => [
    {
      key: "name",
      header: "Template",
      sortable: true,
      cell: (template) => (
        <div>
          <p className="font-medium">{template.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{template.key}</p>
        </div>
      ),
    },
    { key: "description", header: "Description", cell: (template) => <span className="line-clamp-2 text-sm text-muted-foreground">{template.description || "No description"}</span> },
    { key: "defaultPriority", header: "Priority", cell: (template) => <StatusBadge tone="info">{template.defaultPriority}</StatusBadge> },
    { key: "status", header: "Status", cell: (template) => <StatusBadge tone={template.status === "active" ? "success" : "neutral"}>{template.status}</StatusBadge> },
  ], []);
  const actions: DataTableAction<TaskTemplateRecord>[] = useMemo(() => [
    { label: "Edit template", icon: Pencil, onClick: openEdit },
    {
      label: "Archive template",
      icon: Archive,
      hidden: (template) => template.status === "archived",
      onClick: (template) => void templates.archiveTemplate(template.id, template.version, organizationScope),
    },
    {
      label: "Restore template",
      icon: ArchiveRestore,
      hidden: (template) => template.status !== "archived",
      onClick: (template) => void templates.archiveTemplate(template.id, template.version, organizationScope),
    },
  ], [templates, organizationScope]);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Task templates"
        description="Organization-wide defaults for CRM follow-up work."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Task templates" }]}
        actions={<Button ref={triggerRef} onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" />New template</Button>}
      />
      <DataCard className="mt-6" flush>
        <DataTable
          data={templates.templates}
          columns={columns}
          rowActions={actions}
          onRowClick={openEdit}
          loading={templates.loading}
          emptyIcon={FileText}
          emptyTitle="No task templates"
          emptyDescription="Create organization defaults to speed up task creation."
          toolbar={<p className="text-sm text-muted-foreground">{templates.templates.filter((template) => template.status === "active").length} active templates</p>}
          initialSort={{ key: "name", dir: "asc" }}
        />
      </DataCard>
      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? "Edit task template" : "New task template"}
        description="These defaults are available to everyone in the organization."
        size="md"
        restoreFocusRef={triggerRef}
        dirty={() => dirtyRef.current}
        confirmOnClose
        onDiscard={() => { dirtyRef.current = false; }}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" form="task-template-form">{editing ? "Save changes" : "Create template"}</Button>
          </div>
        }
      >
        <TemplateForm
          key={`${editing?.id ?? "new"}-${formKey}`}
          template={editing}
          formId="task-template-form"
          onDirtyChange={(dirty) => { dirtyRef.current = dirty; }}
          onSubmit={async (input) => {
            if (editing) {
              await templates.updateTemplate(editing.id, { ...input, expectedVersion: editing.version, scope: organizationScope });
            } else {
              await templates.createTemplate({ ...input, scope: { ...organizationScope, workspaceId: null } });
            }
            setDrawerOpen(false);
            templates.reload();
          }}
        />
      </AppDrawer>
    </PageContainer>
  );
}
