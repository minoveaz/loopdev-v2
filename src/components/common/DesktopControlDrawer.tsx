import React, { ReactNode } from "react";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { Button } from "@/template/rivera/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DesktopControlPreset {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onSelect: () => void;
}

export interface DesktopControlDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  activeFilterCount?: number;
  presets?: DesktopControlPreset[];
  children: ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  resultCount?: number;
  applyLabel?: string;
  resetLabel?: string;
}

export function DesktopControlDrawer({
  open,
  onClose,
  title,
  eyebrow = "LOOPDEV CRM",
  activeFilterCount = 0,
  presets,
  children,
  onReset,
  onApply,
  resultCount,
  applyLabel,
  resetLabel = "Limpiar Filtros",
}: DesktopControlDrawerProps) {
  const handleApply = () => {
    if (onApply) {
      onApply();
    } else {
      onClose();
    }
  };

  const finalApplyLabel =
    applyLabel ||
    (typeof resultCount === "number"
      ? `Ver ${resultCount} ${resultCount === 1 ? "resultado" : "resultados"}`
      : "Aplicar Filtros");

  const headerTitleNode = (
    <div className="flex flex-col gap-1">
      {eyebrow && (
        <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
          {eyebrow}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span className="text-lg font-bold text-foreground">{title}</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </div>
    </div>
  );

  const stickyFooterNode = (
    <div className="flex items-center justify-between gap-3 w-full pt-2">
      {onReset && (
        <Button
          variant="outline"
          onClick={onReset}
          className="text-xs font-semibold h-10 px-4"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          {resetLabel}
        </Button>
      )}
      <Button
        onClick={handleApply}
        className="flex-1 text-xs font-bold h-10 shadow-sm"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
        {finalApplyLabel}
      </Button>
    </div>
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={headerTitleNode}
      footer={stickyFooterNode}
      size="md"
    >
      <div className="space-y-6 pb-4">
        {/* 1. HubSpot 1-Tap Presets */}
        {presets && presets.length > 0 && (
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Vistas Inteligentes (1-Toque)
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const PresetIcon = preset.icon;
                const isActive = !!preset.active;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={preset.onSelect}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {PresetIcon && (
                      <PresetIcon className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-primary")} />
                    )}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Structured Sections Body */}
        <div className="space-y-5">{children}</div>
      </div>
    </DetailDrawer>
  );
}
