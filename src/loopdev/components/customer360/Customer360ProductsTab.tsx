import { Package } from "lucide-react";
import { EmptyState } from "@/components/common";

export function Customer360ProductsTab() {
  return <EmptyState icon={Package} title="No purchased products" description="Products, subscriptions, and services associated with this customer will appear here." />;
}
