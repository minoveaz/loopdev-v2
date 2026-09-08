import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftCollectionsStore, type NftCollection } from "@/data";
import { formatCrypto } from "@/features/nft/shared";

export default function NftCollections() {
  const { trail } = useBreadcrumbs();
  const collections = useLocalStore(nftCollectionsStore) as readonly NftCollection[];
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? collections.filter((c) => c.name.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q)) : collections;
  }, [collections, search]);

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="NFT Market" title="Collections" description="All collections listed on Rivera Art."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Collections" }]} />
      <DataCard title="All collections" description={`${filtered.length} collections`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-64" />}>
        {filtered.length === 0 ? <EmptyState icon={Layers} title="No collections" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Collection</TableHead><TableHead>Creator</TableHead>
              <TableHead className="text-right">Items</TableHead><TableHead className="text-right">Floor</TableHead>
              <TableHead className="text-right">Volume</TableHead><TableHead className="text-right">Owners</TableHead>
              <TableHead className="text-right">24h</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="flex items-center gap-3"><img src={c.coverUrl} alt="" className="h-10 w-14 rounded-lg object-cover" /><span className="font-medium">{c.name}</span></div></TableCell>
                  <TableCell className="text-muted-foreground">{c.creator}</TableCell>
                  <TableCell className="text-right font-mono">{c.items}</TableCell>
                  <TableCell className="text-right font-mono">{formatCrypto(c.floorPrice, "ETH")}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCrypto(c.volume, "ETH")}</TableCell>
                  <TableCell className="text-right font-mono">{c.owners}</TableCell>
                  <TableCell className="text-right"><StatusBadge tone={c.change24h >= 0 ? "success" : "destructive"}>{c.change24h >= 0 ? "+" : ""}{c.change24h}%</StatusBadge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </PageContainer>
  );
}