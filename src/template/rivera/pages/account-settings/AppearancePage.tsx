import { Monitor, Moon, Sun, RotateCcw, LayoutGrid, Rows3, AlignLeft, AlignJustify, AlignCenter } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, DataCard, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import { ThemeOptionCard } from "@/components/settings/ThemeOptionCard";
import { ThemeColorPicker } from "@/components/settings/ThemeColorPicker";
import { ThemePreview } from "@/components/settings/ThemePreview";
import type {
  ChartStyle,
  ColorMode,
  ContentWidth,
  Density,
  Direction,
  NavbarStyle,
  Radius,
  SidebarMode,
  SidebarStyle,
} from "@/config/themeConfig";

export default function AppearancePage() {
  const { trail } = useBreadcrumbs();
  const { config, set, reset } = useThemeConfig();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = () => {
    reset();
    setConfirmOpen(false);
    toast.success("Theme reset", { description: "All appearance settings restored to defaults." });
  };

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Appearance"
        description="Customize Rivera’s theme, layout, and interface preferences."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Appearance" }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset to default
          </Button>
        }
      />

      <ThemePreview />

      <DataCard title="Theme mode" description="Light, dark, or follow your system preference">
        <ThemeOptionCard<ColorMode>
          value={config.mode}
          onChange={(v) => set("mode", v)}
          columns={3}
          options={[
            { value: "light", label: "Light", description: "Clean daylight palette", icon: <Sun className="h-4 w-4" /> },
            { value: "dark", label: "Dark", description: "Low-glare deep surfaces", icon: <Moon className="h-4 w-4" /> },
            { value: "system", label: "System", description: "Match your OS preference", icon: <Monitor className="h-4 w-4" /> },
          ]}
        />
      </DataCard>

      <DataCard title="Brand color" description="Drives buttons, active nav, links, focus rings, and accents">
        <ThemeColorPicker value={config.brand} onChange={(v) => set("brand", v)} />
      </DataCard>

      <DataCard title="Layout density" description="Comfortable for clarity, compact to fit more on screen">
        <ThemeOptionCard<Density>
          value={config.density}
          onChange={(v) => set("density", v)}
          columns={2}
          options={[
            { value: "comfortable", label: "Comfortable", description: "Generous spacing for readability", icon: <Rows3 className="h-4 w-4" /> },
            { value: "compact", label: "Compact", description: "Tighter rows and toolbar", icon: <AlignJustify className="h-4 w-4" /> },
          ]}
        />
      </DataCard>

      <DataCard title="Sidebar" description="Choose how the navigation rail looks and behaves">
        <div className="space-y-4">
          <ThemeOptionCard<SidebarStyle>
            value={config.sidebarStyle}
            onChange={(v) => set("sidebarStyle", v)}
            columns={3}
            options={[
              { value: "default", label: "Default", description: "Standard rail" },
              { value: "compact", label: "Compact", description: "Smaller item height" },
              { value: "floating", label: "Floating", description: "Card-like surface with margin" },
            ]}
          />
          <ThemeOptionCard<SidebarMode>
            value={config.sidebarMode}
            onChange={(v) => set("sidebarMode", v)}
            columns={2}
            options={[
              { value: "expanded", label: "Expanded", description: "Show labels alongside icons" },
              { value: "collapsed", label: "Collapsed", description: "Icons only" },
            ]}
          />
        </div>
      </DataCard>

      <DataCard title="Navbar" description="Top bar behavior at the edge of the page">
        <ThemeOptionCard<NavbarStyle>
          value={config.navbarStyle}
          onChange={(v) => set("navbarStyle", v)}
          columns={3}
          options={[
            { value: "sticky", label: "Sticky", description: "Stays in view on scroll" },
            { value: "static", label: "Static", description: "Scrolls with the page" },
            { value: "glass", label: "Glass", description: "Translucent with backdrop blur" },
          ]}
        />
      </DataCard>

      <DataCard title="Border radius" description="A restrained enterprise scale — applied globally">
        <ThemeOptionCard<Radius>
          value={config.radius}
          onChange={(v) => set("radius", v)}
          columns={3}
          options={[
            { value: "sharp", label: "Sharp", description: "Tighter corners (4px)" },
            { value: "standard", label: "Standard", description: "Balanced (8px)" },
            { value: "soft", label: "Soft", description: "Slightly rounded (12px)" },
          ]}
        />
      </DataCard>

      <DataCard title="Content width" description="Centered constrains pages on large screens">
        <ThemeOptionCard<ContentWidth>
          value={config.contentWidth}
          onChange={(v) => set("contentWidth", v)}
          columns={2}
          options={[
            { value: "full", label: "Full width", description: "Use the entire canvas", icon: <LayoutGrid className="h-4 w-4" /> },
            { value: "centered", label: "Centered", description: "Max-width container", icon: <AlignCenter className="h-4 w-4" /> },
          ]}
        />
      </DataCard>

      <DataCard title="Charts" description="Default curve and ornament for analytics charts">
        <ThemeOptionCard<ChartStyle>
          value={config.chartStyle}
          onChange={(v) => set("chartStyle", v)}
          columns={3}
          options={[
            { value: "smooth", label: "Smooth", description: "Monotone curves" },
            { value: "linear", label: "Linear", description: "Straight segments" },
            { value: "minimal", label: "Minimal", description: "Fewer grid lines" },
          ]}
        />
      </DataCard>

      <DataCard title="Direction" description="Switch the document direction. RTL applies globally">
        <ThemeOptionCard<Direction>
          value={config.direction}
          onChange={(v) => set("direction", v)}
          columns={2}
          options={[
            { value: "ltr", label: "LTR", description: "Left to right", icon: <AlignLeft className="h-4 w-4" /> },
            { value: "rtl", label: "RTL", description: "Right to left", icon: <AlignLeft className="h-4 w-4 -scale-x-100" /> },
          ]}
        />
      </DataCard>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setConfirmOpen(true)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset to default
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset appearance to defaults?"
        description="This restores theme mode, brand color, density, sidebar, navbar, radius, content width, charts, and direction to Rivera's defaults. This action only affects this device."
        confirmLabel="Reset to defaults"
        cancelLabel="Cancel"
        tone="warning"
        onConfirm={handleReset}
      />
    </PageContainer>
  );
}