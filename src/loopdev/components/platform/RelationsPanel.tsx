import { Link } from "react-router-dom";
import { ArrowUpRight, Contact, HandCoins, UserRound } from "lucide-react";
import { DataCard } from "@/components/common";
import type { EntityRef } from "@/loopdev/domains/platform";

export function PlatformRelationsPanel({ references }: { references: Array<{ label: string; reference: EntityRef; href: string }> }) {
  return (
    <DataCard title="CRM relations" description="Platform records use EntityRef instead of importing CRM stores">
      <ul className="grid gap-2 sm:grid-cols-3" aria-label="Related CRM entities">
        {references.map(({ label, reference, href }) => {
          const Icon = reference.entityType === "contact" ? Contact : reference.entityType === "lead" ? UserRound : HandCoins;
          return <li key={`${reference.entityType}:${reference.entityId}`}><Link to={href} className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"><Icon className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span><span className="block truncate text-xs text-muted-foreground">{reference.entityType} · {reference.entityId}</span></span><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" /></Link></li>;
        })}
      </ul>
    </DataCard>
  );
}
