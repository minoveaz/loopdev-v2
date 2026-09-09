import { EmailTemplatePage, templates } from "@/template/rivera/features/email-templates/shared";
export default function Confirm() {
  return <EmailTemplatePage template={templates.confirm} />;
}