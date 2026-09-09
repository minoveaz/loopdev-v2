import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ordersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency } from "@/lib/formatters";
import { OrderForm, type OrderDraft } from "@/template/rivera/features/commerce/OrderForm";
import { orderStatusTone } from "@/template/rivera/features/commerce/shared";

export default function OrderEdit() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orders = useLocalStore(ordersStore);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(params.get("id"));

  const editing = useMemo(() => orders.find((o) => o.id === editingId) ?? null, [orders, editingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.reference.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
  }, [orders, search]);

  const handleSubmit = (d: OrderDraft) => {
    if (!editing) return;
    ordersStore.update(editing.id, d);
    toast({ title: "Order updated", description: d.reference });
    setEditingId(null);
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="eCommerce"
        title="Edit order"
        description={editing ? `Editing ${editing.reference}` : "Pick an order to edit."}
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Sales" }, { label: "Edit Order" }]}
        actions={<Button variant="outline" size="sm" onClick={() => navigate("/ecommerce/sales/orders")}>Back to list</Button>}
      />

      {editing ? (
        <DataCard>
          <OrderForm order={editing} onSubmit={handleSubmit} onCancel={() => setEditingId(null)} submitLabel="Save changes" />
        </DataCard>
      ) : (
        <>
          <div className="mb-4">
            <SearchInput value={search} onValueChange={setSearch} placeholder="Search by reference or customer…" size="sm" containerClassName="w-80" />
          </div>
          <DataCard flush>
            {filtered.length === 0 ? (
              <div className="p-6"><EmptyState icon={Pencil} title="No orders" description="No matching orders." /></div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setEditingId(o.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-fast hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-foreground">{o.reference}</p>
                      <p className="truncate text-sm text-muted-foreground">{o.customer}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge tone={orderStatusTone[o.status]} dot>{o.status}</StatusBadge>
                      <span className="font-mono text-sm tabular-nums text-foreground">{formatCurrency(o.amount, o.currency)}</span>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DataCard>
        </>
      )}
    </PageContainer>
  );
}
