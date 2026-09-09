import { Star, BookOpen, Users, Mail } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { instructorsStore } from "@/template/rivera/data";
import { initials, summarizeInstructors } from "@/template/rivera/features/academy/shared";
import { formatNumber } from "@/lib/formatters";

export default function AcademyInstructors() {
  const { trail } = useBreadcrumbs();
  const instructors = useLocalStore(instructorsStore);
  const s = summarizeInstructors(instructors);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Academy"
        title="Instructors"
        description="Meet the experts powering Rivera Academy."
        breadcrumbs={trail.length ? trail : [{ label: "Academy" }, { label: "Instructors" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Instructors" value={formatNumber(s.total)} delta={2.4} icon={Users} accent="primary" />
        <StatCard label="Total students" value={formatNumber(s.students)} delta={4.6} icon={BookOpen} accent="info" />
        <StatCard label="Avg rating" value={String(s.avgRating)} delta={0.2} icon={Star} accent="gold" />
      </div>

      <DataCard title="Directory" description={`${instructors.length} instructors`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((i) => (
            <article key={i.id} className="surface-card-muted-compact p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(i.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{i.expertise}</p>
                </div>
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />{i.email}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Stat label="Courses" value={i.coursesCount} />
                <Stat label="Students" value={i.studentsCount.toLocaleString()} />
                <Stat label="Rating" value={i.rating} />
              </dl>
            </article>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold">{value}</dd>
    </div>
  );
}