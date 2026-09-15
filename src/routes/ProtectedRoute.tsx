import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogoSpinner } from "@/loopdev/components";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <LogoSpinner size="2xl" speed="fast" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/pages/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
