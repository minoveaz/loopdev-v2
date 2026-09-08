import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MessageSquare, Calendar as CalendarIcon } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { blogPostsStore } from "@/data";
import { BLOG_CATEGORIES, blogStatusLabel, blogStatusTone } from "@/features/blogs/shared";
import { format } from "date-fns";

export default function BlogHome() {
  const { trail } = useBreadcrumbs();
  const posts = useLocalStore(blogPostsStore);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    });
  }, [posts, search, category]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Blogs"
        title="Blog home"
        description="Latest stories from the Rivera team."
        breadcrumbs={trail.length ? trail : [{ label: "Blogs" }, { label: "Home" }]}
        actions={<Button asChild><Link to="/blogs/manager">Open manager</Link></Button>}
      />

      <DataCard
        title="All posts"
        description={`${filtered.length} of ${posts.length}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search posts…" containerClassName="w-64" />
            <FilterDropdown label="Category" value={category} onChange={setCategory}
              options={[{ value: "all", label: "All" }, ...BLOG_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
          </div>
        }
      >
        {featured && (
          <article className="mb-6 grid gap-4 overflow-hidden surface-card-muted-compact sm:grid-cols-[1.4fr_1fr]">
            {featured.coverUrl && (
              <img src={featured.coverUrl} alt={featured.title} className="h-56 w-full object-cover sm:h-full" />
            )}
            <div className="flex flex-col justify-between p-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge tone={blogStatusTone[featured.status]}>{blogStatusLabel[featured.status]}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{featured.category}</span>
                </div>
                <h2 className="text-xl font-semibold">{featured.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{featured.excerpt}</p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" />{featured.views.toLocaleString()}</span>
                <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3 w-3" />{featured.comments}</span>
                {featured.publishedAt && (
                  <span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" />{format(new Date(featured.publishedAt), "MMM d, yyyy")}</span>
                )}
              </div>
            </div>
          </article>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <article key={p.id} className="group overflow-hidden surface-card-muted-compact transition hover:border-primary/40 hover:shadow-sm">
              {p.coverUrl && <img src={p.coverUrl} alt={p.title} className="h-36 w-full object-cover transition group-hover:opacity-90" />}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={blogStatusTone[p.status]}>{blogStatusLabel[p.status]}</StatusBadge>
                  <span className="text-[11px] text-muted-foreground">{p.category}</span>
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{p.views.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.comments}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}