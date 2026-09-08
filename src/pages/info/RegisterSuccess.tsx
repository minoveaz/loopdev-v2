import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { Button } from "@/components/ui/button";

export default function RegisterSuccessPage() {
  return (
    <AuthLayout eyebrow="Welcome aboard" title="Account created" description="Your Rivera account is ready. Verify your email to unlock the full experience.">
      <div className="space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success ring-1 ring-success/20"><CheckCircle2 className="h-8 w-8" /></div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">We sent a verification link to your email. Click it to confirm your address.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="gap-2"><Link to="/">Continue to dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/pages/login">Back to sign in</Link></Button>
        </div>
      </div>
    </AuthLayout>
  );
}