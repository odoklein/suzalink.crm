"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye, Phone, Mail, Table2, Grid3x3, Download, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import { LeadFilters, LeadFiltersProps } from "./lead-filters";
import { BulkActions } from "./bulk-actions";
import { LeadCardView } from "./lead-card-view";
import { SortableColumnHeader } from "@/components/ui/sortable-column-header";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

type Lead = {
  id: string;
  status: string;
  standardData: any;
  customData: any;
  lockedAt: string | null;
  lockedByUser: {
    id: string;
    email: string;
  } | null;
  assignedBD: {
    id: string;
    email: string;
    avatar?: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  activities?: Array<{
    id: string;
    type: string;
    createdAt: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    dueDate: string;
    type: string;
  }>;
};

type LeadTableProps = {
  campaignId: string;
  schemaConfig?: any[];
  onLeadClick?: (leadId: string) => void;
};

type ViewMode = "table" | "card";

// Status labels in French
const STATUS_LABELS: Record<string, string> = {
  "New": "Nouveau",
  "Locked": "Verrouillé",
  "Contacted": "Contacté",
  "Qualified": "Qualifié",
  "Nurture": "En cours",
  "Lost": "Perdu",
};

export function LeadTable({ campaignId, schemaConfig = [], onLeadClick }: LeadTableProps) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<LeadFiltersProps["filters"]>({
    search: "",
    status: [],
    assignedTo: null,
    dateFrom: null,
    dateTo: null,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const limit = 50;
  const debouncedSearch = useDebounce(filters.search, 300);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      campaignId,
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });
    
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.status.length > 0) {
      filters.status.forEach((status) => params.append("status", status));
    }
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    
    return params;
  }, [campaignId, page, limit, debouncedSearch, filters, sortBy, sortOrder]);

  const { data, isLoading } = useQuery({
    queryKey: ["leads", queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/leads?${queryParams}`);
      if (!res.ok) throw new Error("Échec du chargement des leads");
      return res.json();
    },
  });

  const leads: Lead[] = data?.leads || [];
  const pagination = data?.pagination || { total: 0, totalPages: 0 };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins}m`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-info-light text-info-500";
      case "Locked":
        return "bg-warning-100 text-warning-500";
      case "Contacted":
        return "bg-primary-100 text-primary-500";
      case "Qualified":
        return "bg-success-100 text-success-text";
      case "Nurture":
        return "bg-muted text-muted-foreground";
      case "Lost":
        return "bg-destructive-100 text-destructive-text";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const statusOptions = ["New", "Locked", "Contacted", "Qualified", "Nurture", "Lost"];

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((lead) => lead.id));
    }
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column with default desc order
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ campaignId });
    if (filters.search) params.set("search", filters.search);
    if (filters.status.length > 0) {
      filters.status.forEach((status) => params.append("status", status));
    }
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    window.open(`/api/leads/export?${params}`, "_blank");
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour du statut");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Succès", description: "Statut mis à jour" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Chargement des leads...</div>;
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres et actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <LeadFilters
            filters={filters}
            onFiltersChange={setFilters}
            statusOptions={statusOptions}
            schemaConfig={schemaConfig}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("card")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions en masse */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedLeadIds={selectedIds}
          onSelectionChange={setSelectedIds}
          statusOptions={statusOptions}
        />
      )}

      {/* Vue Tableau */}
      {viewMode === "table" && (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <SortableColumnHeader
                    label="Nom"
                    sortKey="name"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Email"
                    sortKey="email"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Téléphone"
                    sortKey="phone"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  {schemaConfig.map((field, index) => (
                    <SortableColumnHeader
                      key={field.key}
                      label={field.label}
                      sortKey={`custom.${field.key}`}
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className={index === 0 ? "bg-muted/30" : ""}
                    />
                  ))}
                  <SortableColumnHeader
                    label="Statut"
                    sortKey="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Assigné à"
                    sortKey="assignedTo"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableColumnHeader
                    label="Dernière activité"
                    sortKey="lastActivity"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Prochaine action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10 + schemaConfig.length}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Aucun lead trouvé
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-t hover:bg-muted/50 ${
                        selectedIds.includes(lead.id) ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={() => handleSelect(lead.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onLeadClick && onLeadClick(lead.id)}
                          className="hover:text-primary-500 transition-colors font-medium text-left"
                        >
                          {lead.standardData?.firstName} {lead.standardData?.lastName}
                        </button>
                      </td>
                      <td className="px-4 py-3">{lead.standardData?.email || "-"}</td>
                      <td className="px-4 py-3">{lead.standardData?.phone || "-"}</td>
                      {schemaConfig.map((field, index) => (
                        <td key={field.key} className={`px-4 py-3 ${index === 0 ? "bg-muted/20" : ""}`}>
                          <FieldValueDisplay
                            field={field}
                            value={lead.customData?.[field.key]}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => {
                            updateStatusMutation.mutate({ leadId: lead.id, status: value });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue>
                              {getStatusLabel(lead.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        {lead.assignedBD?.email?.split("@")[0] || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {lead.activities && lead.activities.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-text-body">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(lead.activities[0].createdAt)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-text-body">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lead.tasks && lead.tasks.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-text-body">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(lead.tasks[0].dueDate).toLocaleDateString("fr-FR")}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-text-body">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {lead.standardData?.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                window.location.href = `tel:${lead.standardData.phone}`;
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {lead.standardData?.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                window.location.href = `mailto:${lead.standardData.email}`;
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Cartes */}
      {viewMode === "card" && (
        <LeadCardView
          leads={leads}
          schemaConfig={schemaConfig}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          getStatusColor={getStatusColor}
          statusOptions={statusOptions}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {((page - 1) * limit) + 1} à{" "}
            {Math.min(page * limit, pagination.total)} sur {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
