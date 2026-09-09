import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive"><ShieldAlert className="h-8 w-8" /></div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Error 401</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have permission to access this page. If you think this is a mistake, contact your workspace admin.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild><Link to="/">Back to dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/helpdesk/support">Contact support</Link></Button>
        </div>
      </div>
    </div>
  );
}