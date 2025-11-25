"use client";

import { Table2, LayoutGrid, Columns, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ViewMode = "table" | "card" | "kanban" | "timeline";

type ViewToggleProps = {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
};

const VIEW_OPTIONS: Record<ViewMode, { icon: any; label: string; tooltip: string }> = {
  table: {
    icon: Table2,
    label: "Table",
    tooltip: "Table view - best for scanning many campaigns",
  },
  card: {
    icon: LayoutGrid,
    label: "Card",
    tooltip: "Card view - visual cards with key metrics",
  },
  kanban: {
    icon: Columns,
    label: "Kanban",
    tooltip: "Kanban view - status-based columns",
  },
  timeline: {
    icon: Calendar,
    label: "Timeline",
    tooltip: "Timeline view - calendar showing campaign duration",
  },
};

export function ViewToggle({
  view,
  onViewChange,
  availableViews = ["table", "card", "kanban"],
}: ViewToggleProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => {
          if (value) {
            onViewChange(value as ViewMode);
          }
        }}
        className="border rounded-lg p-1"
      >
        {availableViews.map((viewMode) => {
          const option = VIEW_OPTIONS[viewMode];
          if (!option) return null;

          const Icon = option.icon;

          return (
            <Tooltip key={viewMode}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={viewMode}
                  aria-label={option.label}
                  className="data-[state=on]:bg-primary-100 data-[state=on]:text-primary-500"
                >
                  <Icon className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{option.label}</span>
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>{option.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ToggleGroup>
    </TooltipProvider>
  );
}

