import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type LogoSpinnerSize = "sm" | "md" | "lg" | "xl" | "2xl" | number;

interface LogoSpinnerProps {
  size?: LogoSpinnerSize;
  speed?: "fast" | "normal" | "slow";
  isStatic?: boolean;
  className?: string;
}

const infinityPath =
  "M31.5,50c-8.5,0-15.5-7-15.5-15.5S23,19,31.5,19c5.2,0,9.8,2.5,12.5,6.5L56,43.5c2.7,4,7.3,6.5,12.5,6.5c8.5,0,15.5-7,15.5-15.5S77,19,68.5,19c-5.2,0-9.8,2.5-12.5,6.5L44,43.5C41.3,47.5,36.7,50,31.5,50z";

const sizeMap = { sm: 24, md: 32, lg: 48, xl: 64, "2xl": 120 } as const;

export function LogoSpinner({
  size = "lg",
  speed = "normal",
  isStatic = false,
  className,
}: LogoSpinnerProps) {
  const gradientId = useId();
  const finalSize = typeof size === "number" ? size : sizeMap[size];
  const duration = useMemo(() => {
    if (speed === "fast") return "1.5s";
    if (speed === "slow") return "4s";
    return "2.5s";
  }, [speed]);

  return (
    <div
      role="status"
      aria-label="LoopDev generative system processing"
      className={cn("relative inline-flex aspect-[100/69] items-center justify-center", className)}
      style={{ width: finalSize }}
    >
      <svg viewBox="0 0 100 69" className="h-full w-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#135bec" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <path
          d={infinityPath}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-slate-200 dark:text-white/10"
        />
        <path
          d={infinityPath}
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={245}
          strokeDasharray="70 175"
          style={
            isStatic
              ? undefined
              : { animation: `loopdev-infinity-flow ${duration} linear infinite` }
          }
        />
      </svg>
      {!isStatic && (
        <style>{`
          @keyframes loopdev-infinity-flow {
            from { stroke-dashoffset: 245; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      )}
    </div>
  );
}
