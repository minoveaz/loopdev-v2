import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { productsStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { ProductDialog, type ProductDraft } from "@/features/commerce/ProductDialog";

export default function ProductAdd() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();
  const products = useLocalStore(productsStore);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  const handleSubmit = (d: ProductDraft) => {
    productsStore.create({ ...d, rating: 0, sales: 0 });
    toast({ title: "Product created", description: `${d.name} added.` });
    navigate("/ecommerce/catalog/products");
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="eCommerce"
        title="Add product"
        description="Create a new SKU in your catalog."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Catalog" }, { label: "Add Product" }]}
      />
      <ProductDialog
        open={true}
        onOpenChange={(o) => !o && navigate("/ecommerce/catalog/products")}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
