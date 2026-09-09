import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Info, AlertTriangle, CheckCircle2, CheckCheck, Link2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { DOC_SECTIONS, findArticle, type DocBlock } from "@/template/rivera/features/helpdesk/docs";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useDocProgress, useAllDocProgress, articleKey } from "@/template/rivera/features/helpdesk/useDocProgress";

const calloutTone = {
  info: { icon: Info, classes: "bg-info-soft text-info border-info/20" },
  warning: { icon: AlertTriangle, classes: "bg-warning-soft text-warning border-warning/20" },
  success: { icon: CheckCircle2, classes: "bg-success-soft text-success border-success/20" },
} as const;

function Block({ block }: { block: DocBlock }) {
  if (block.type === "p") return <p className="text-sm leading-relaxed text-foreground/90">{block.text}</p>;
  if (block.type === "h") return <h2 className="font-display text-lg font-semibold tracking-tight">{block.text}</h2>;
  if (block.type === "list")
    return (
      <ul className="space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90 [list-style:disc]">
        {block.items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    );
  if (block.type === "code")
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed">
        <code className="font-mono text-foreground">{block.code}</code>
      </pre>
    );
  const t = calloutTone[block.tone];
  const Icon = t.icon;
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4", t.classes)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{block.title}</p>
        <p className="text-sm opacity-90">{block.text}</p>
      </div>
    </div>
  );
}

type ArticleMatch = NonNullable<ReturnType<typeof findArticle>>;

export default function HelpdeskDocumentationArticle() {
  const { section: sectionSlug = "", article: articleSlug = "" } = useParams();
  const found = findArticle(sectionSlug, articleSlug);
  if (!found) return <Navigate to="/helpdesk/documentation" replace />;
  return <DocumentationArticleContent found={found} />;
}

function DocumentationArticleContent({ found }: { found: ArticleMatch }) {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const { section, article } = found;

  const idx = section.articles.findIndex((a) => a.slug === article.slug);
  const prev = idx > 0 ? section.articles[idx - 1] : null;
  const next = idx < section.articles.length - 1 ? section.articles[idx + 1] : null;

  const breadcrumbs = trail.length
    ? trail
    : [{ label: "Helpdesk" }, { label: "Documentation", href: "/helpdesk/documentation" }, { label: section.title }, { label: article.title }];

  const Icon = section.icon;
  const key = articleKey(section.slug, article.slug);
  const [progress, setProgress] = useDocProgress(key);
  const allProgress = useAllDocProgress();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      // Distance scrolled past the article top, normalized over its scrollable height.
      const total = Math.max(1, el.offsetHeight - viewport * 0.5);
      const scrolled = Math.max(0, viewport - rect.top - viewport * 0.3);
      setProgress(scrolled / total);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [key, setProgress]);

  const pct = Math.round(progress * 100);
  const isComplete = progress >= 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        navigate(`/helpdesk/documentation/${section.slug}/${prev.slug}`);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        navigate(`/helpdesk/documentation/${section.slug}/${next.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, section.slug, prev, next]);

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const url = `${window.location.origin}/helpdesk/documentation/${section.slug}/${article.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow={section.title}
        title={article.title}
        description={article.summary}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/helpdesk/documentation"><ArrowLeft className="h-4 w-4" />All docs</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <DataCard>
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{section.title}</p>
              <h1 className="font-display text-base font-semibold">{article.title}</h1>
            </div>
            <StatusBadge tone="neutral"><Clock className="h-3 w-3" />{article.readTime}</StatusBadge>
          </div>

          <div className="mb-5 flex items-center gap-3">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className={cn("flex items-center gap-1 font-mono text-[11px]", isComplete ? "text-success" : "text-muted-foreground")}>
              {isComplete ? <><CheckCheck className="h-3 w-3" />Read</> : `${pct}%`}
            </span>
          </div>

          <div ref={bodyRef} className="space-y-5">
            {article.body.map((b, i) => <Block key={i} block={b} />)}
          </div>

          <nav aria-label="Article navigation" className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/helpdesk/documentation/${section.slug}/${prev.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-soft"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary-soft group-hover:text-primary">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Previous</span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-foreground">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block" aria-hidden />
            )}
            {next ? (
              <Link
                to={`/helpdesk/documentation/${section.slug}/${next.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-right transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-soft sm:col-start-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Next</span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-foreground">{next.title}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary-soft group-hover:text-primary">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ) : (
              <Link
                to="/helpdesk/documentation"
                className="group flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-right transition-colors hover:border-primary/40 hover:bg-muted/40 sm:col-start-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">End of section</span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-foreground">Back to all docs</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground group-hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}
          </nav>
        </DataCard>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <DataCard title="On this page" description={`${section.articles.length} articles in ${section.title}`}>
            <nav className="space-y-1">
              {DOC_SECTIONS.map((s) => {
                const SIcon = s.icon;
                const isCurrent = s.slug === section.slug;
                const progresses = s.articles.map((a) => allProgress[articleKey(s.slug, a.slug)] ?? 0);
                const sectionPct = Math.round((progresses.reduce((sum, p) => sum + p, 0) / Math.max(1, s.articles.length)) * 100);
                const sectionDone = s.articles.length > 0 && progresses.every((p) => p >= 1);
                return (
                  <Collapsible key={s.slug} defaultOpen={isCurrent}>
                    <CollapsibleTrigger
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                        isCurrent && "bg-muted/60",
                      )}
                    >
                      <SIcon className={cn("h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("min-w-0 flex-1 truncate text-left", isCurrent && "font-medium text-foreground")}>{s.title}</span>
                      <span className={cn("font-mono text-[10px]", sectionDone ? "text-success" : "text-muted-foreground")}>
                        {sectionDone ? "✓" : `${sectionPct}%`}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <ul className="ml-3 mt-1 space-y-0.5 border-l border-border pl-2">
                        {s.articles.map((a) => {
                          const p = allProgress[articleKey(s.slug, a.slug)] ?? 0;
                          const done = p >= 1;
                          const isActive = isCurrent && a.slug === article.slug;
                          return (
                            <li key={a.slug}>
                              <Link
                                to={`/helpdesk/documentation/${s.slug}/${a.slug}`}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
                                  isActive
                                    ? "bg-primary-soft text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[8px] font-mono",
                                    done
                                      ? "border-success bg-success text-success-foreground"
                                      : p > 0
                                        ? "border-primary text-primary"
                                        : "border-border",
                                  )}
                                >
                                  {done ? <CheckCheck className="h-2 w-2" /> : p > 0 ? Math.round(p * 100) : ""}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </nav>
          </DataCard>
        </aside>
      </div>
    </PageContainer>
  );
}