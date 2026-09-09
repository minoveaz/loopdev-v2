import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function MultiLevelPage({ level, label }: { level: 1 | 2 | 3; label: string }) {
  const { trail } = useBreadcrumbs();
  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Components · Multi-level"
        title={label}
        description={`Demo page rendered ${level} level${level > 1 ? "s" : ""} deep in the navigation tree.`}
        breadcrumbs={trail.length ? trail : [{ label: "Components" }, { label: "Multi-level" }, { label }]}
      />
      <DataCard title="Nested navigation">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="primary">Level {level}</StatusBadge>
          <span className="text-sm text-muted-foreground">This page demonstrates that the sidebar correctly renders {level}-level deep menu items.</span>
        </div>
      </DataCard>
    </PageContainer>
  );
}

export const MultiLevelOne = () => <MultiLevelPage level={1} label="Level 1" />;
export const MultiLevelTwoA = () => <MultiLevelPage level={2} label="Level 2 — A" />;
export const MultiLevelThreeA = () => <MultiLevelPage level={3} label="Level 3 — A" />;
export const MultiLevelThreeB = () => <MultiLevelPage level={3} label="Level 3 — B" />;

export default MultiLevelOne;