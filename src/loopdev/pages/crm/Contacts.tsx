import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Plus, RefreshCw, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { contactName } from "@/loopdev/domains/crm/adapter";
import {
  DataCard,
  FilterDropdown,
  PageContainer,
  PageHeader,
  SearchInput,
  StatusBadge,
  TablePagination,
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

const identityOptions = [
  { label: "Verified", value: "verified" },
  { label: "Pending review", value: "pending_identity_review" },
];

const channelOptions = [
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "WhatsApp", value: "whatsapp" },
];

type SortKey = "name" | "company" | "channel" | "identity" | "location" | "updated";

export default function SalesCRMContacts() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const { contacts, loading, error, reload } = useCrmContacts();
  const [search, setSearch] = useState("");
  const [identityStatuses, setIdentityStatuses] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contacts.filter((customer) => {
      const matchesSearch =
        !query ||
        [
          contactName(customer),
          customer.email,
          customer.phone,
          customer.companyName,
          customer.jobTitle,
          customer.city,
          customer.country,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesIdentity = !identityStatuses.length || identityStatuses.includes(customer.identityStatus);
      const matchesChannel = !channels.length || (customer.preferredChannel && channels.includes(customer.preferredChannel));
      return matchesSearch && matchesIdentity && matchesChannel;
    });
  }, [contacts, search, identityStatuses, channels]);

  const sorted = useMemo(() => {
    const valueFor = (contact: (typeof contacts)[number]) => {
      const values = {
        name: contactName(contact),
        company: `${contact.companyName ?? ""} ${contact.jobTitle ?? ""}`,
        channel: contact.preferredChannel ?? "",
        identity: contact.identityStatus,
        location: `${contact.city ?? ""} ${contact.stateProvince ?? ""} ${contact.country ?? ""}`,
        updated: contact.updatedAt,
      };
      return values[sortKey].toLowerCase();
    };

    return [...filtered].sort((a, b) => {
      const result = valueFor(a).localeCompare(valueFor(b), undefined, { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [filtered, sortDirection, sortKey, contacts]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visibleContacts = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, identityStatuses, channels, sortKey, sortDirection, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Contacts"
        description="Manage people and customer relationships across CRM."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }]}
        actions={
          <Button className="gap-1.5">
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
        <FilterDropdown
          label="Identity"
          multiple
          value={identityStatuses}
          onChange={setIdentityStatuses}
          options={identityOptions}
          size="sm"
          align="end"
        />
        <FilterDropdown
          label="Channel"
          multiple
          value={channels}
          onChange={setChannels}
          options={channelOptions}
          size="sm"
          align="end"
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
        empty={!loading && !error && sorted.length === 0}
        emptyIcon={search || identityStatuses.length || channels.length ? SearchX : AlertTriangle}
        emptyTitle={search || identityStatuses.length || channels.length ? "No contacts found" : "No contacts yet"}
        emptyDescription={search || identityStatuses.length || channels.length ? "Try changing the search or filters." : "Contacts will appear here when they are added to your workspace."}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Contact" icon={sortIcon("name")} onClick={() => toggleSort("name")} />
              <SortableHead label="Company / role" icon={sortIcon("company")} onClick={() => toggleSort("company")} />
              <SortableHead label="Channel" icon={sortIcon("channel")} onClick={() => toggleSort("channel")} />
              <SortableHead label="Identity" icon={sortIcon("identity")} onClick={() => toggleSort("identity")} />
              <SortableHead label="Location" icon={sortIcon("location")} onClick={() => toggleSort("location")} />
              <SortableHead label="Updated" icon={sortIcon("updated")} onClick={() => toggleSort("updated")} />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleContacts.map((customer) => (
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Contact actions</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataCard>
    </PageContainer>
  );
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
