import { useNavigate } from "react-router-dom";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ordersStore } from "@/template/rivera/data";
import { OrderForm, type OrderDraft } from "@/template/rivera/features/commerce/OrderForm";

export default function OrderAdd() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (d: OrderDraft) => {
    ordersStore.create(d);
    toast({ title: "Order created", description: d.reference });
    navigate("/ecommerce/sales/orders");
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="eCommerce"
        title="Add order"
        description="Create a new order in your store."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Sales" }, { label: "Add Order" }]}
      />
      <DataCard>
        <OrderForm onSubmit={handleSubmit} onCancel={() => navigate("/ecommerce/sales/orders")} submitLabel="Create order" />
      </DataCard>
    </PageContainer>
  );
}
