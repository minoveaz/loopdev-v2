import { EmailTemplatePage, templates } from "@/features/email-templates/shared";
export default function Coupon() {
  return <EmailTemplatePage template={templates.coupon} />;
}