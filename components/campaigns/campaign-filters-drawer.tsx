"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { CampaignFilter } from "./campaign-filters";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Draft", label: "Draft" },
  { value: "Completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "leadCount", label: "Lead Count" },
  { value: "startDate", label: "Start Date" },
  { value: "createdAt", label: "Created Date" },
];

type CampaignFiltersDrawerProps = {
  filters: CampaignFilter;
  onFiltersChange: (filters: CampaignFilter) => void;
  accounts?: Array<{ id: string; companyName: string }>;
};

export function CampaignFiltersDrawer({
  filters,
  onFiltersChange,
  accounts = [],
}: CampaignFiltersDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CampaignFilter>(filters);

  // Sync local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.accountId ? 1 : 0) +
    (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0) +
    (filters.leadCountRange?.min || filters.leadCountRange?.max ? 1 : 0);

  const updateFilter = (updates: Partial<CampaignFilter>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    updateFilter({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const clearFilters = () => {
    const cleared: CampaignFilter = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(filters);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Campaign Filters
          </SheetTitle>
          <SheetDescription className="text-body text-text-body">
            Filter campaigns by status, account, date range, and more
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-main">Status</Label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={localFilters.status?.includes(option.value) || false}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                  />
                  <label
                    htmlFor={`status-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Account Filter */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-text-main">Account</Label>
              <Select
                value={localFilters.accountId || "all"}
                onValueChange={(value) =>
                  updateFilter({ accountId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-main">Start Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-text-body">From</Label>
                <Input
                  type="date"
                  value={localFilters.dateRange?.start || ""}
                  onChange={(e) =>
                    updateFilter({
                      dateRange: {
                        ...localFilters.dateRange,
                        start: e.target.value,
                      } as any,
                    })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-text-body">To</Label>
                <Input
                  type="date"
                  value={localFilters.dateRange?.end || ""}
                  onChange={(e) =>
                    updateFilter({
                      dateRange: {
                        ...localFilters.dateRange,
                        end: e.target.value,
                      } as any,
                    })
                  }
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Lead Count Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-main">Lead Count</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-text-body">Min</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.leadCountRange?.min || ""}
                  onChange={(e) =>
                    updateFilter({
                      leadCountRange: {
                        ...localFilters.leadCountRange,
                        min: e.target.value ? parseInt(e.target.value) : undefined,
                      } as any,
                    })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-text-body">Max</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={localFilters.leadCountRange?.max || ""}
                  onChange={(e) =>
                    updateFilter({
                      leadCountRange: {
                        ...localFilters.leadCountRange,
                        max: e.target.value ? parseInt(e.target.value) : undefined,
                      } as any,
                    })
                  }
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-main">Sort By</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={localFilters.sortBy || "createdAt"}
                onValueChange={(value) =>
                  updateFilter({ sortBy: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={localFilters.sortOrder || "desc"}
                onValueChange={(value: "asc" | "desc") =>
                  updateFilter({ sortOrder: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Button onClick={handleApply} className="w-full">
              Apply Filters
            </Button>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

