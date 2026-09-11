import { FileText } from "lucide-react";
import { EmptyState } from "@/components/common";

export function Customer360DocumentsTab() {
  return <EmptyState icon={FileText} title="No personal documents" description="Documents associated with this contact will appear here when the document workspace is connected." />;
}
