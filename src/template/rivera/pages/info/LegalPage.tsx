import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export function LegalPage({ title, kind }: { title: string; kind: "privacy" | "terms" }) {
  const { trail } = useBreadcrumbs();
  const intro = kind === "privacy"
    ? "We respect your privacy. This document describes what data Rivera collects, how it's used, and the rights you have over it."
    : "By using Rivera you agree to these Terms. Please read them carefully — they cover your rights, responsibilities, and our service guarantees.";

  const sections = kind === "privacy"
    ? [
        { h: "Information we collect", p: "Account details, usage analytics, and content you create. We never sell personal data." },
        { h: "How we use it", p: "To run the service, improve our product, communicate with you, and meet legal obligations." },
        { h: "Sharing", p: "Only with subprocessors strictly required to operate Rivera, under data-processing agreements." },
        { h: "Your rights", p: "Access, correct, export, or delete your data at any time from Account → Settings." },
        { h: "Retention", p: "We keep data for as long as your account is active and for a short window after deletion." },
        { h: "Contact", p: "Questions? Email privacy@rivera.app." },
      ]
    : [
        { h: "Acceptable use", p: "Don't break things, abuse the service, or harm other users. We reserve the right to suspend offending accounts." },
        { h: "Subscriptions", p: "Paid plans renew automatically. Cancel anytime to stop the next renewal." },
        { h: "Intellectual property", p: "You own your content. Rivera owns the software, brand, and product design." },
        { h: "Liability", p: "Rivera is provided 'as is'. Our liability is limited to fees paid in the prior 12 months." },
        { h: "Termination", p: "Either party can end the agreement with notice. Sections covering IP and liability survive termination." },
        { h: "Governing law", p: "These Terms are governed by the laws of California, USA." },
      ];

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Legal"
        title={title}
        description={`Last updated May 6, 2026. ${intro}`}
        breadcrumbs={trail.length ? trail : [{ label: "Pages" }, { label: title }]}
      />
      <DataCard>
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-lg font-semibold">{s.h}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
      </DataCard>
    </PageContainer>
  );
}

export default LegalPage;