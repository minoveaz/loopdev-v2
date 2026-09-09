import { useState } from "react";
import { toast } from "sonner";
import { Monitor, Smartphone, Copy, Send, Mail } from "lucide-react";
import { PageHeader, DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type EmailTemplate = {
  key: string;
  name: string;
  description: string;
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  category: string;
  bodyHtml: string;
};

function renderHtml(html: string) {
  return { __html: html };
}

export function EmailTemplatePage({ template }: { template: EmailTemplate; breadcrumbLabel?: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [subject, setSubject] = useState(template.subject);
  const [fromName, setFromName] = useState(template.fromName);
  const [fromEmail, setFromEmail] = useState(template.fromEmail);
  const [testEmail, setTestEmail] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.bodyHtml);
      toast.success("HTML copied to clipboard");
    } catch {
      toast.error("Could not copy HTML");
    }
  };

  const handleSend = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Enter a valid test email");
      return;
    }
    toast.success(`Mock test email sent to ${testEmail}`);
    setTestEmail("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={template.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" /> Copy HTML
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DataCard
          title="Email preview"
          description="Render mock — no real emails are sent."
          action={
            <div className="inline-flex rounded-md border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition ${
                  device === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition ${
                  device === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          }
        >
          <div className="rounded-lg border border-border bg-muted/40 p-6">
            <div
              className={`mx-auto overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all ${
                device === "desktop" ? "max-w-2xl" : "max-w-[360px]"
              }`}
            >
              <div className="border-b border-border bg-muted/60 px-4 py-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-foreground">{fromName}</div>
                  <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                </div>
                <div className="mt-1 text-muted-foreground">{fromEmail}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{subject}</div>
                <div className="text-xs text-muted-foreground">{template.preheader}</div>
              </div>
              <div className="bg-background p-4 text-sm" dangerouslySetInnerHTML={renderHtml(template.bodyHtml)} />
            </div>
          </div>
        </DataCard>

        <div className="space-y-6">
          <DataCard title="Sender info" description="Edit display values for preview only.">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject line</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fromName">From name</Label>
                <Input id="fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fromEmail">From email</Label>
                <Input id="fromEmail" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Reply-to</Label>
                <Input value={template.replyTo} readOnly className="bg-muted" />
              </div>
            </div>
          </DataCard>

          <DataCard title="Send test (mock)" description="Simulates delivery — nothing leaves the browser.">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="testEmail">Recipient</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleSend}>
                <Send className="mr-2 h-4 w-4" /> Send test email
              </Button>
              <Separator />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Mail className="mt-0.5 h-3.5 w-3.5" />
                <span>This is a UI demo. No emails are actually delivered.</span>
              </div>
            </div>
          </DataCard>
        </div>
      </div>

      <DataCard title="Template body (HTML)" description="Read-only mock source.">
        <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <code>{template.bodyHtml}</code>
        </pre>
      </DataCard>
    </div>
  );
}

const baseSender = {
  fromName: "Rivera",
  fromEmail: "no-reply@rivera.app",
  replyTo: "support@rivera.app",
};

const wrap = (inner: string) => `<div style="font-family:Geist,Inter,Arial,sans-serif;color:#0f172a;line-height:1.6;">${inner}</div>`;

export const templates: Record<string, EmailTemplate> = {
  welcome: {
    key: "welcome",
    name: "Welcome Message",
    description: "Greet new users right after sign-up.",
    subject: "Welcome to Rivera 👋",
    preheader: "We're glad you're here. Let's get you set up.",
    category: "Onboarding",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:22px;">Welcome aboard, friend!</h1>
      <p>Thanks for joining <strong>Rivera</strong>. Your account is ready and your dashboard is waiting.</p>
      <p>Here are a few things you can do next:</p>
      <ul><li>Complete your profile</li><li>Invite a teammate</li><li>Explore templates</li></ul>
      <p style="margin:20px 0;"><a href="#" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Open dashboard</a></p>
      <p style="color:#64748b;font-size:12px;">— The Rivera Team</p>
    `),
  },
  confirm: {
    key: "confirm",
    name: "Confirm Account",
    description: "Verify a new account via a confirmation link.",
    subject: "Confirm your Rivera account",
    preheader: "One quick click and you're in.",
    category: "Verification",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:22px;">Confirm your email</h1>
      <p>Please confirm your email address to activate your account.</p>
      <p style="margin:20px 0;"><a href="#" style="background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Confirm account</a></p>
      <p style="color:#64748b;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
    `),
  },
  reset: {
    key: "reset",
    name: "Reset Password",
    description: "Help users recover access securely.",
    subject: "Reset your Rivera password",
    preheader: "Use the secure link below to set a new password.",
    category: "Security",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:22px;">Reset your password</h1>
      <p>We received a request to reset your password. The link below expires in 30 minutes.</p>
      <p style="margin:20px 0;"><a href="#" style="background:#dc2626;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset password</a></p>
      <p style="color:#64748b;font-size:12px;">Didn't request this? Ignore the email and your password stays the same.</p>
    `),
  },
  "expired-card": {
    key: "expired-card",
    name: "Expired Card",
    description: "Notify customers their payment method has expired.",
    subject: "Your card on file has expired",
    preheader: "Update your billing to avoid service interruption.",
    category: "Billing",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:22px;">Action required: update your card</h1>
      <p>The card ending in <strong>•• 4242</strong> has expired. To keep your subscription active, please update your billing details.</p>
      <p style="margin:20px 0;"><a href="#" style="background:#f59e0b;color:#0f172a;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Update billing</a></p>
      <p style="color:#64748b;font-size:12px;">Need help? Reply to this email and our team will assist.</p>
    `),
  },
  coupon: {
    key: "coupon",
    name: "Coupon Sale",
    description: "Promote a discount with a featured coupon code.",
    subject: "🎉 25% off — your exclusive coupon inside",
    preheader: "Limited time — use code RIVERA25 at checkout.",
    category: "Promotion",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:24px;">A treat just for you</h1>
      <p>Save <strong>25%</strong> on any plan when you upgrade this week.</p>
      <div style="margin:20px 0;padding:18px;border:2px dashed #4f46e5;border-radius:10px;text-align:center;">
        <div style="color:#64748b;font-size:12px;">Use code</div>
        <div style="font-size:26px;letter-spacing:4px;font-weight:700;color:#4f46e5;">RIVERA25</div>
      </div>
      <p style="margin:20px 0;"><a href="#" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Redeem now</a></p>
      <p style="color:#64748b;font-size:12px;">Offer ends Sunday at midnight.</p>
    `),
  },
  update: {
    key: "update",
    name: "Latest Update",
    description: "Share product changelog and new features.",
    subject: "What's new at Rivera — May edition",
    preheader: "Dashboards 2.0, faster search, and more.",
    category: "Product",
    ...baseSender,
    bodyHtml: wrap(`
      <h1 style="margin:0 0 12px;font-size:22px;">This month at Rivera</h1>
      <p>We shipped a bunch of improvements based on your feedback.</p>
      <ul>
        <li><strong>Dashboards 2.0</strong> — refreshed layout with live KPIs.</li>
        <li><strong>Faster search</strong> — global search is now 3× quicker.</li>
        <li><strong>New email templates</strong> — preview and customize before sending.</li>
      </ul>
      <p style="margin:20px 0;"><a href="#" style="background:#10b981;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">See changelog</a></p>
      <p style="color:#64748b;font-size:12px;">— The Rivera Team</p>
    `),
  },
};