import { useMemo, useState } from "react";
import { Heart, Eye, ImageIcon } from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftStore } from "@/data";
import { formatCrypto, nftStatusTone } from "@/features/nft/shared";
import type { NftAsset } from "@/types";

export default function NftAssets() {
  const { trail } = useBreadcrumbs();
  const assets = useLocalStore(nftStore) as readonly NftAsset[];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [collection, setCollection] = useState("all");

  const collections = useMemo(() => Array.from(new Set(assets.map((a) => a.collection))), [assets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (collection !== "all" && a.collection !== collection) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.creator.toLowerCase().includes(q);
    });
  }, [assets, search, status, collection]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="NFT Market"
        title="Assets"
        description="Browse all minted assets across collections and creators."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Assets" }]}
      />

      <DataCard
        title="Explore"
        description={`${filtered.length} of ${assets.length} assets`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search…" containerClassName="w-56" />
            <FilterDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "listed", label: "Listed" },
                { value: "auction", label: "Auction" },
                { value: "sold", label: "Sold" },
                { value: "draft", label: "Draft" },
              ]}
            />
            <FilterDropdown
              label="Collection"
              value={collection}
              onChange={setCollection}
              options={[{ value: "all", label: "All" }, ...collections.map((c) => ({ value: c, label: c }))]}
            />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No assets found" description="Try clearing filters or search." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <article key={a.id} className="group overflow-hidden surface-card-interactive">
                <div className="relative aspect-square overflow-hidden">
                  <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover transition-smooth group-hover:scale-[1.03]" />
                  <div className="absolute left-3 top-3"><StatusBadge tone={nftStatusTone[a.status]}>{a.status}</StatusBadge></div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">by {a.creator}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold">{formatCrypto(a.price, a.currency)}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {a.likes}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {a.views}</span>
                    {a.highestBid !== undefined && <span className="font-mono text-foreground">Bid {a.highestBid}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DataCard>
    </PageContainer>
  );
}