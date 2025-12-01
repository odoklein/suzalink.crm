"use client";

import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TimePeriod = "day" | "week" | "month" | "quarter" | "custom";

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

const periodLabels: Record<TimePeriod, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
  custom: "Personnalisé",
};

export function TimePeriodSelector({ value, onChange, className }: TimePeriodSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("h-8 gap-2 bg-white border-gray-200 text-slate-900", className)}
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-slate-900">{periodLabels[value]}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
          <DropdownMenuItem 
            key={period}
            onClick={() => onChange(period)}
            className={cn(
              "text-xs",
              value === period && "bg-primary-50 text-primary-600"
            )}
          >
            {periodLabels[period]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
