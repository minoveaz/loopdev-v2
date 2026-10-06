import type { ContactFormSectionDefinition } from "../../../../packages/contracts/src/contact-form";
import { MobileFormSection } from "../forms/MobileFormPrimitives";

export function ContactFormTab({ definition, stats, renderField }: {
  definition: ContactFormSectionDefinition;
  stats: { completed: number; total: number; errors: number; status: "error" | "complete" | "progress" | "neutral" };
  renderField: (field: ContactFormSectionDefinition["fields"][number]) => React.ReactNode;
}) {
  return <MobileFormSection definition={definition} {...stats}>{definition.fields.map(renderField)}</MobileFormSection>;
}
