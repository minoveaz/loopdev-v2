import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LoadingState, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { catalogAdapter, type CatalogItem, type CatalogVariant } from "@/loopdev/domains/catalog";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useT } from "@/i18n";
import { ProductMediaGalleryManager } from "./ProductMediaGalleryManager";

export default function ProductMediaGalleryPage() {
  const t = useT();
  const translateRef = useRef(t);
  translateRef.current = t;
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!organizationId) {
      setError(translateRef.current("common.erpProductRecord.noOrganization"));
      setLoading(false);
      return () => { active = false; };
    }
    if (!productId) {
      setError(translateRef.current("common.erpProductRecord.productNotFound"));
      setLoading(false);
      return () => { active = false; };
    }

    const load = async () => {
      try {
        const loadedItem = await catalogAdapter.getCatalogItem(productId, { organizationId });
        if (!active) return;
        if (!loadedItem) {
          setError(translateRef.current("common.erpProductRecord.productNotFound"));
          return;
        }
        const loadedVariants = await catalogAdapter.listVariants({
          organizationId,
          catalogItemId: loadedItem.id,
          includeArchived: true,
        });
        if (!active) return;
        setItem(loadedItem);
        setVariants(loadedVariants);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : translateRef.current("common.erpProductRecord.loadError"));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [organizationId, productId]);

  if (loading) {
    return <PageContainer width="wide"><LoadingState label={t("common.erpProductRecord.loadingProduct")} /></PageContainer>;
  }
  if (error || !item) {
    return (
      <PageContainer width="narrow">
        <div className="rounded-lg border border-destructive/30 p-5">
          <p role="alert" className="text-sm text-destructive">
            {error ?? t("common.erpProductRecord.productNotFound")}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/app/erp/products")}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("common.erpProductRecord.backToProducts")}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("common.erpProductRecord.mediaGalleryPageTitle")}
        description={item.name}
        breadcrumbs={[
          { label: "ERP" },
          { label: t("common.erpProductRecord.products") },
          { label: item.name },
          { label: t("common.erpProductRecord.mediaTitle") },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(`/app/erp/products/${item.id}`)}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("common.erpProductRecord.backToProduct")}
          </Button>
        }
      />
      <ProductMediaGalleryManager item={item} variants={variants} organizationId={organizationId} />
    </PageContainer>
  );
}
