import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "./AuthLayout";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: "Please enter your full name." }).max(80),
  email: z.string().trim().email({ message: "Enter a valid email address." }).max(255),
  password: z
    .string()
    .min(8, { message: "Use at least 8 characters." })
    .max(128)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
      message: "Mix letters and numbers for a stronger password.",
    }),
});

const ACCOUNTS_KEY = "loopdev:auth-accounts";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse({ name, email, password });
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
    
    const res = await signUp(result.data.email, result.data.password, result.data.name);
    setSubmitting(false);
    if (res.success) {
      navigate("/launchpad", { replace: true });
    } else {
      setErrors({ email: res.error || "Failed to create account. Please try again." });
    }
  };

  const errorClass = "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30";

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      description="Join LoopDev to build, operate, and collaborate with your team."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/pages/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reg-name" className="text-xs font-semibold">Full name</Label>
          <Input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amelia Hart"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "reg-name-error" : undefined}
            className={cn("h-11", errors.name && errorClass)}
          />
          {errors.name && <p id="reg-name-error" className="text-xs font-medium text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-xs font-semibold">Work email</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
            className={cn("h-11", errors.email && errorClass)}
          />
          {errors.email && <p id="reg-email-error" className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password" className="text-xs font-semibold">Password</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "reg-password-error" : "reg-password-help"}
              className={cn("h-11 pr-10", errors.password && errorClass)}
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
          {errors.password ? (
            <p id="reg-password-error" className="text-xs font-medium text-destructive">{errors.password}</p>
          ) : (
            <p id="reg-password-help" className="text-xs text-muted-foreground">8+ characters with letters and numbers.</p>
          )}
        </div>
        <Button type="submit" variant="premium" size="lg" loading={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          By continuing you agree to LoopDev's mock terms.
        </p>
      </form>
      <div className="mt-6">
        <SocialAuthButtons label="Or sign up with" />
      </div>
    </AuthLayout>
  );
}
