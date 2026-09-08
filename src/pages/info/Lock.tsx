import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock as LockIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/formatters";

export default function LockScreenPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const name = session?.name ?? "Aria Bennet";
  return (
    <AuthLayout eyebrow="Locked" title="Welcome back" description="Enter your password to unlock the workspace.">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border"><AvatarFallback className="bg-gradient-primary text-primary-foreground">{getInitials(name)}</AvatarFallback></Avatar>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{session?.email ?? "aria@rivera.app"}</p>
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="pw" type="password" className="pl-9" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
        </div>
        <Button className="w-full" onClick={() => { if (pw) { toast.success("Unlocked"); navigate("/"); } else toast.error("Enter your password"); }}>Unlock</Button>
        <p className="text-xs text-muted-foreground">Not you? <Link to="/pages/login" className="text-primary hover:underline">Sign in as another user</Link></p>
      </div>
    </AuthLayout>
  );
}