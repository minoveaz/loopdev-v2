import { useMemo, useState } from "react";
import { BadgeCheck, Users } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatCard } from "@/components/common";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { nftCreatorsStore, type NftCreator } from "@/data";
import { formatCrypto } from "@/features/nft/shared";
import { formatNumber } from "@/lib/formatters";

export default function NftCreators() {
  const { trail } = useBreadcrumbs();
  const creators = useLocalStore(nftCreatorsStore) as readonly NftCreator[];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? creators.filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)) : creators;
  }, [creators, search]);

  const totalVolume = creators.reduce((s, c) => s + c.volume, 0);
  const verified = creators.filter((c) => c.verified).length;

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="NFT Market" title="Creators" description="Discover artists and studios building on Rivera Art."
        breadcrumbs={trail.length ? trail : [{ label: "NFT Market" }, { label: "Creators" }]} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total creators" value={formatNumber(creators.length)} icon={Users} accent="primary" />
        <StatCard label="Verified" value={formatNumber(verified)} icon={BadgeCheck} accent="info" />
        <StatCard label="Combined volume" value={`${totalVolume.toFixed(1)} ETH`} icon={Users} accent="gold" />
      </div>

      <DataCard title="Directory" description={`${filtered.length} creators`}
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search creators…" containerClassName="w-64" />}>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No creators found" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <article key={c.id} className="surface-card-interactive p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarImage src={c.avatarUrl} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate font-semibold">{c.name}{c.verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
                    <p className="truncate text-xs text-muted-foreground">@{c.handle}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Items</dt><dd className="font-mono text-sm font-semibold">{c.items}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</dt><dd className="font-mono text-sm font-semibold">{formatNumber(c.followers, { compact: true })}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</dt><dd className="font-mono text-sm font-semibold">{formatCrypto(c.volume, "ETH")}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </DataCard>
    </PageContainer>
  );
}