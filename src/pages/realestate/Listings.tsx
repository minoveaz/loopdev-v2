import { useMemo, useState } from "react";
import { Bath, BedDouble, LayoutGrid, List, Maximize2, MapPin } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { listingsStore, agentsStore } from "@/data";
import { formatPrice, listingStatusLabel, listingStatusTone, PROPERTY_TYPES } from "@/features/realestate/shared";

export default function RealEstateListings() {
  const { trail } = useBreadcrumbs();
  const listings = useLocalStore(listingsStore);
  const agents = useLocalStore(agentsStore);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (status !== "all" && l.status !== status) return false;
      if (!q) return true;
      return l.title.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.address.toLowerCase().includes(q);
    });
  }, [listings, search, type, status]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Real Estate"
        title="Listings"
        description="Browse the full property catalog."
        breadcrumbs={trail.length ? trail : [{ label: "Real Estate" }, { label: "Listings" }]}
      />

      <DataCard
        title="Catalog"
        description={`${filtered.length} properties`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Title, city…" containerClassName="w-64" />
            <FilterDropdown label="Type" value={type} onChange={setType}
              options={[{ value: "all", label: "All" }, ...PROPERTY_TYPES.map((t) => ({ value: t, label: t }))]}
            />
            <FilterDropdown label="Status" value={status} onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "available", label: "Available" },
                { value: "pending", label: "Pending" },
                { value: "sold", label: "Sold" },
                { value: "rented", label: "Rented" },
                { value: "off_market", label: "Off market" },
              ]}
            />
            <div className="flex rounded-lg border border-border p-0.5">
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}><List className="h-4 w-4" /></Button>
            </div>
          </div>
        }
      >
        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l) => (
              <div key={l.id} className="overflow-hidden surface-card transition hover:shadow-soft">
                <div className="relative h-44">
                  <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3"><StatusBadge tone={listingStatusTone[l.status]}>{listingStatusLabel[l.status]}</StatusBadge></div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{l.title}</p>
                    <p className="font-mono text-sm font-semibold">{formatPrice(l.price, l.currency)}</p>
                  </div>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{l.address} · {l.city}</p>
                  <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{l.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{l.bathrooms}</span>
                    <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{l.areaSqm}m²</span>
                    <span className="ml-auto truncate">by {agentName(l.agentId)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Beds/Baths</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell className="text-muted-foreground">{l.city}</TableCell>
                  <TableCell className="capitalize">{l.type}</TableCell>
                  <TableCell className="text-right font-mono">{l.bedrooms}/{l.bathrooms}</TableCell>
                  <TableCell className="text-right font-mono">{l.areaSqm} m²</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(l.price, l.currency)}</TableCell>
                  <TableCell><StatusBadge tone={listingStatusTone[l.status]}>{listingStatusLabel[l.status]}</StatusBadge></TableCell>
                  <TableCell className="text-muted-foreground">{agentName(l.agentId)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </PageContainer>
  );
}