import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "full" | "isotype" | "logotype";
export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  surface?: "solid" | "plain";
  size?: BrandLogoSize;
  className?: string;
  isotypeClassName?: string;
}

const infinityPath =
  "M31.5,50c-8.5,0-15.5-7-15.5-15.5S23,19,31.5,19c5.2,0,9.8,2.5,12.5,6.5L56,43.5c2.7,4,7.3,6.5,12.5,6.5c8.5,0,15.5-7,15.5-15.5S77,19,68.5,19c-5.2,0-9.8,2.5-12.5,6.5L44,43.5C41.3,47.5,36.7,50,31.5,50z";

const sizes: Record<BrandLogoSize, { box: string; icon: string; text: string; gap: string }> = {
  xs: { box: "h-6 w-6 rounded", icon: "text-xs", text: "text-[10px]", gap: "gap-1" },
  sm: { box: "h-8 w-8 rounded-lg", icon: "text-base", text: "text-sm", gap: "gap-2" },
  md: { box: "h-10 w-10 rounded-xl", icon: "text-xl", text: "text-lg", gap: "gap-3" },
  lg: { box: "h-14 w-14 rounded-xl", icon: "text-[28px]", text: "text-2xl", gap: "gap-4" },
  xl: { box: "h-20 w-20 rounded-[24px]", icon: "text-[40px]", text: "text-[32px]", gap: "gap-6" },
};

function Isotype({
  size,
  surface,
  className,
}: Pick<BrandLogoProps, "size" | "surface" | "className">) {
  const currentSize = sizes[size ?? "md"];

  return (
    <div
      className={cn(
        currentSize.box,
        "relative flex shrink-0 items-center justify-center",
        surface === "solid" &&
          "overflow-hidden bg-[#135bec] shadow-[0_10px_20px_rgba(19,91,236,0.2)]",
        className,
      )}
    >
      {surface === "solid" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4px_4px]"
        />
      )}
      <svg
        viewBox="0 0 100 69"
        className={cn(currentSize.icon, "relative z-10 h-auto w-[70%]")}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d={infinityPath}
          className={surface === "solid" ? "text-white" : "text-[#135bec]"}
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  variant = "full",
  surface = "solid",
  size = "md",
  className,
  isotypeClassName,
}: BrandLogoProps) {
  const currentSize = sizes[size];
  const children: ReactNode[] = [];

  if (variant === "full" || variant === "isotype") {
    children.push(
      <Isotype
        key="isotype"
        size={size}
        surface={surface}
        className={isotypeClassName}
      />,
    );
  }

  if (variant === "full" || variant === "logotype") {
    children.push(
      <span
        key="logotype"
        className={cn("font-black tracking-tighter text-[#135bec]", currentSize.text)}
      >
        loop.dev
      </span>,
    );
  }

  return <div className={cn("inline-flex items-center", currentSize.gap, className)}>{children}</div>;
}
