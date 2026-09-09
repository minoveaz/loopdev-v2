import { Link } from "react-router-dom";
import { Search, ArrowRight, Clock, CheckCheck } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useMemo, useState } from "react";
import { DOC_SECTIONS } from "@/template/rivera/features/helpdesk/docs";
import { useAllDocProgress, articleKey } from "@/template/rivera/features/helpdesk/useDocProgress";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HelpdeskNav } from "@/components/helpdesk/HelpdeskNav";

export default function HelpdeskDocumentation() {
  const { trail } = useBreadcrumbs();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DOC_SECTIONS;
    return DOC_SECTIONS
      .map((s) => ({
        ...s,
        articles: s.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            a.summary.toLowerCase().includes(term) ||
            s.title.toLowerCase().includes(term),
        ),
      }))
      .filter((s) => s.articles.length > 0);
  }, [q]);

  const totalArticles = DOC_SECTIONS.reduce((n, s) => n + s.articles.length, 0);
  const progressMap = useAllDocProgress();
  const completedTotal = DOC_SECTIONS.reduce(
    (n, s) => n + s.articles.filter((a) => (progressMap[articleKey(s.slug, a.slug)] ?? 0) >= 1).length,
    0,
  );

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Helpdesk"
        title="Documentation"
        description={`${DOC_SECTIONS.length} sections · ${totalArticles} articles · ${completedTotal} read`}
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Documentation" }]}
      />
      <HelpdeskNav />
      <DataCard>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the docs…" className="pl-9" />
        </div>
      </DataCard>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ icon: Icon, slug, title, description, articles }) => {
          const progresses = articles.map((a) => progressMap[articleKey(slug, a.slug)] ?? 0);
          const sectionPct = Math.round((progresses.reduce((s, p) => s + p, 0) / Math.max(1, articles.length)) * 100);
          const sectionDone = articles.length > 0 && progresses.every((p) => p >= 1);
          return (
          <DataCard key={slug} className="flex flex-col">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <Progress value={sectionPct} className="h-1 flex-1" />
              <span className={cn("font-mono text-[10px]", sectionDone ? "text-success" : "text-muted-foreground")}>
                {sectionDone ? "Complete" : `${sectionPct}%`}
              </span>
            </div>

            <ul className="flex-1 space-y-1">
              {articles.map((a) => {
                const p = progressMap[articleKey(slug, a.slug)] ?? 0;
                const done = p >= 1;
                return (
                  <li key={a.slug}>
                    <Link
                      to={`/helpdesk/documentation/${slug}/${a.slug}`}
                      className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-mono",
                          done ? "border-success bg-success text-success-foreground" : p > 0 ? "border-primary text-primary" : "border-border text-muted-foreground",
                        )}>
                          {done ? <CheckCheck className="h-2.5 w-2.5" /> : p > 0 ? Math.round(p * 100) : ""}
                        </span>
                        <span className="min-w-0 truncate">{a.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />{a.readTime}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              to={`/helpdesk/documentation/${slug}/${articles[0].slug}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Browse section <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </DataCard>
          );
        })}
        {filtered.length === 0 && (
          <DataCard className="md:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">No articles match your search.</p>
          </DataCard>
        )}
      </div>
    </PageContainer>
  );
}