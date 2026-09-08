import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun; hint: string }[] = [
  { value: "light", label: "Light", icon: Sun, hint: "Bright palette" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Dim palette" },
  { value: "system", label: "System", icon: Monitor, hint: "Match OS" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Display the *resolved* icon so users always see what's active.
  const ActiveIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Theme"
          title={`Theme: ${theme}${theme === "system" ? ` (${resolvedTheme})` : ""}`}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-foreground/85 transition-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground",
            className,
          )}
        >
          <ActiveIcon className="h-[17px] w-[17px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>Appearance</span>
          <kbd className="font-mono text-[10px]">⌘⇧L</kbd>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, label, icon: Icon, hint }) => {
          const active = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => setTheme(value)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4 text-foreground/70" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {value === "system" ? `Match OS (${resolvedTheme})` : hint}
                </span>
              </div>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
