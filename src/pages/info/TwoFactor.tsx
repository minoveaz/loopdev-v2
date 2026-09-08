import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  return (
    <AuthLayout eyebrow="Verify it's you" title="Two-factor authentication" description="Enter the 6-digit code from your authenticator app.">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><ShieldCheck className="h-6 w-6" /></div>
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
          </InputOTPGroup>
        </InputOTP>
        <Button onClick={() => { if (code.length === 6) toast.success("Verified"); else toast.error("Enter all 6 digits"); }} className="w-full">Verify</Button>
        <p className="text-xs text-muted-foreground">Lost access? <Link to="/pages/login" className="text-primary hover:underline">Use a backup code</Link></p>
      </div>
    </AuthLayout>
  );
}