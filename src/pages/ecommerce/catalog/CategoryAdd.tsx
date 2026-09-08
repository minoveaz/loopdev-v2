import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { categoriesStore } from "@/data";
import { CategoryDialog, type CategoryDraft } from "@/features/commerce/CategoryDialog";

export default function CategoryAdd() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (d: CategoryDraft) => {
    categoriesStore.create(d);
    toast({ title: "Category created", description: `${d.name} added.` });
    navigate("/ecommerce/catalog/categories");
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="eCommerce"
        title="Add category"
        description="Create a new product category."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Catalog" }, { label: "Add Category" }]}
      />
      <CategoryDialog
        open={true}
        onOpenChange={(o) => !o && navigate("/ecommerce/catalog/categories")}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
