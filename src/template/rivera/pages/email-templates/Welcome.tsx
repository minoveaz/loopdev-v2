import { EmailTemplatePage, templates } from "@/template/rivera/features/email-templates/shared";
export default function Welcome() {
  return <EmailTemplatePage template={templates.welcome} />;
}