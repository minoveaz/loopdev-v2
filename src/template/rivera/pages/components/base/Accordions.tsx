import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AccordionsPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Accordions" description="Collapsible content panels for FAQ-style layouts." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Single" hint="type=single">
          <Accordion type="single" collapsible className="w-full">
            {[1, 2, 3].map((i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>Section {i}</AccordionTrigger>
                <AccordionContent>Rivera accordion content for section {i}.</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Showcase>
        <Showcase title="Multiple" hint="type=multiple">
          <Accordion type="multiple" className="w-full">
            {["Pricing", "Billing", "Support"].map((label) => (
              <AccordionItem key={label} value={label}>
                <AccordionTrigger>{label}</AccordionTrigger>
                <AccordionContent>Details for {label}.</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Showcase>
      </div>
    </PageContainer>
  );
}