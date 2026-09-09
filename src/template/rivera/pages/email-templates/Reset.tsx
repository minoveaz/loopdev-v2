import { EmailTemplatePage, templates } from "@/template/rivera/features/email-templates/shared";
export default function Reset() {
  return <EmailTemplatePage template={templates.reset} />;
}