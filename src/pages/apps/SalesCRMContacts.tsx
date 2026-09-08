import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import {
  DataCard,
  FilterDropdown,
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
import { useLocalStore } from "@/lib/localStore";
import { customersStore } from "@/data";
import { formatDate, getInitials } from "@/lib/formatters";
import type { Customer, CustomerTier } from "@/types";

const tierOptions = [
  { label: "Lead", value: "lead" },
  { label: "Standard", value: "standard" },
  { label: "VIP", value: "vip" },
  { label: "Wholesale", value: "wholesale" },
];

const tierTone: Record<CustomerTier, "info" | "neutral" | "gold" | "success"> = {
  lead: "info",
  standard: "neutral",
  vip: "gold",
  wholesale: "success",
};

export default function SalesCRMContacts() {
  const { trail } = useBreadcrumbs();
  const customers = useLocalStore(customersStore);
  const [search, setSearch] = useState("");
  const [tiers, setTiers] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        [customer.name, customer.email, customer.phone, customer.city, customer.country]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      const matchesTier = !tiers.length || tiers.includes(customer.tier);
      return matchesSearch && matchesTier;
    });
  }, [customers, search, tiers]);

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
          label="Lifecycle"
          multiple
          value={tiers}
          onChange={setTiers}
          options={tierOptions}
          size="sm"
          align="end"
        />
      </div>

      <DataCard flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last order</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{customer.phone}</TableCell>
                <TableCell>
                  <StatusBadge tone={tierTone[customer.tier]}>
                    {customer.tier}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.city}, {customer.country}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.lastOrderAt)}
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Contact actions</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </PageContainer>
  );
}
