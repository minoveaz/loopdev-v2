import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function ExpiredCard() {
  return <EmailTemplatePage template={templates["expired-card"]} />;
}