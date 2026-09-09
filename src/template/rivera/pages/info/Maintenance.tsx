import { Link } from "react-router-dom";
import { Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-soft text-warning"><Wrench className="h-8 w-8" /></div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Service interruption</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">We'll be right back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Rivera is undergoing scheduled maintenance. Thanks for your patience — we expect to be back online within 30 minutes.</p>
        <div className="mt-6 flex justify-center"><StatusBadge tone="warning" dot>Maintenance in progress</StatusBadge></div>
        <div className="mt-6"><Button asChild variant="outline" className="gap-2"><Link to="/"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link></Button></div>
      </div>
    </div>
  );
}