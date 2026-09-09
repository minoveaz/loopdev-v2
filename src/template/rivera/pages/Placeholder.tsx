import { Construction } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

interface PlaceholderProps {
  /** Optional override; otherwise resolved from navigation config. */
  title?: string;
  eyebrow?: string;
  description?: string;
}

export default function Placeholder({ title, eyebrow, description }: PlaceholderProps) {
  const { trail, meta } = useBreadcrumbs();
  const resolvedTitle = title ?? meta?.label ?? "Page";
  const resolvedEyebrow = eyebrow ?? meta?.parent ?? meta?.section ?? "Coming soon";

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow={resolvedEyebrow}
        title={resolvedTitle}
        description={
          description ??
          `The ${resolvedTitle.toLowerCase()} module is part of the Rivera scaffold and will be built out next.`
        }
        breadcrumbs={trail}
      />
      <DataCard>
        <EmptyState
          icon={Construction}
          title="Under construction"
          description="This page exists as part of the layout walkthrough. The full design will land in a future iteration."
          size="lg"
        />
      </DataCard>
    </PageContainer>
  );
}
