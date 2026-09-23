import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Archive, AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CheckSquare, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, RefreshCw, SearchX, StickyNote, Trash2 } from "lucide-react";
import { contactActions } from "../../../../packages/contracts/src/contact-actions";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { loopdevAdapter, contactName, type CRMContact, type CRMCreateContactInput, type CRMUpdateContactPatch } from "@/loopdev/domains/crm/adapter";
import {
  DataCard,
  BulkSelectionBar,
  FilterDropdown,
  PageContainer,
  PageHeader,
  SearchInput,
  StatusBadge,
  ConfirmDialog,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatDate, getInitials } from "@/lib/formatters";
import { useCrmContacts } from "@/loopdev/domains/crm/hooks/use-crm";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { referenceDataAdapter } from "@/loopdev/domains/reference-data";
import { ContactFormDrawer } from "@/loopdev/components/crm/contacts/ContactFormDrawer";
import type { ContactFormValues } from "@/loopdev/components/crm/contacts/ContactForm";
import { ContactMobileCard } from "@/loopdev/components/crm/contacts/ContactMobileCard";
import { DuplicateReviewPanel } from "@/loopdev/components/crm/contacts/DuplicateReviewPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CONTACT_PAGE_SIZE = 10;
type ContactSortKey = "name" | "company" | "channel" | "identity" | "location" | "updated";

export default function SalesCRMContacts() {
  const { activeOrganization } = useTenantContext();
  const isVitest = Boolean(
    (typeof process !== "undefined" && (process.env?.VITEST || process.env?.NODE_ENV === "test")) ||
    (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test")
  );
  const currentOrgId = activeOrganization?.id || (!isVitest ? "80fce911-57c5-4a83-809f-78df6a3736f7" : "local-development-organization");
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [initialContactValues, setInitialContactValues] = useState<Partial<ContactFormValues> | undefined>();
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CRMContact | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<CRMContact | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const query = searchParams.get("q") ?? "";
  const cursor = searchParams.get("cursor");
  const requestedPageSize = Number(searchParams.get("limit") ?? CONTACT_PAGE_SIZE);
  const pageSize = [10, 20, 50].includes(requestedPageSize) ? requestedPageSize : CONTACT_PAGE_SIZE;
  const identityStatuses = useMemo(() => searchParams.getAll("identity"), [searchParams]);
  const channels = useMemo(() => searchParams.getAll("channel"), [searchParams]);
  const sortBy = (searchParams.get("sort") ?? "updated") as ContactSortKey;
  const sortDirection = (searchParams.get("direction") ?? "desc") as "asc" | "desc";
  const [search, setSearch] = useState(query);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const { contacts, nextCursor, hasMore, loading, error, reload } = useCrmContacts({
    organizationId: currentOrgId,
    query,
    cursor,
    limit: pageSize,
    identityStatus: identityStatuses as ("verified" | "pending_identity_review")[],
    preferredChannel: channels as ("email" | "phone" | "whatsapp")[],
    sortBy,
    sortDirection,
  });
  const [referenceLabels, setReferenceLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    const countries = [...new Set(contacts.map((contact) => contact.country).filter(Boolean))] as string[];
    const subdivisions = [...new Set(contacts.map((contact) => contact.stateProvince).filter(Boolean))] as string[];
    const cities = [...new Set(contacts.map((contact) => contact.city).filter(Boolean))] as string[];
    void Promise.all([
      referenceDataAdapter.listCountries(currentOrgId),
      ...countries.map((country) => referenceDataAdapter.listSubdivisions(country, currentOrgId)),
      ...countries.flatMap((country) => referenceDataAdapter.searchCities({ countryCode: country, query: "", organizationId: currentOrgId })),
    ]).then((catalogs) => {
      if (!active) return;
      const labels = Object.fromEntries(catalogs.flat().map((item) => [item.code, item.label]));
      cities.forEach((city) => { if (!labels[city]) labels[city] = city; });
      subdivisions.forEach((subdivision) => { if (!labels[subdivision]) labels[subdivision] = subdivision; });
      setReferenceLabels(labels);
    });
    return () => { active = false; };
  }, [contacts, currentOrgId]);

  useEffect(() => {
    const state = location.state as { documentFields?: Record<string, string | null> } | null;
    if (!state?.documentFields) return;
    const fields = state.documentFields;
    setInitialContactValues({
      firstName: fields.givenNames || fields.fullName?.split(/\s+/)[0] || "",
      lastName: fields.firstSurname || fields.surnames || "",
      secondLastName: fields.secondSurname || "",
      documentType: fields.documentType === "passport" ? "passport" : fields.documentType || "",
      documentNumber: fields.documentNumber || "",
      birthDate: fields.birthDate || "",
      gender: fields.sex === "M" ? "male" : fields.sex === "F" ? "female" : "",
      country: fields.issuingCountry === "COL" ? "CO" : fields.issuingCountry || "",
    });
    setEditingContact(null);
    setEditorOpen(true);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    setSelectedContactIds(new Set());
  }, [query, cursor, pageSize, sortBy, sortDirection]);

  const allOnPageSelected = contacts.length > 0 && contacts.every((c) => selectedContactIds.has(c.id));
  const someOnPageSelected = contacts.some((c) => selectedContactIds.has(c.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedContactIds(new Set());
    } else {
      const next = new Set(selectedContactIds);
      contacts.forEach((c) => next.add(c.id));
      setSelectedContactIds(next);
    }
  };

  const toggleSelectContact = (id: string) => {
    const next = new Set(selectedContactIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedContactIds(next);
  };

  const clearSelection = () => {
    setSelectedContactIds(new Set());
  };

  const executeBulkDelete = async () => {
    setBulkActionLoading(true);
    setActionError(null);
    try {
      const ids = Array.from(selectedContactIds);
      if (loopdevAdapter.crm.bulkArchiveContacts) {
        await loopdevAdapter.crm.bulkArchiveContacts(ids);
      } else {
        for (const id of ids) {
          const contact = contacts.find((c) => c.id === id);
          await loopdevAdapter.crm.archiveContact(id, contact?.updatedAt || "");
        }
      }
      clearSelection();
      setBulkConfirmOpen(false);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete selected contacts.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const openCreate = () => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingContact(null);
    setInitialContactValues(undefined);
    setEditorOpen(true);
  };

  const openEdit = (contact: CRMContact) => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditingContact(contact);
    setEditorOpen(true);
  };

  const submitContact = async (values: ContactFormValues) => {
    const optional = (value: string) => value.trim() || null;
    if (editingContact) {
      const patch: CRMUpdateContactPatch = {
        organizationId: currentOrgId,
        firstName: values.firstName.trim(),
        lastName: optional(values.lastName),
        secondLastName: optional(values.secondLastName),
        preferredName: optional(values.preferredName),
        documentType: optional(values.documentType),
        documentNumber: optional(values.documentNumber),
        birthDate: optional(values.birthDate),
        gender: optional(values.gender),
        email: values.email.trim() || null,
        secondaryEmail: optional(values.secondaryEmail),
        phone: values.phone.trim() || null,
        secondaryPhone: optional(values.secondaryPhone),
        preferredChannel: values.preferredChannel,
        preferredLanguage: optional(values.preferredLanguage),
        companyName: optional(values.companyName),
        jobTitle: optional(values.jobTitle),
        department: optional(values.department),
        addressLine1: optional(values.addressLine1),
        addressLine2: optional(values.addressLine2),
        city: optional(values.city),
        stateProvince: optional(values.stateProvince),
        postalCode: optional(values.postalCode),
        country: optional(values.country),
      };
      return loopdevAdapter.crm.updateContact(editingContact.id, patch, editingContact.updatedAt);
    }

    const input: CRMCreateContactInput = {
      organizationId: currentOrgId,
      firstName: values.firstName.trim(),
      lastName: optional(values.lastName),
      secondLastName: optional(values.secondLastName),
      preferredName: optional(values.preferredName),
      documentType: optional(values.documentType),
      documentNumber: optional(values.documentNumber),
      birthDate: optional(values.birthDate),
      gender: optional(values.gender),
      email: values.email.trim() || null,
      secondaryEmail: optional(values.secondaryEmail),
      phone: values.phone.trim() || null,
      secondaryPhone: optional(values.secondaryPhone),
      preferredChannel: values.preferredChannel,
      preferredLanguage: optional(values.preferredLanguage),
      companyName: optional(values.companyName),
      jobTitle: optional(values.jobTitle),
      department: optional(values.department),
      addressLine1: optional(values.addressLine1),
      addressLine2: optional(values.addressLine2),
      city: optional(values.city),
      stateProvince: optional(values.stateProvince),
      postalCode: optional(values.postalCode),
      country: optional(values.country),
    };
    return loopdevAdapter.crm.createContact(input);
  };

  const handleEditorSuccess = () => {
    setEditorOpen(false);
    setEditingContact(null);
    reload();
  };

  const archiveContact = async (contact: CRMContact) => {
    setActionError(null);
    setArchiveLoading(true);
    try {
      const result = await loopdevAdapter.crm.archiveContact(contact.id, contact.updatedAt);
      if (result.status === "success") {
        reload();
        setArchiveTarget(null);
        return;
      }
      setActionError(`${result.status === "forbidden" ? "Permission denied: " : result.status === "conflict" ? "Conflict: " : "Server error: "}${result.message}`);
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim() === query) return;
    const timeout = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (search.trim()) next.set("q", search.trim());
        else next.delete("q");
        next.delete("cursor");
        return next;
      });
      setCursorHistory([]);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query, search, setSearchParams]);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  const goToNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((history) => [...history, cursor ?? ""]);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("cursor", nextCursor);
      return next;
    });
  };

  const goToPreviousPage = () => {
    const previous = cursorHistory.at(-1);
    if (previous === undefined) return;
    setCursorHistory((history) => history.slice(0, -1));
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (previous) next.set("cursor", previous);
      else next.delete("cursor");
      return next;
    });
  };

  const changePageSize = (value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("limit", value);
      next.delete("cursor");
      return next;
    });
    setCursorHistory([]);
  };

  const updateListParam = (name: string, values: string[]) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete(name);
      values.forEach((value) => next.append(name, value));
      next.delete("cursor");
      return next;
    });
    setCursorHistory([]);
  };

  const toggleSort = (key: ContactSortKey) => {
    const nextDirection = sortBy === key && sortDirection === "asc" ? "desc" : "asc";
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sort", key);
      next.set("direction", nextDirection);
      next.delete("cursor");
      return next;
    });
    setCursorHistory([]);
  };

  const pageOffset = Number.isFinite(Number(cursor)) ? Number(cursor) : 0;

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Contacts"
        description="Manage people and customer relationships across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }]}
        actions={
        <div className="flex gap-2"><Button variant="outline" onClick={() => contacts[0] && setDuplicateTarget(contacts[0])}>Review duplicates</Button><Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New contact
        </Button></div>
        }
      />
      {duplicateTarget && <DuplicateReviewPanel contact={duplicateTarget} onClose={() => setDuplicateTarget(null)} />}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search contacts..."
          size="sm"
          containerClassName="w-64"
        />
        <FilterDropdown
          label="Identity"
          multiple
          value={identityStatuses}
          onChange={(values) => updateListParam("identity", values)}
          options={[
            { label: "Verified", value: "verified" },
            { label: "Pending review", value: "pending_identity_review" },
          ]}
          size="sm"
          align="end"
        />
        <FilterDropdown
          label="Channel"
          multiple
          value={channels}
          onChange={(values) => updateListParam("channel", values)}
          options={[
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
            { label: "WhatsApp", value: "whatsapp" },
          ]}
          size="sm"
          align="end"
        />
      </div>
      {actionError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <BulkSelectionBar
        selectedCount={selectedContactIds.size}
        entityLabel="contacts"
        onClear={clearSelection}
        actions={[{ label: "Archive selected", icon: Trash2, destructive: true, onClick: () => setBulkConfirmOpen(true) }]}
      />

      <DataCard
        flush
        loading={loading}
        error={error ? (
          <>
            <span>{error}</span>
            <Button className="mt-3" size="sm" variant="outline" onClick={reload}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again
            </Button>
          </>
        ) : undefined}
        empty={!loading && !error && contacts.length === 0}
        emptyIcon={search ? SearchX : AlertTriangle}
        emptyTitle={search ? "No contacts found" : "No contacts yet"}
        emptyDescription={search ? "Try changing the search." : "Contacts will appear here when they are added to your workspace."}
      >
        <div className="space-y-3 p-4 md:hidden">
          {contacts.map((customer, index) => (
            <ContactMobileCard
              key={customer.id}
              contact={customer}
              index={pageOffset + index + 1}
              selected={selectedContactIds.has(customer.id)}
              onToggleSelect={() => toggleSelectContact(customer.id)}
              onOpen={() => navigate(`/app/sales-crm/contacts/${customer.id}`)}
              onEdit={() => openEdit(customer)}
              onArchive={() => setArchiveTarget(customer)}
            />
          ))}
        </div>
        <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all contacts on current page"
                />
              </TableHead>
              <TableHead className="w-10 text-end">#</TableHead>
              <SortableHead label="Contact" icon={sortIcon(sortBy, "name", sortDirection)} onClick={() => toggleSort("name")} />
              <SortableHead label="Company / role" icon={sortIcon(sortBy, "company", sortDirection)} onClick={() => toggleSort("company")} />
              <SortableHead label="Channel" icon={sortIcon(sortBy, "channel", sortDirection)} onClick={() => toggleSort("channel")} />
              <SortableHead label="Identity" icon={sortIcon(sortBy, "identity", sortDirection)} onClick={() => toggleSort("identity")} />
              <SortableHead label="Location" icon={sortIcon(sortBy, "location", sortDirection)} onClick={() => toggleSort("location")} />
              <SortableHead label="Updated" icon={sortIcon(sortBy, "updated", sortDirection)} onClick={() => toggleSort("updated")} />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((customer, index) => {
              const isSelected = selectedContactIds.has(customer.id);
              return (
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer ${isSelected ? "bg-primary-soft/20" : ""}`}
                  tabIndex={0}
                  onClick={() => navigate(`/app/sales-crm/contacts/${customer.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/app/sales-crm/contacts/${customer.id}`);
                    }
                  }}
                >
                  <TableCell className="w-10 px-3" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectContact(customer.id)}
                      aria-label={`Select ${contactName(customer)}`}
                    />
                  </TableCell>
                  <TableCell className="text-end text-xs tabular-nums text-muted-foreground">{pageOffset + index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="text-[10px]">
                          {getInitials(contactName(customer))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{contactName(customer)}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.companyName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{customer.jobTitle || customer.department || "—"}</div>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">
                  {customer.preferredChannel || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={customer.identityStatus === "verified" ? "success" : "warning"}>
                    {customer.identityStatus === "verified" ? "Verified" : "Pending review"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[customer.city, customer.stateProvince, customer.country].map((code) => referenceLabels[code ?? ""] ?? code).filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.updatedAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label={`Actions for ${contactName(customer)}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/app/sales-crm/contacts/${customer.id}`)}>
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        {contactActions.find((action) => action.id === "view")?.label}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(customer)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        {contactActions.find((action) => action.id === "edit")?.label}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); navigate(`/app/sales-crm/contacts/${customer.id}?action=note`); }}>
                        <StickyNote className="mr-2 h-3.5 w-3.5" />
                        {contactActions.find((action) => action.id === "add-note")?.label}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => { event.stopPropagation(); navigate(`/app/sales-crm/contacts/${customer.id}?action=task&contactName=${encodeURIComponent(contactName(customer))}`); }}>
                        <CheckSquare className="mr-2 h-3.5 w-3.5" />
                        {contactActions.find((action) => action.id === "create-task")?.label}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setArchiveTarget(customer)}>
                        <Archive className="mr-2 h-3.5 w-3.5" />
                        {contactActions.find((action) => action.id === "archive")?.label}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
        </div>
        <nav aria-label="Contacts pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Page {cursorHistory.length + 1}</span>
            <label className="flex items-center gap-1.5" htmlFor="contacts-page-size">
              Rows
              <select
                id="contacts-page-size"
                aria-label="Contacts per page"
                value={String(pageSize)}
                onChange={(event) => changePageSize(event.target.value)}
                className="h-7 w-16 rounded-md border border-border bg-card px-2 text-xs"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 gap-1" disabled={!cursorHistory.length || loading} onClick={goToPreviousPage}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1" disabled={!hasMore || loading} onClick={goToNextPage}>
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </nav>
      </DataCard>
      <ContactFormDrawer
        open={editorOpen}
        contact={editingContact}
        initialValues={initialContactValues}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSubmit={submitContact}
        onSuccess={handleEditorSuccess}
        restoreFocusRef={restoreFocusRef}
      />
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => { if (!open && !archiveLoading) setArchiveTarget(null); }}
        title="Archive contact?"
        description={archiveTarget ? `${contactName(archiveTarget)} will be removed from the active contacts list.` : undefined}
        confirmLabel="Archive"
        tone="destructive"
        loading={archiveLoading}
        onConfirm={async () => {
          if (archiveTarget) await archiveContact(archiveTarget);
        }}
      />
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => { if (!open && !bulkActionLoading) setBulkConfirmOpen(false); }}
        title={`Delete or archive ${selectedContactIds.size} ${selectedContactIds.size === 1 ? "contact" : "contacts"}?`}
        description={`The selected ${selectedContactIds.size} contact(s) will be permanently deleted or archived from your CRM workspace.`}
        confirmLabel="Delete selected"
        tone="destructive"
        loading={bulkActionLoading}
        onConfirm={executeBulkDelete}
      />
    </PageContainer>
  );
}

function sortIcon(
  activeKey: ContactSortKey,
  key: ContactSortKey,
  direction: "asc" | "desc",
) {
  if (activeKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  return direction === "asc"
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />;
}

function SortableHead({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button type="button" className="inline-flex items-center gap-1.5 hover:text-foreground" onClick={onClick}>
        {label}
        {icon}
      </button>
    </TableHead>
  );
}
