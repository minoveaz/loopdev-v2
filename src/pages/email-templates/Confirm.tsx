import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function Confirm() {
  return <EmailTemplatePage template={templates.confirm} />;
}