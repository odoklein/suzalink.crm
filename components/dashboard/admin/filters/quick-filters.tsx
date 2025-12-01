"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, Clock, Calendar, X, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickFilter {
  id: string;
  label: string;
  icon: typeof Megaphone;
  color: string;
}

const availableFilters: QuickFilter[] = [
  { id: "active-campaigns", label: "Campagnes actives", icon: Megaphone, color: "blue" },
  { id: "pending-approvals", label: "En attente", icon: Clock, color: "amber" },
  { id: "today-bookings", label: "RDV aujourd'hui", icon: Calendar, color: "cyan" },
];

interface QuickFiltersProps {
  activeFilters: string[];
  onToggle: (filterId: string) => void;
  onClear: () => void;
  className?: string;
}

export function QuickFilters({ activeFilters, onToggle, onClear, className }: QuickFiltersProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span>Filtres:</span>
      </div>
      
      {availableFilters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        const Icon = filter.icon;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 text-xs gap-1.5 transition-all",
              isActive && filter.color === "blue" && "bg-blue-600 hover:bg-blue-700",
              isActive && filter.color === "amber" && "bg-amber-600 hover:bg-amber-700",
              isActive && filter.color === "cyan" && "bg-cyan-600 hover:bg-cyan-700",
              !isActive && "bg-white"
            )}
            onClick={() => onToggle(filter.id)}
          >
            <Icon className="h-3 w-3" />
            {filter.label}
          </Button>
        );
      })}
      
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-gray-900"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          Effacer
        </Button>
      )}
      
      {hasActiveFilters && (
        <Badge variant="secondary" className="text-[10px] h-5">
          {activeFilters.length} actif{activeFilters.length > 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}
