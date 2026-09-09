import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "What is Rivera?", a: "A frontend-only admin scaffold with a complete design system, mock data, and ready-to-use modules." },
  { q: "How do I add a new page?", a: "Create a file under src/pages and add a route in src/routes/AppRoutes.tsx. Use PageHeader and DataCard for consistency." },
  { q: "Can I use this in production?", a: "Yes — connect Lovable Cloud to add a real backend. The mock data layer maps cleanly to a database." },
  { q: "How does dark mode work?", a: "All colors are HSL semantic tokens defined in index.css. Toggle the theme to see them swap automatically." },
  { q: "Where is data stored?", a: "Every store uses createLocalStore which persists to localStorage. Clear it from the developer console to reset." },
  { q: "Is the auth real?", a: "No — it's a mock session in localStorage. Wire it up to Lovable Cloud auth for real user accounts." },
  { q: "How do I theme charts?", a: "Open the Theme Customizer (sparkle icon in the topbar) and pick a chart curve preset. Every recharts chart updates live." },
  { q: "Can I export data?", a: "Yes — most tables include CSV export via the Download button in the page header." },
];

export default function FAQsPage() {
  const { trail } = useBreadcrumbs();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const term = q.trim().toLowerCase();
  const filtered = FAQS.filter((f) => !term || f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term));
  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Pages"
        title="Frequently asked questions"
        description="Quick answers to the things people ask us most."
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: "FAQs" }]}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" className="pl-9" />
      </div>
      <DataCard>
        <ul className="divide-y divide-border">
          {filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 py-4 text-left">
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && <p className="pb-4 text-sm text-muted-foreground">{f.a}</p>}
              </li>
            );
          })}
          {filtered.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No questions match.</li>}
        </ul>
      </DataCard>
    </PageContainer>
  );
}