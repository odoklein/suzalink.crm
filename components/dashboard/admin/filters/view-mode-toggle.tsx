"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "compact" | "standard" | "detailed";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const modeConfig: Record<ViewMode, { icon: typeof LayoutGrid; label: string }> = {
  compact: { icon: List, label: "Compact" },
  standard: { icon: LayoutGrid, label: "Standard" },
  detailed: { icon: Maximize2, label: "Détaillé" },
};

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center rounded-lg border border-gray-200 bg-white p-0.5", className)}>
      {(Object.keys(modeConfig) as ViewMode[]).map((mode) => {
        const { icon: Icon, label } = modeConfig[mode];
        const isActive = value === mode;
        
        return (
          <Button
            key={mode}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5 text-xs gap-1.5 rounded-md transition-all",
              isActive 
                ? "bg-primary-50 text-primary-600 hover:bg-primary-100" 
                : "text-muted-foreground hover:text-gray-900 hover:bg-gray-50"
            )}
            onClick={() => onChange(mode)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
