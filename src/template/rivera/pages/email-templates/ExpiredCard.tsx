import { EmailTemplatePage, templates } from "@/template/rivera/features/email-templates/shared";
export default function ExpiredCard() {
  return <EmailTemplatePage template={templates["expired-card"]} />;
}