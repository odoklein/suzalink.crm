"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortableColumnHeaderProps = {
  label: string;
  sortKey: string;
  currentSortBy: string;
  currentSortOrder: "asc" | "desc";
  onSort: (sortKey: string) => void;
  className?: string;
  align?: "left" | "center" | "right";
};

export function SortableColumnHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
  align = "left",
}: SortableColumnHeaderProps) {
  const isActive = currentSortBy === sortKey;
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  const handleClick = () => {
    if (isActive) {
      // Toggle sort order if already active
      onSort(sortKey);
    } else {
      // Set new sort key
      onSort(sortKey);
    }
  };

  return (
    <th className={cn("px-4 py-3 text-xs font-medium text-muted-foreground uppercase", alignClass, className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto p-0 font-medium hover:bg-transparent",
          isActive && "text-text-main",
          alignClass
        )}
        onClick={handleClick}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {isActive ? (
            currentSortOrder === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </span>
      </Button>
    </th>
  );
}



