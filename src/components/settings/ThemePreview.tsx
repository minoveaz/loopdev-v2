import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";
import { ArrowUpRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeConfig } from "@/hooks/useThemeConfig";

const DATA = [
  { x: "Mon", v: 12 }, { x: "Tue", v: 18 }, { x: "Wed", v: 15 },
  { x: "Thu", v: 22 }, { x: "Fri", v: 28 }, { x: "Sat", v: 24 }, { x: "Sun", v: 32 },
];

export function ThemePreview() {
  const { config } = useThemeConfig();
  const curve = config.chartStyle === "linear" ? "linear" : "monotone";
  const showGrid = config.chartStyle !== "minimal";

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</p>
          <h4 className="mt-1 text-base font-semibold text-foreground">Workspace snapshot</h4>
        </div>
        <Badge>New</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Stat */}
        <div className="surface-card-muted-compact min-w-0 p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums text-foreground">$24,810</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
            <ArrowUpRight className="h-3.5 w-3.5" /> +12.4%
          </p>
        </div>

        {/* Chart */}
        <div className="surface-card-muted-compact h-[110px] p-2 lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rivPreview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />}
              <XAxis dataKey="x" hide />
              <Area type={curve} dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rivPreview)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input placeholder="Search workspace…" />
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          <Home className="h-4 w-4" /> Active sidebar item
        </span>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="outline">v1.0.0</Badge>
      </div>
    </div>
  );
}