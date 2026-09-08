import { useMemo, useState } from "react";
import { Megaphone, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, DataTable, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge, type DataTableColumn } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { campaignsStore } from "@/data";
import { CHANNELS, ctr, cvr, roas, statusLabel, statusTone } from "@/features/marketing/shared";
import type { Campaign, CampaignStatus } from "@/types";

export default function MarketingCampaigns() {
  const { trail } = useBreadcrumbs();
  const campaigns = useLocalStore(campaignsStore);
  const loading = useSimulatedLoad();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<Campaign | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (channel.length && !channel.includes(c.channel)) return false;
      if (status.length && !status.includes(c.status)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [campaigns, search, channel, status]);

  const columns: DataTableColumn<Campaign>[] = [
    { key: "name", header: "Campaign", sortable: true, cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: "channel", header: "Channel", sortable: true, cell: (c) => <span className="capitalize text-muted-foreground">{c.channel}</span>, hideOnMobile: true },
    { key: "spent", header: "Spent / Budget", sortable: true, align: "right",
      cell: (c) => <span className="font-mono text-xs">${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}</span>, hideOnMobile: true },
    { key: "impressions", header: "Impr.", sortable: true, align: "right", cell: (c) => <span className="font-mono">{c.impressions.toLocaleString()}</span>, hideOnMobile: true },
    { key: "ctr", header: "CTR", sortable: true, align: "right", cell: (c) => <span className="font-mono">{ctr(c)}%</span>, sortAccessor: ctr, hideOnMobile: true },
    { key: "roas", header: "ROAS", sortable: true, align: "right", cell: (c) => <span className="font-mono">{roas(c)}x</span>, sortAccessor: roas, hideOnMobile: true },
    { key: "status", header: "Status", sortable: true, cell: (c) => <StatusBadge tone={statusTone[c.status]}>{statusLabel[c.status]}</StatusBadge> },
  ];

  const setStatusOf = (c: Campaign, s: CampaignStatus) => {
    campaignsStore.update(c.id, { status: s });
    toast.success(`Campaign ${s}`);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Marketing" title="Campaigns" description="All campaigns and their live performance."
        breadcrumbs={trail.length ? trail : [{ label: "Marketing" }, { label: "Campaigns" }]}
      />

      <DataCard flush>
        <DataTable<Campaign>
          data={filtered}
          columns={columns}
          loading={loading}
          emptyIcon={Megaphone}
          emptyTitle="No campaigns match"
          initialSort={{ key: "name", dir: "asc" }}
          rowActions={[
            { label: "Pause", icon: Pause, onClick: (c) => setStatusOf(c, "paused"), hidden: (c) => c.status === "paused" },
            { label: "Resume", icon: Play, onClick: (c) => setStatusOf(c, "running"), hidden: (c) => c.status === "running" },
            { label: "Delete", icon: Trash2, destructive: true, separator: true, onClick: setDeleting },
          ]}
          bulkActions={[
            { label: "Pause selected", icon: Pause, onClick: (rows) => { rows.forEach((r) => campaignsStore.update(r.id, { status: "paused" })); toast.success(`${rows.length} paused`); } },
            { label: "Delete", icon: Trash2, destructive: true, onClick: (rows) => { rows.forEach((r) => campaignsStore.remove(r.id)); } },
          ]}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search campaigns…" containerClassName="w-64" size="sm" />
              <FilterDropdown label="Channel" multiple value={channel} onChange={setChannel} size="sm" align="end"
                options={CHANNELS.map((c) => ({ value: c, label: c }))} />
              <FilterDropdown label="Status" multiple value={status} onChange={setStatus} size="sm" align="end"
                options={(["draft","scheduled","running","paused","completed"] as CampaignStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))} />
            </div>
          }
        />
      </DataCard>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete ${deleting.name}?` : "Delete?"} confirmLabel="Delete" tone="destructive"
        onConfirm={() => { if (deleting) { campaignsStore.remove(deleting.id); setDeleting(null); } }}
      />
    </PageContainer>
  );
}
