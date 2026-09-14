import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const forgotSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }).max(255),
});

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    const result = forgotSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    const res = await requestPasswordReset(result.data.email);
    setSubmitting(false);
    if (res.sent) {
      setSent(true);
    } else {
      setError(res.message || "Unable to send recovery instructions. Please try again.");
    }
  };

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Forgot your password?"
      description="Enter your work email address and we'll send password recovery instructions."
      footer={
        <Link to="/pages/login" className="font-semibold text-primary transition-fast hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-success/20 bg-success/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-success">Recovery link sent</p>
                <p className="mt-1 text-xs leading-relaxed text-success/80">
                  If <span className="font-mono">{email}</span> is registered, you'll receive instructions shortly.
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link to="/pages/reset-password">Open reset link (demo)</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-xs font-semibold">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "forgot-email-error" : undefined}
              className={cn("h-11", error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")}
            />
            {error && <p id="forgot-email-error" className="text-xs font-medium text-destructive">{error}</p>}
          </div>
          <Button type="submit" variant="premium" size="lg" loading={submitting} className="w-full">
            {submitting ? "Sending…" : "Send recovery link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
