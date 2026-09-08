import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/loopdev";

interface LogoProps {
  collapsed?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

export function Logo({ collapsed = false, variant = "dark", className }: LogoProps) {
  void variant;
  return (
    <BrandLogo
      variant={collapsed ? "isotype" : "full"}
      size="md"
      className={cn("shrink-0", className)}
    />
  );
}
