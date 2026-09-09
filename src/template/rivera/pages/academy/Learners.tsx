import { useMemo, useState } from "react";
import { Users, BookOpen, CheckCircle2, Activity } from "lucide-react";
import { DataCard, PageContainer, PageHeader, SearchInput, StatCard } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { learnersStore } from "@/template/rivera/data";
import { initials, summarizeLearners } from "@/template/rivera/features/academy/shared";
import { formatNumber } from "@/lib/formatters";
import { formatDistanceToNow } from "date-fns";

export default function AcademyLearners() {
  const { trail } = useBreadcrumbs();
  const learners = useLocalStore(learnersStore);
  const [search, setSearch] = useState("");
  const s = summarizeLearners(learners);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
  }, [learners, search]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Learners"
        description="Track enrollment and progress across the learner base."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Learners" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active learners" value={formatNumber(s.total)} delta={4.1} icon={Users} accent="primary" />
        <StatCard label="Total enrollments" value={formatNumber(s.enrolled)} delta={6.2} icon={BookOpen} accent="info" />
        <StatCard label="Completed" value={formatNumber(s.completed)} delta={3.5} icon={CheckCircle2} accent="accent" />
        <StatCard label="Avg progress" value={`${s.avgProgress}%`} delta={1.2} icon={Activity} accent="gold" />
      </div>

      <DataCard title="Learners" description={`${filtered.length} of ${learners.length}`} flush
        action={<SearchInput value={search} onValueChange={setSearch} placeholder="Search learners…" containerClassName="w-72" />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead className="text-right">Enrolled</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(l.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{l.enrolledCourses}</TableCell>
                <TableCell className="text-right font-mono">{l.completedCourses}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${l.progress}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{l.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.lastActiveAt), { addSuffix: true })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </PageContainer>
  );
}