import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { defaultWebAuthAdapter } from "@/loopdev/domains/platform/adapter/auth-supabase";

const schema = z.object({
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/),
  confirm: z.string(),
}).refine((value) => value.password === value.confirm, { path: ["confirm"] });

export default function ActivateInvitation() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!token || !parsed.success) {
      setError(t("invitationActivation.invalidForm"));
      return;
    }
    setSubmitting(true);
    setError("");
    const client = defaultWebAuthAdapter.getClient();
    const result: { error?: { message: string }; data?: { error?: string } } = client
      ? await client.functions.invoke("activate-organization-invitation", { body: { token, password } })
      : { error: { message: t("invitationActivation.unavailable") } };
    setSubmitting(false);
    if (result.error || result.data?.error) {
      setError(result.error?.message || result.data.error);
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate("/pages/login", { replace: true }), 1800);
  };

  return (
    <AuthLayout
      eyebrow={t("invitationActivation.eyebrow")}
      title={t("invitationActivation.title")}
      description={t("invitationActivation.description")}
      footer={<Link to="/pages/login" className="font-semibold text-primary hover:underline">{t("invitationActivation.backToLogin")}</Link>}
    >
      {done ? (
        <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="mr-2 inline h-5 w-5" />{t("invitationActivation.success")}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="activation-password">{t("invitationActivation.password")}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="activation-password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="h-11 pl-10 pr-10" />
              <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? t("invitationActivation.hidePassword") : t("invitationActivation.showPassword")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activation-confirm">{t("invitationActivation.confirmPassword")}</Label>
            <Input id="activation-confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="h-11" />
          </div>
          {error && <p role="alert" className={cn("text-xs font-medium text-destructive")}>{error}</p>}
          <p className="text-xs text-muted-foreground">{t("invitationActivation.requirements")}</p>
          <Button type="submit" variant="premium" size="lg" loading={submitting} className="w-full">{t("invitationActivation.activate")}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
