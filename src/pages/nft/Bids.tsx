import { useMemo, useState } from "react";
import { Gavel } from "lucide-react";
import { toast } from "sonner";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftBidsStore, type NftBid } from "@/data";
import { bidStatusTone, formatCrypto } from "@/features/nft/shared";
import { formatDateTime, formatNumber } from "@/lib/formatters";

export default function NftBids() {
  const { trail } = useBreadcrumbs();
  const bids = useLocalStore(nftBidsStore) as readonly NftBid[];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bids.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (!q) return true;
      return b.assetName.toLowerCase().includes(q) || b.bidder.toLowerCase().includes(q) || b.collection.toLowerCase().includes(q);
    });
  }, [bids, search, status]);

  const active = bids.filter((b) => b.status === "active").length;
  const totalEth = bids.filter((b) => b.currency === "ETH").reduce((s, b) => s + b.amount, 0);

  const act = (id: string, next: NftBid["status"]) => {
    nftBidsStore.update(id, { status: next });
    toast.success(`Bid ${next}`);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="NFT Market"
        title="Bids"
        description="Review and manage offers placed on marketplace assets."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Marketplace" }, { label: "Bids" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total bids" value={formatNumber(bids.length)} icon={Gavel} accent="primary" />
        <StatCard label="Active" value={formatNumber(active)} icon={Gavel} accent="info" />
        <StatCard label="Pending value" value={`${totalEth.toFixed(2)} ETH`} icon={Gavel} accent="gold" />
      </div>

      <DataCard title="All bids" description={`${filtered.length} of ${bids.length}`} flush
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search asset or bidder…" containerClassName="w-64" />
            <FilterDropdown
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as string)}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
                { value: "expired", label: "Expired" },
              ]}
            />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Gavel} title="No bids match" description="Adjust your filters or search." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Bidder</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="font-medium">{b.assetName}</p>
                    <p className="text-xs text-muted-foreground">{b.collection}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.bidder}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCrypto(b.amount, b.currency)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(b.createdAt)}</TableCell>
                  <TableCell><StatusBadge tone={bidStatusTone[b.status]}>{b.status}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    {b.status === "active" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => act(b.id, "rejected")}>Reject</Button>
                        <Button size="sm" onClick={() => act(b.id, "accepted")}>Accept</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </PageContainer>
  );
}