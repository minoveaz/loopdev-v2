import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return [d, h, m, s];
}

export default function ComingSoonPage() {
  const target = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const [d, h, m, s] = useCountdown(target);
  const [email, setEmail] = useState("");
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Rocket className="h-8 w-8" /></div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Stay tuned</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Something great is coming</h1>
        <p className="mt-2 text-sm text-muted-foreground">We're putting the final touches on this module. Drop your email and we'll let you know the moment it's live.</p>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {[{l:"Days",v:d},{l:"Hours",v:h},{l:"Min",v:m},{l:"Sec",v:s}].map((x) => (
            <div key={x.l} className="rounded-xl border border-border bg-background p-3"><p className="font-display text-2xl font-semibold tabular-nums">{String(x.v).padStart(2,"0")}</p><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{x.l}</p></div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={() => { toast.success("You're on the list"); setEmail(""); }}>Notify me</Button>
        </div>
        <div className="mt-4"><Button asChild variant="ghost" size="sm" className="gap-2"><Link to="/"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link></Button></div>
      </div>
    </div>
  );
}