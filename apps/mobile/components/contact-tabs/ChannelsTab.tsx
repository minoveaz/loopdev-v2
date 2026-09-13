import type { ContactFormSectionDefinition } from "../../../../packages/contracts/src/contact-form";
import { ContactFormTab } from "./ContactFormTab";

export function ChannelsTab(props: React.ComponentProps<typeof ContactFormTab> & { definition: ContactFormSectionDefinition }) {
  return <ContactFormTab {...props} />;
}
