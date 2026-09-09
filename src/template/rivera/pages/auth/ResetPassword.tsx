import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Use at least 8 characters." })
      .max(128)
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
        message: "Mix letters and numbers for a stronger password.",
      }),
    confirm: z.string().max(128),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

function strengthOf(pw: string): { score: number; label: string; tone: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too short", tone: "bg-destructive" },
    { label: "Weak", tone: "bg-destructive" },
    { label: "Fair", tone: "bg-warning" },
    { label: "Good", tone: "bg-info" },
    { label: "Strong", tone: "bg-success" },
    { label: "Excellent", tone: "bg-success" },
  ];
  return { score, ...map[Math.min(score, map.length - 1)] };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = strengthOf(password);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = resetSchema.safeParse({ password, confirm });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof next;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast.success("Password updated", { description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/pages/login", { replace: true }), 1600);
    }, 700);
  };

  const errorClass = "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30";

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Set a new password"
      description="Choose a strong password to secure your Rivera account. (Mock — nothing is actually saved.)"
      footer={
        <Link to="/pages/login" className="font-semibold text-primary transition-fast hover:underline">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="rounded-xl border border-success/20 bg-success/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-success">Password updated</p>
              <p className="mt-1 text-xs text-success/80">Redirecting you to sign in…</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="rp-pw" className="text-xs font-semibold">New password</Label>
            <div className="relative">
              <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="rp-pw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "rp-pw-error" : "rp-pw-strength"}
                className={cn("h-11 pl-10 pr-10", errors.password && errorClass)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div id="rp-pw-strength" className="flex items-center gap-2 pt-1">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-smooth", strength.tone)}
                    style={{ width: `${(Math.min(strength.score, 5) / 5) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{strength.label}</span>
              </div>
            )}
            {errors.password && <p id="rp-pw-error" className="text-xs font-medium text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm" className="text-xs font-semibold">Confirm password</Label>
            <div className="relative">
              <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="rp-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? "rp-confirm-error" : undefined}
                className={cn("h-11 pl-10", errors.confirm && errorClass)}
              />
            </div>
            {errors.confirm && <p id="rp-confirm-error" className="text-xs font-medium text-destructive">{errors.confirm}</p>}
          </div>
          <Button type="submit" variant="premium" size="lg" loading={submitting} className="w-full">
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
