import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { productMediaAdapter, type ProductMediaAssignment } from "@/loopdev/domains/catalog";
import type { CatalogItem } from "@/loopdev/domains/catalog";
import type { FilePreviewSource } from "@/loopdev/domains/files";
import { useNavigate } from "react-router-dom";
import { useT } from "@/i18n";

export function ProductMediaSection({
  item,
  organizationId,
}: {
  item: CatalogItem;
  organizationId: string;
}) {
  const t = useT();
  const translateRef = useRef(t);
  translateRef.current = t;
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<ProductMediaAssignment[]>([]);
  const [previewSources, setPreviewSources] = useState<Record<string, FilePreviewSource>>({});
  const [hasVariantImages, setHasVariantImages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const previewRef = useRef<Record<string, FilePreviewSource>>({});

  useEffect(() => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const allAssignments = await productMediaAdapter.listAssignments({
          organizationId,
          catalogItemId: item.id,
        });
        const loadedAssignments = allAssignments.filter((assignment) => assignment.variantId === null);
        const sources = await Promise.all(loadedAssignments.map(async (assignment) => [
          assignment.assetId,
          await productMediaAdapter.getPreviewSource(assignment.assetId, { organizationId, catalogItemId: item.id }),
        ] as const));
        if (requestId !== requestRef.current) {
          sources.forEach(([, source]) => source?.revoke?.());
          return;
        }
        Object.values(previewRef.current).forEach((source) => source.revoke?.());
        const nextSources = Object.fromEntries(
          sources.filter((entry): entry is readonly [string, FilePreviewSource] => entry[1] !== null),
        );
        previewRef.current = nextSources;
        setPreviewSources(nextSources);
        setAssignments(loadedAssignments);
        setHasVariantImages(allAssignments.some((assignment) => assignment.variantId !== null));
      } catch (cause) {
        if (requestId === requestRef.current) {
          setError(cause instanceof Error ? cause.message : translateRef.current("common.erpProductRecord.mediaLoadError"));
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    };

    void load();
    return () => {
      requestRef.current += 1;
      Object.values(previewRef.current).forEach((source) => source.revoke?.());
      previewRef.current = {};
    };
  }, [item.id, organizationId]);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby={`product-media-title-${item.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {t("common.erpProductRecord.mediaEyebrow")}
          </p>
          <h2 id={`product-media-title-${item.id}`} className="mt-1 truncate text-sm font-semibold">
            {t("common.erpProductRecord.mediaTitle")}
          </h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => navigate(`/app/erp/products/${item.id}/media`)}
        >
          {t("common.erpProductRecord.openProductGallery")}
        </Button>
      </div>

      {loading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {t("common.erpProductRecord.loadingMedia")}
        </p>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>
      ) : assignments.length ? (
        <Carousel
          className="mt-4"
          aria-label={t("common.erpProductRecord.productImageCarousel")}
          opts={{ align: "start" }}
        >
          <CarouselContent className="ml-0">
            {assignments.map((assignment) => (
              <CarouselItem key={assignment.id} className="pl-0">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {previewSources[assignment.assetId]?.url ? (
                    <img
                      className="h-full w-full object-contain"
                      src={previewSources[assignment.assetId].url ?? undefined}
                      alt={assignment.altText || assignment.asset.fileName}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {assignments.length > 1 && (
            <>
              <CarouselPrevious
                aria-label={t("common.erpProductRecord.previousProductImage")}
                className="left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 border-0 bg-background/90 shadow-sm"
              />
              <CarouselNext
                aria-label={t("common.erpProductRecord.nextProductImage")}
                className="right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 border-0 bg-background/90 shadow-sm"
              />
            </>
          )}
        </Carousel>
      ) : (
        <div className="mt-4 flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <ImagePlus className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {t(hasVariantImages ? "common.erpProductRecord.variantImagesInGallery" : "common.erpProductRecord.noProductGalleryImages")}
          </p>
        </div>
      )}
    </section>
  );
}
