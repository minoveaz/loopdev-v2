import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function Update() {
  return <EmailTemplatePage template={templates.update} />;
}