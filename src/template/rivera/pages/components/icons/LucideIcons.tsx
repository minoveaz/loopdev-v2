import { useState } from "react";
import * as Icons from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";

export default function LucideIconsPage() {
  const [q, setQ] = useState("");
  const names = Object.keys(Icons).filter(
    (n) => /^[A-Z]/.test(n) && typeof (Icons as any)[n] === "object"
  );
  const filtered = names.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(0, 240);
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Lucide Icons" description="Searchable subset of the Lucide library." />
      <Input placeholder="Search icons..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((name) => {
          const Icon = (Icons as any)[name];
          return (
            <div key={name} className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center">
              <Icon className="h-5 w-5 text-foreground" />
              <span className="truncate text-[10px] text-muted-foreground" title={name}>{name}</span>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}