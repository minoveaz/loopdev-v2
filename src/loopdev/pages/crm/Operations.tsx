import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Download, Plus, Search, Tags, Upload, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, SearchInput, StatusBadge, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useCrmOperations } from "@/loopdev/domains/crm/hooks/use-crm-operations";
import type { CRMEntityType, CRMFieldType, CRMFilter, CRMImportResult, CRMVisibility } from "@/loopdev/domains/crm/operations/types";

const visibilityOptions: Array<{ value: CRMVisibility; label: string }> = [
  { value: "private", label: "Only me" },
  { value: "workspace", label: "This workspace" },
  { value: "organization", label: "Entire organization" },
];

const entityLabels: Record<CRMEntityType, string> = { contact: "Contacts", lead: "Leads", opportunity: "Opportunities" };

export default function SalesCRMOperations() {
  const { trail } = useBreadcrumbs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [entityType, setEntityType] = useState<CRMEntityType>("contact");
  const [filterField, setFilterField] = useState("company");
  const [filterValue, setFilterValue] = useState("");
  const [filters, setFilters] = useState<CRMFilter[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#2563eb");
  const [tagVisibility, setTagVisibility] = useState<CRMVisibility>("workspace");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<CRMFieldType>("text");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldVisibility, setFieldVisibility] = useState<CRMVisibility>("workspace");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldValueEntityId, setFieldValueEntityId] = useState("");
  const [fieldValueDefinitionId, setFieldValueDefinitionId] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [viewName, setViewName] = useState("");
  const [importCsv, setImportCsv] = useState("");
  const [importResult, setImportResult] = useState<CRMImportResult>();
  const [importMode, setImportMode] = useState<"validate" | "commit">("validate");
  const {
    savedViews,
    tags,
    customFields,
    results,
    loading,
    error,
    search,
    createSavedView,
    deleteSavedView,
    createTag,
    createCustomField,
    bulkUpdateEntityTags,
    importContacts,
    exportCsv,
    setCustomFieldValue,
  } = useCrmOperations(entityType);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "tags" || tab === "fields" || tab === "import" || tab === "search") setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [query, searchParams, setSearchParams]);

  const selectedEntityIds = useMemo(
    () => results.filter((result) => result.entityType === entityType).map((result) => result.id),
    [entityType, results],
  );

  const runSearch = async () => {
    try {
      await search(query, filters, [entityType]);
      setNotice(null);
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Search is unavailable.");
    }
  };

  const addFilter = () => {
    if (!filterValue.trim()) return;
    setFilters((current) => [...current, { field: filterField, operator: "contains", value: filterValue.trim() }]);
    setFilterValue("");
  };

  const applySavedView = (id: string) => {
    const view = savedViews.find((item) => item.id === id);
    if (!view) return;
    setEntityType(view.entityType);
    setFilters(view.filters);
    void search(query, view.filters, [view.entityType]);
  };

  const submitTag = async (event: FormEvent) => {
    event.preventDefault();
    if (!tagName.trim()) return;
    try {
      await createTag({ name: tagName, color: tagColor, visibility: tagVisibility });
      setTagName("");
      setNotice("Reusable tag created.");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Tag could not be created.");
    }
  };

  const submitField = async (event: FormEvent) => {
    event.preventDefault();
    if (!fieldLabel.trim() || !fieldKey.trim()) return;
    try {
      await createCustomField({
        entityType,
        label: fieldLabel,
        key: fieldKey,
        type: fieldType,
        required: fieldRequired,
        visibility: fieldVisibility,
        options: fieldOptions.split(",").map((option) => option.trim()).filter(Boolean),
      });
      setFieldLabel("");
      setFieldKey("");
      setFieldOptions("");
      setNotice("Custom field definition created.");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Custom field could not be created.");
    }
  };

  const submitFieldValue = async (event: FormEvent) => {
    event.preventDefault();
    const definition = customFields.find((field) => field.id === fieldValueDefinitionId);
    if (!definition || !fieldValueEntityId.trim() || (!fieldValue.trim() && definition.required)) return;
    try {
      const value = definition.type === "number"
        ? Number(fieldValue)
        : definition.type === "boolean"
          ? fieldValue === "true"
          : fieldValue;
      await setCustomFieldValue({ entityId: fieldValueEntityId.trim(), definitionId: definition.id, value });
      setNotice(`Value saved for ${definition.label}.`);
      setFieldValue("");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Custom field value could not be saved.");
    }
  };

  const submitView = async (event: FormEvent) => {
    event.preventDefault();
    if (!viewName.trim()) return;
    try {
      await createSavedView({ name: viewName, entityType, filters, columns: ["name", "email", "company"], visibility: "workspace" });
      setViewName("");
      setNotice("Saved view created. Filters will be restored for your workspace.");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Saved view could not be created.");
    }
  };

  const handleImport = async () => {
    if (!importCsv.trim()) return;
    try {
      const result = await importContacts(importCsv, importMode);
      setImportResult(result);
      setNotice(importMode === "validate" ? "Validation complete. Review row results before committing." : "Import complete.");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Import could not be completed.");
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void file.text().then(setImportCsv);
  };

  const downloadExport = async () => {
    const csv = await exportCsv({ entityType: "contact", query, filters });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "crm-contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM operations"
        description="Reusable search, workspace views, governance, and local data operations."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Operations" }]}
        actions={<Button variant="outline" onClick={() => void downloadExport()}><Download className="mr-1.5 h-3.5 w-3.5" />Export contacts</Button>}
      />
      {notice && <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary-soft/30 px-3 py-2 text-sm">{notice}<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-3.5 w-3.5" /></Button></div>}
      {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 flex-wrap">
          <TabsTrigger value="search">Search & saved views</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="fields">Custom fields</TabsTrigger>
          <TabsTrigger value="import">Import / export</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-5">
          <SurfaceCard>
            <SurfaceCardHeader title="Reusable CRM search" description="Search authorized records across CRM entities and persist the filter set as a view." icon={Search} />
            <SurfaceCardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={query} onValueChange={setQuery} onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }} placeholder="Search people, companies, leads..." containerClassName="w-full sm:w-80" />
                <Select value={entityType} onValueChange={(value) => setEntityType(value as CRMEntityType)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(entityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="company">Company</SelectItem><SelectItem value="status">Status</SelectItem><SelectItem value="owner">Owner</SelectItem><SelectItem value="city">City</SelectItem></SelectContent>
                </Select>
                <Input value={filterValue} onChange={(event) => setFilterValue(event.target.value)} placeholder="Filter value" className="w-36" onKeyDown={(event) => { if (event.key === "Enter") addFilter(); }} />
                <Button variant="outline" onClick={addFilter}>Add filter</Button>
                <Button onClick={() => void runSearch()}><Search className="mr-1.5 h-3.5 w-3.5" />Search</Button>
              </div>
              {filters.length > 0 && <div className="flex flex-wrap gap-2">{filters.map((filter, index) => <button key={`${filter.field}-${index}`} type="button" className="rounded-full bg-muted px-2.5 py-1 text-xs" onClick={() => setFilters((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{filter.field} contains “{filter.value}” ×</button>)}</div>}
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <Select onValueChange={applySavedView}>
                  <SelectTrigger className="w-52"><SelectValue placeholder="Open saved view" /></SelectTrigger>
                  <SelectContent>{savedViews.map((view) => <SelectItem key={view.id} value={view.id}>{view.name} · {entityLabels[view.entityType]}</SelectItem>)}</SelectContent>
                </Select>
                <form onSubmit={submitView} className="flex items-center gap-2"><Input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Name current view" className="w-44" /><Button type="submit" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" />Save view</Button></form>
                {savedViews.filter((view) => view.ownerId === "local-development-user").map((view) => <Button key={view.id} variant="ghost" size="sm" onClick={() => void deleteSavedView(view.id)}>Remove {view.name}</Button>)}
              </div>
            </SurfaceCardBody>
          </SurfaceCard>
          <SurfaceCard>
            <SurfaceCardHeader title={`${results.length} authorized results`} description={loading ? "Loading CRM operations..." : "Results are constrained to the active organization and workspace."} />
            <SurfaceCardBody className="p-0">
              {results.length === 0 ? <div className="p-6 text-sm text-muted-foreground">Run a search to see matching records.</div> : <div className="divide-y divide-border">{results.map((result) => <div key={`${result.entityType}-${result.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"><div><p className="font-medium">{result.title}</p><p className="text-xs text-muted-foreground">{result.subtitle} · {entityLabels[result.entityType]}</p></div>{result.tags.length > 0 && <div className="flex gap-1">{result.tags.map((tag) => <StatusBadge key={tag.id} tone="info">{tag.name}</StatusBadge>)}</div>}</div>)}</div>}
              {selectedEntityIds.length > 0 && tags.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card-muted/50 px-5 py-3"><Tags className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Apply to {selectedEntityIds.length} results:</span><Select value={selectedTag} onValueChange={setSelectedTag}><SelectTrigger className="w-44"><SelectValue placeholder="Choose tag" /></SelectTrigger><SelectContent>{tags.map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>)}</SelectContent></Select><Button size="sm" onClick={() => selectedTag && void bulkUpdateEntityTags(selectedEntityIds, selectedTag, "add")}>Apply tag</Button></div>}
            </SurfaceCardBody>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="tags">
          <SurfaceCard>
            <SurfaceCardHeader title="Reusable tags" description="Tags are scoped to this organization and workspace, with explicit visibility." icon={Tags} />
            <SurfaceCardBody className="space-y-5">
              <form onSubmit={submitTag} className="grid gap-3 sm:grid-cols-[1fr_120px_190px_auto] sm:items-end">
                <div><Label htmlFor="tag-name">Name</Label><Input id="tag-name" value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="e.g. Renewal risk" /></div>
                <div><Label htmlFor="tag-color">Color</Label><Input id="tag-color" type="color" value={tagColor} onChange={(event) => setTagColor(event.target.value)} className="h-9 p-1" /></div>
                <div><Label>Visibility</Label><Select value={tagVisibility} onValueChange={(value) => setTagVisibility(value as CRMVisibility)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{visibilityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                <Button type="submit"><Plus className="mr-1.5 h-3.5 w-3.5" />Create tag</Button>
              </form>
              <div className="grid gap-3 md:grid-cols-2">{tags.map((tag) => <div key={tag.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} /><span className="font-medium">{tag.name}</span></div><span className="text-xs text-muted-foreground">{visibilityOptions.find((option) => option.value === tag.visibility)?.label}</span></div>)}</div>
            </SurfaceCardBody>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="fields">
          <SurfaceCard>
            <SurfaceCardHeader title="Custom field definitions" description="Define typed, visible, and required fields without coupling the page to persistence." />
            <SurfaceCardBody className="space-y-5">
              <form onSubmit={submitField} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div><Label htmlFor="field-label">Label</Label><Input id="field-label" value={fieldLabel} onChange={(event) => setFieldLabel(event.target.value)} placeholder="Customer segment" /></div>
                <div><Label htmlFor="field-key">Key</Label><Input id="field-key" value={fieldKey} onChange={(event) => setFieldKey(event.target.value.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase())} placeholder="customer_segment" /></div>
                <div><Label>Type</Label><Select value={fieldType} onValueChange={(value) => setFieldType(value as CRMFieldType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["text", "number", "date", "boolean", "select"] as CRMFieldType[]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Visibility</Label><Select value={fieldVisibility} onValueChange={(value) => setFieldVisibility(value as CRMVisibility)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{visibilityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="md:col-span-2"><Label htmlFor="field-options">Options (comma separated, for select)</Label><Input id="field-options" value={fieldOptions} onChange={(event) => setFieldOptions(event.target.value)} placeholder="Standard, Strategic, Enterprise" /></div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm"><Checkbox checked={fieldRequired} onCheckedChange={(checked) => setFieldRequired(checked === true)} /> Required</label>
                <Button type="submit" className="self-end"><Plus className="mr-1.5 h-3.5 w-3.5" />Create field</Button>
              </form>
              <div className="divide-y divide-border rounded-lg border border-border">{customFields.map((field) => <div key={field.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium">{field.label} <span className="font-mono text-xs text-muted-foreground">{field.key}</span></p><p className="text-xs text-muted-foreground">{entityLabels[field.entityType]} · {field.type} · {field.required ? "Required" : "Optional"}</p></div><StatusBadge tone={field.visibility === "organization" ? "success" : "info"}>{field.visibility}</StatusBadge></div>)}</div>
              <div className="rounded-lg border border-border bg-card-muted/30 p-4">
                <h3 className="mb-3 text-sm font-semibold">Set a field value</h3>
                <form onSubmit={submitFieldValue} className="grid gap-3 md:grid-cols-[1fr_220px_1fr_auto] md:items-end">
                  <div><Label htmlFor="field-entity-id">Entity ID</Label><Input id="field-entity-id" value={fieldValueEntityId} onChange={(event) => setFieldValueEntityId(event.target.value)} placeholder="crm_cust_1" /></div>
                  <div><Label>Field</Label><Select value={fieldValueDefinitionId} onValueChange={setFieldValueDefinitionId}><SelectTrigger><SelectValue placeholder="Choose field" /></SelectTrigger><SelectContent>{customFields.map((field) => <SelectItem key={field.id} value={field.id}>{field.label}{field.required ? " · required" : ""}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="field-value">Value</Label><Input id="field-value" value={fieldValue} onChange={(event) => setFieldValue(event.target.value)} placeholder="Value for this record" /></div>
                  <Button type="submit">Save value</Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">Values are scoped to the selected entity and validated against the field definition contract.</p>
              </div>
            </SurfaceCardBody>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="import">
          <SurfaceCard>
            <SurfaceCardHeader title="Local CSV import" description="Validate, deduplicate, and commit rows through the CRM adapter contract. Nothing is written during validation." icon={Upload} />
            <SurfaceCardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2"><Input type="file" accept=".csv,text/csv" onChange={handleFile} className="max-w-xs" /><Select value={importMode} onValueChange={(value) => setImportMode(value as "validate" | "commit")}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="validate">Validate only</SelectItem><SelectItem value="commit">Validate & import</SelectItem></SelectContent></Select><Button onClick={() => void handleImport()} disabled={!importCsv.trim()}><Upload className="mr-1.5 h-3.5 w-3.5" />Run import</Button></div>
              <Textarea value={importCsv} onChange={(event) => setImportCsv(event.target.value)} placeholder={"name,email,phone,company,city,country\nAlex Rivera,alex@example.com,+1 555 0100,Acme,New York,USA"} rows={8} />
              {importResult && <div className="space-y-3"><div className="flex flex-wrap gap-2 text-sm"><StatusBadge tone="success">{importResult.importedRows} imported</StatusBadge><StatusBadge tone="warning">{importResult.duplicateRows} duplicates</StatusBadge><StatusBadge tone="destructive">{importResult.invalidRows} invalid</StatusBadge></div><div className="max-h-72 overflow-auto rounded-lg border border-border"><table className="w-full text-sm"><thead className="bg-card-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Message</th></tr></thead><tbody className="divide-y divide-border">{importResult.results.map((row) => <tr key={row.rowNumber}><td className="px-3 py-2">{row.rowNumber}</td><td className="px-3 py-2">{row.status}</td><td className="px-3 py-2 text-muted-foreground">{row.message}</td></tr>)}</tbody></table></div></div>}
            </SurfaceCardBody>
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
