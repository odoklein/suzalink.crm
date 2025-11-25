"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export type CampaignFilter = {
  status?: string[];
  accountId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  leadCountRange?: {
    min: number;
    max: number;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type CampaignFiltersProps = {
  filters: CampaignFilter;
  onFiltersChange: (filters: CampaignFilter) => void;
  accounts?: Array<{ id: string; companyName: string }>;
};

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

export function CampaignFilters({
  filters,
  onFiltersChange,
  accounts = [],
}: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CampaignFilter>(filters);

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.accountId ? 1 : 0) +
    (filters.dateRange?.start || filters.dateRange?.end ? 1 : 0) +
    (filters.leadCountRange?.min || filters.leadCountRange?.max ? 1 : 0);

  const updateFilter = (updates: Partial<CampaignFilter>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    updateFilter({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const clearFilters = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-main">Filters</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Filter */}
            {accounts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account</Label>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
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
                <div>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lead Count</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
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
                <div>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort By</Label>
              <div className="grid grid-cols-2 gap-2">
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

            <Button onClick={handleApply} className="w-full">
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {filters.status && filters.status.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="gap-1"
            >
              {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {filters.accountId && accounts.find((a) => a.id === filters.accountId) && (
        <Badge variant="secondary" className="gap-1">
          {accounts.find((a) => a.id === filters.accountId)?.companyName}
          <button
            onClick={() => updateFilter({ accountId: undefined })}
            className="ml-1 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}

