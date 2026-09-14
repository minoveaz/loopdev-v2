import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <aside
        aria-label="LoopDev platform"
        className="dark relative hidden overflow-hidden bg-gradient-editorial lg:block"
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(hsl(var(--accent)/0.4)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="relative flex h-full flex-col justify-between p-12 text-sidebar-foreground">
          <Logo />
          <div>
            <p className="font-display text-5xl font-semibold leading-tight tracking-tight text-balance text-foreground">
              The platform workspace built for modern engineering & operations.
            </p>
            <p className="mt-4 max-w-md text-muted-foreground">
              LoopDev unifies multi-tenant business operations, CRM, and cloud intelligence with speed and precision.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">v1.0.0 · 2026 Edition</p>
        </div>
      </aside>

      <main
        id="main-content"
        aria-labelledby="auth-title"
        className="relative flex flex-col items-center justify-center bg-background p-6 md:p-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60 lg:opacity-0" />
        <div className="relative w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo variant="light" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h1 id="auth-title" className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-10 text-center text-[11px] text-muted-foreground">
            <Link to="/launchpad" className="transition-fast hover:text-foreground">← Back to Launchpad</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
