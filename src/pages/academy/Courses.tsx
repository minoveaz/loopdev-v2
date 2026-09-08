import { useMemo, useState } from "react";
import { Star, Clock, Users, Layers } from "lucide-react";
import { DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { coursesStore, instructorsStore } from "@/data";
import {
  CATEGORIES, courseStatusLabel, courseStatusTone, formatDuration, levelTone,
} from "@/features/academy/shared";

export default function AcademyCourses() {
  const { trail } = useBreadcrumbs();
  const courses = useLocalStore(coursesStore);
  const instructors = useLocalStore(instructorsStore);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const instructorMap = useMemo(
    () => new Map(instructors.map((i) => [i.id, i.name])),
    [instructors],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [courses, search, category, status]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Courses"
        description="Browse the catalog with rich course details."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Courses" }]}
        actions={
          <div className="flex gap-2">
            <Button variant={view === "grid" ? "default" : "outline"} size="sm" onClick={() => setView("grid")}>Grid</Button>
            <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>Table</Button>
          </div>
        }
      />

      <DataCard
        title="Catalog"
        description={`${filtered.length} of ${courses.length}`}
        flush={view === "table"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search courses…" containerClassName="w-64" />
            <FilterDropdown label="Category" value={category} onChange={setCategory}
              options={[{ value: "all", label: "All" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
            <FilterDropdown label="Status" value={status} onChange={setStatus}
              options={[
                { value: "all", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]} />
          </div>
        }
      >
        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <article key={c.id} className="group surface-card-muted-compact p-4 transition hover:border-primary/40 hover:shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.category} · {instructorMap.get(c.instructorId) ?? "—"}</p>
                  </div>
                  <StatusBadge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</StatusBadge>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <StatusBadge tone={levelTone[c.level]}>{c.level}</StatusBadge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 text-gold" />{c.rating}</span>
                </div>
                <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
                  <Stat icon={Clock} label="Duration" value={formatDuration(c.durationMinutes)} />
                  <Stat icon={Layers} label="Lessons" value={c.lessons} />
                  <Stat icon={Users} label="Enrolled" value={c.enrolled.toLocaleString()} />
                </dl>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">${c.price}</span>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell><StatusBadge tone={levelTone[c.level]}>{c.level}</StatusBadge></TableCell>
                  <TableCell className="text-muted-foreground">{instructorMap.get(c.instructorId) ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{c.lessons}</TableCell>
                  <TableCell className="text-right font-mono">{c.enrolled.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{c.rating}</TableCell>
                  <TableCell className="text-right font-mono">${c.price}</TableCell>
                  <TableCell><StatusBadge tone={courseStatusTone[c.status]}>{courseStatusLabel[c.status]}</StatusBadge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </PageContainer>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div>
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-xs font-semibold">{value}</p>
    </div>
  );
}