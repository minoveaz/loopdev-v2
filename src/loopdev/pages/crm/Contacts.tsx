import { useEffect, useState } from "react";
import { Archive, AlertTriangle, CheckSquare, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, RefreshCw, SearchX, StickyNote } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loopdevAdapter, contactName, type CRMContact, type CRMCreateContactInput, type CRMUpdateContactPatch } from "@/loopdev/domains/crm/adapter";
import {
  DataCard,
  PageContainer,
  PageHeader,
  SearchInput,
  StatusBadge,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { ContactFormDrawer } from "@/loopdev/components/crm/contacts/ContactFormDrawer";
import type { ContactFormValues } from "@/loopdev/components/crm/contacts/ContactForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CONTACT_PAGE_SIZE = 10;

export default function SalesCRMContacts() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
  const query = searchParams.get("q") ?? "";
  const cursor = searchParams.get("cursor");
  const [search, setSearch] = useState(query);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const { contacts, nextCursor, hasMore, loading, error, reload } = useCrmContacts({
    query,
    cursor,
    limit: CONTACT_PAGE_SIZE,
  });

  const openCreate = () => {
    setEditingContact(null);
    setEditorOpen(true);
  };

  const openEdit = (contact: CRMContact) => {
    setEditingContact(contact);
    setEditorOpen(true);
  };

  const submitContact = async (values: ContactFormValues) => {
    const optional = (value: string) => value.trim() || null;
    if (editingContact) {
      const patch: CRMUpdateContactPatch = {
        organizationId: "local-development-organization",
        firstName: values.firstName.trim(),
        lastName: optional(values.lastName),
        secondLastName: optional(values.secondLastName),
        preferredName: optional(values.preferredName),
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
      organizationId: "local-development-organization",
      firstName: values.firstName.trim(),
      lastName: optional(values.lastName),
      secondLastName: optional(values.secondLastName),
      preferredName: optional(values.preferredName),
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

  useEffect(() => {
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
  }, [search, setSearchParams]);

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

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Contacts"
        description="Manage people and customer relationships across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }]}
        actions={
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New contact
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search contacts..."
          size="sm"
          containerClassName="w-64"
        />
      </div>

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Company / role</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Identity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => navigate(`/app/sales-crm/contacts/${customer.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/app/sales-crm/contacts/${customer.id}`);
                  }
                }}
              >
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
                  {[customer.city, customer.stateProvince, customer.country].filter(Boolean).join(", ") || "—"}
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
                        View Customer 360
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(customer)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit contact
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <StickyNote className="mr-2 h-3.5 w-3.5" />
                        Add note
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <CheckSquare className="mr-2 h-3.5 w-3.5" />
                        Create task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                        <Archive className="mr-2 h-3.5 w-3.5" />
                        Archive contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <nav aria-label="Contacts pagination" className="flex items-center justify-between border-t border-border bg-card-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Cursor page</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!cursorHistory.length || loading} onClick={goToPreviousPage} aria-label="Previous contacts page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasMore || loading} onClick={goToNextPage} aria-label="Next contacts page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </DataCard>
      <ContactFormDrawer
        open={editorOpen}
        contact={editingContact}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingContact(null);
        }}
        onSubmit={submitContact}
        onSuccess={handleEditorSuccess}
      />
    </PageContainer>
  );
}
