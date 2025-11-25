"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";

export interface LeadFilters {
  search: string;
  status: string[];
  assignedTo: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  statusOptions?: string[];
  schemaConfig?: any[];
}

// Status labels in French
const STATUS_LABELS: Record<string, string> = {
  "New": "Nouveau",
  "Locked": "Verrouillé",
  "Contacted": "Contacté",
  "Qualified": "Qualifié",
  "Nurture": "En cours",
  "Lost": "Perdu",
};

export function LeadFilters({
  filters,
  onFiltersChange,
  statusOptions = ["New", "Locked", "Contacted", "Qualified", "Nurture", "Lost"],
  schemaConfig = [],
}: LeadFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ["users", "BD"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=BD");
      if (!res.ok) throw new Error("Échec du chargement des utilisateurs");
      return res.json();
    },
  });

  // Extract users array from response, default to empty array if not available
  const users = usersData?.users || [];

  const updateFilter = (key: keyof LeadFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    updateFilter("status", newStatus);
  };

  const clearFilter = (key: keyof LeadFilters) => {
    if (key === "status") {
      updateFilter(key, []);
    } else {
      updateFilter(key, key === "assignedTo" ? null : "");
    }
  };

  const clearAll = () => {
    onFiltersChange({
      search: "",
      status: [],
      assignedTo: null,
      dateFrom: null,
      dateTo: null,
    });
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    filters.status.length +
    (filters.assignedTo ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filtres avancés</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-7 text-xs"
                  >
                    Tout effacer
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Statut
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <Badge
                        key={status}
                        variant={
                          filters.status.includes(status) ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleStatus(status)}
                      >
                        {getStatusLabel(status)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Assigné à
                  </label>
                  <Select
                    value={filters.assignedTo || "all"}
                    onValueChange={(value) =>
                      updateFilter("assignedTo", value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tous les commerciaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les commerciaux</SelectItem>
                      {Array.isArray(users) && users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Date de début
                    </label>
                    <Input
                      type="date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => updateFilter("dateFrom", e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Date de fin
                    </label>
                    <Input
                      type="date"
                      value={filters.dateTo || ""}
                      onChange={(e) => updateFilter("dateTo", e.target.value || null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Pastilles de filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Recherche : {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("search")}
              />
            </Badge>
          )}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {getStatusLabel(status)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleStatus(status)}
              />
            </Badge>
          ))}
          {filters.assignedTo && (
            <Badge variant="secondary" className="gap-1">
              Assigné : {Array.isArray(users) && users.find((u: any) => u.id === filters.assignedTo)?.email}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("assignedTo")}
              />
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              Du : {new Date(filters.dateFrom).toLocaleDateString("fr-FR")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("dateFrom")}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              Au : {new Date(filters.dateTo).toLocaleDateString("fr-FR")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("dateTo")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
