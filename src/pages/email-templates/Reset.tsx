import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function Reset() {
  return <EmailTemplatePage template={templates.reset} />;
}