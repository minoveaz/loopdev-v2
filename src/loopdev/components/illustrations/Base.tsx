import type { ReactNode } from "react";

interface IllustrationBaseProps {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}

export const illustrationStrokeWidth = 8;
export const illustrationStrokeLinecap = "round" as const;
export const illustrationStrokeLinejoin = "round" as const;

export function IllustrationBase({
  children,
  className = "h-full w-full",
  viewBox = "0 0 400 300",
}: IllustrationBaseProps) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}
