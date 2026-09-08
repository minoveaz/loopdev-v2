import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function CarouselPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Carousel" description="Swipeable content with embla under the hood." />
      <Showcase title="Basic" hint="carousel">
        <Carousel className="w-full">
          <CarouselContent>
            {Array.from({ length: 6 }).map((_, i) => (
              <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 text-2xl font-semibold">
                  Slide {i + 1}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Showcase>
    </PageContainer>
  );
}