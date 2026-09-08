import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "./AuthLayout";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).max(128),
});

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const redirectTo = location.state?.from && location.state.from !== "/pages/login" ? location.state.from : "/";

  const [email, setEmail] = useState("admin@rivera.app");
  const [password, setPassword] = useState("rivera");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as "email" | "password";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      signIn(result.data.email);
      toast.success("Welcome back to Rivera");
      navigate(redirectTo, { replace: true });
    }, 600);
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      description="Use any email and password — Rivera runs on mock auth for this demo."
      footer={
        <>
          New to Rivera?{" "}
          <Link to="/pages/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs font-semibold">Email</Label>
          <div className="relative">
            <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={cn("h-11 pl-10", errors.email && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="text-xs font-medium text-destructive">{errors.email}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="text-xs font-semibold">Password</Label>
          <div className="relative">
            <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={cn("h-11 pl-10 pr-10", errors.password && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")}
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
          {errors.password && (
            <p id="login-password-error" className="text-xs font-medium text-destructive">{errors.password}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <Checkbox defaultChecked id="remember" />
            <span>Remember me</span>
          </label>
          <Link to="/pages/forgot-password" className="font-semibold text-primary transition-fast hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          variant="premium"
          size="lg"
          loading={submitting}
          className="w-full"
        >
          {submitting ? "Signing in…" : "Sign in to Rivera"}
        </Button>
      </form>
      <div className="mt-6">
        <SocialAuthButtons />
      </div>
    </AuthLayout>
  );
}
