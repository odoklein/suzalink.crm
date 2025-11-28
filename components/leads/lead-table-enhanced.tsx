"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Eye, Phone, Mail, Download, Clock, Calendar, Play, Loader2, Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import { LeadFilters, type LeadFilters as LeadFiltersType } from "./lead-filters";
import { BulkActions } from "./bulk-actions";
import { SortableColumnHeader } from "@/components/ui/sortable-column-header";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { ProspectingDrawer } from "@/components/leads/prospecting-drawer";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<LeadFiltersType>({
    search: "",
    status: [],
    assignedTo: null,
    dateFrom: null,
    dateTo: null,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);
  const [currentAutoCallLead, setCurrentAutoCallLead] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadForWorkspace, setSelectedLeadForWorkspace] = useState<string | null>(null);
  
  const limit = 25; // Reduced for better performance
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
    staleTime: 30000, // Cache for 30 seconds
  });

  const leads: Lead[] = data?.leads || [];
  const pagination = data?.pagination || { total: 0, totalPages: 0 };

  // Calculate stats - total from pagination (campaign-wide), breakdown from current page
  const stats = useMemo(() => {
    const total = pagination.total || 0;
    const newLeads = leads.filter((l) => l.status === "New").length;
    const contacted = leads.filter((l) => l.status === "Contacted").length;
    const qualified = leads.filter((l) => l.status === "Qualified").length;
    return { total, newLeads, contacted, qualified };
  }, [leads, pagination.total]);

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
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: any }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Succès", description: "Lead mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" });
    },
  });

  const handleFieldUpdate = useCallback(
    async (leadId: string, field: string, value: any, isCustom = false) => {
      // Get current lead data from cache
      const currentLead = leads.find((l) => l.id === leadId);
      if (!currentLead) return;

      const updateData: any = {};
      if (isCustom) {
        // Merge with existing customData
        updateData.customData = {
          ...(currentLead.customData || {}),
          [field]: value,
        };
      } else {
        // Merge with existing standardData
        updateData.standardData = {
          ...(currentLead.standardData || {}),
          [field]: value,
        };
      }
      await updateLeadMutation.mutateAsync({ leadId, data: updateData });
    },
    [updateLeadMutation, leads]
  );

  const handleStatusUpdate = useCallback(
    async (leadId: string, status: string) => {
      await updateLeadMutation.mutateAsync({ leadId, data: { status } });
    },
    [updateLeadMutation]
  );

  const handleExport = () => {
    const params = new URLSearchParams({ campaignId });
    if (filters.search) params.set("search", filters.search);
    if (filters.status.length > 0) {
      filters.status.forEach((status: string) => params.append("status", status));
    }
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    window.open(`/api/leads/export?${params}`, "_blank");
  };

  // Auto call functionality - integrated with drawer
  const handleAutoCallToggle = () => {
    if (!autoCallEnabled) {
      // Open drawer and start prospecting session
      setDrawerOpen(true);
      setAutoCallEnabled(true);
    } else {
      // Close drawer and stop session
      setDrawerOpen(false);
      setAutoCallEnabled(false);
      setCurrentAutoCallLead(null);
    }
  };

  const handleDrawerLeadChange = (leadId: string | null) => {
    setCurrentAutoCallLead(leadId);
    if (!leadId && autoCallEnabled) {
      // No more leads, stop auto call
      setAutoCallEnabled(false);
    }
  };

  const handleDrawerClose = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setAutoCallEnabled(false);
      setCurrentAutoCallLead(null);
      setSelectedLeadForWorkspace(null);
    }
  };

  if (isLoading && page === 1) {
    return <div className="text-center py-12">Chargement des leads...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-none border-border/70 bg-surface">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-text-body mb-1">Total Leads</p>
            <p className="text-lg font-semibold text-text-main">{stats.total.toLocaleString("fr-FR")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/70 bg-surface">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-text-body mb-1">Nouveaux</p>
            <p className="text-lg font-semibold text-info-500">{stats.newLeads}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/70 bg-surface">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-text-body mb-1">Contactés</p>
            <p className="text-lg font-semibold text-primary-500">{stats.contacted}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/70 bg-surface">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-text-body mb-1">Qualifiés</p>
            <p className="text-lg font-semibold text-success-500">{stats.qualified}</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto Lead Call Bar */}
      <div className="border border-border/60 rounded-lg bg-surface/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={autoCallEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleAutoCallToggle}
          >
            <Play className="mr-2 h-4 w-4" />
            {autoCallEnabled ? "Arrêter la session" : "Démarrer la prospection"}
          </Button>
          {currentAutoCallLead && (
            <span className="text-sm text-text-body">
              Lead actuel: {leads.find((l) => l.id === currentAutoCallLead)?.standardData?.firstName || "..."}
            </span>
          )}
        </div>
        {autoCallEnabled && (
          <Badge variant="outline" className="text-xs">
            Session active
          </Badge>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <LeadFilters
            filters={filters}
            onFiltersChange={setFilters}
            statusOptions={statusOptions}
            schemaConfig={schemaConfig}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedLeadIds={selectedIds}
          onSelectionChange={setSelectedIds}
          statusOptions={statusOptions}
        />
      )}

      {/* Table */}
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8 + schemaConfig.length} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + schemaConfig.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Aucun lead trouvé
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-t hover:bg-muted/50 cursor-pointer ${
                      selectedIds.includes(lead.id) ? "bg-primary/5" : ""
                    } ${currentAutoCallLead === lead.id ? "bg-primary/10 ring-2 ring-primary-500" : ""}`}
                    onClick={(e) => {
                      // Don't open drawer if clicking on checkbox or action buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('select')) {
                        return;
                      }
                      onLeadClick && onLeadClick(lead.id);
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(lead.id)}
                        onCheckedChange={() => handleSelect(lead.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-main font-medium hover:text-primary-600 transition-colors">
                          {`${lead.standardData?.firstName || ""} ${lead.standardData?.lastName || ""}`.trim() || "-"}
                        </span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-main">{lead.standardData?.email || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-main">{lead.standardData?.phone || "-"}</span>
                    </td>
                    {schemaConfig.map((field, index) => (
                      <td key={field.key} className={`px-4 py-3 ${index === 0 ? "bg-muted/20" : ""}`}>
                        {field ? (
                          <FieldValueDisplay field={field} value={lead.customData?.[field.key]} />
                        ) : (
                          <span className="text-sm text-text-main">{lead.customData?.[field.key] || "-"}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusUpdate(lead.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue>{getStatusLabel(lead.status)}</SelectValue>
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
                      <span className="text-sm">{lead.assignedBD?.email?.split("@")[0] || "-"}</span>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLeadForWorkspace(lead.id);
                            setDrawerOpen(true);
                          }}
                          title="Ouvrir l'espace de travail"
                        >
                          <Workflow className="h-4 w-4" />
                        </Button>
                        {lead.standardData?.phone && (
                          <ClickToDial phoneNumber={lead.standardData.phone} />
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
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages || isLoading}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Prospecting Drawer */}
      <ProspectingDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerClose}
        campaignId={campaignId}
        leadId={selectedLeadForWorkspace}
        autoAdvance={autoCallEnabled && !selectedLeadForWorkspace}
        onLeadChange={handleDrawerLeadChange}
      />
    </div>
  );
}
