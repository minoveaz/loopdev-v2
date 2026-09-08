import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function Welcome() {
  return <EmailTemplatePage template={templates.welcome} />;
}