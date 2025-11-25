"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Megaphone, Search, TrendingUp, Users, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignDialog } from "@/components/campaigns/campaign-dialog";
import { CampaignQuickViewDrawer } from "@/components/campaigns/campaign-quick-view-drawer";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { SelectableTable } from "@/components/ui/selectable-table";
import { Badge } from "@/components/ui/badge";
import { ViewToggle, type ViewMode } from "@/components/campaigns/view-toggle";
import { CampaignFiltersDrawer } from "@/components/campaigns/campaign-filters-drawer";
import type { CampaignFilter } from "@/components/campaigns/campaign-filters";
import { CampaignCardView } from "@/components/campaigns/campaign-card-view";
import { CampaignKanbanView } from "@/components/campaigns/campaign-kanban-view";
import { CampaignKpiCard } from "@/components/campaigns/campaign-kpi-card";
import type { Campaign } from "@/components/campaigns/types";

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<CampaignFilter>({});
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);
  const [quickViewCampaignId, setQuickViewCampaignId] = useState<string | null>(null);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("campaigns-view") as ViewMode;
    if (savedView && ["table", "card", "kanban"].includes(savedView)) {
      setView(savedView);
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem("campaigns-view", view);
  }, [view]);

  // Fetch accounts for filter dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  // Build API query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.length > 0) {
      params.set("status", filters.status.join(","));
    }
    if (filters.accountId) {
      params.set("accountId", filters.accountId);
    }
    if (filters.dateRange?.start) {
      params.set("dateFrom", filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      params.set("dateTo", filters.dateRange.end);
    }
    if (filters.leadCountRange?.min !== undefined) {
      params.set("leadCountMin", filters.leadCountRange.min.toString());
    }
    if (filters.leadCountRange?.max !== undefined) {
      params.set("leadCountMax", filters.leadCountRange.max.toString());
    }
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
    }
    if (filters.sortOrder) {
      params.set("sortOrder", filters.sortOrder);
    }
    return params.toString();
  }, [filters]);

  const { data: campaigns = [], isLoading, refetch } = useQuery<Campaign[]>({
    queryKey: ["campaigns", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Succès",
        description: "Campagne supprimée avec succès",
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la suppression de la campagne",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (campaignId: string) => {
    setEditingCampaignId(campaignId);
    setCampaignDialogOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setCampaignToDelete({ id: campaign.id, name: campaign.name });
    setDeleteDialogOpen(true);
  };

  const handleNewCampaign = () => {
    setEditingCampaignId(undefined);
    setCampaignDialogOpen(true);
  };

  const handleCampaignClick = (campaignId: string) => {
    setQuickViewCampaignId(campaignId);
  };

  // Filter by search query (client-side)
  const filteredCampaigns = useMemo(() => {
    let result = campaigns;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(query) ||
          campaign.account?.companyName.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [campaigns, searchQuery]);

  // Calculate stats with trends
  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === "Active").length;
    const totalLeads = campaigns.reduce((sum, c) => sum + (c._count?.leads || 0), 0);
    
    // Calculate trends (simplified - in production would compare with previous period)
    const previousActive = Math.floor(activeCampaigns * 0.9); // Mock previous value
    const activeTrend = previousActive > 0 
      ? ((activeCampaigns - previousActive) / previousActive) * 100 
      : activeCampaigns > 0 ? 100 : 0;

    const previousLeads = Math.floor(totalLeads * 0.85); // Mock previous value
    const leadsTrend = previousLeads > 0
      ? ((totalLeads - previousLeads) / previousLeads) * 100
      : totalLeads > 0 ? 100 : 0;

    return { 
      totalCampaigns, 
      activeCampaigns, 
      totalLeads,
      activeTrend,
      leadsTrend,
    };
  }, [campaigns]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success-100 text-success-text";
      case "Paused":
        return "bg-warning-100 text-warning-500";
      case "Draft":
        return "bg-muted text-muted-foreground";
      case "Completed":
        return "bg-info-100 text-info-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Campagnes</h1>
          <p className="text-body text-text-body mt-2">
            Gérez les campagnes commerciales
          </p>
        </div>
        <Button onClick={handleNewCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Enhanced KPI Cards with Trends */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <CampaignKpiCard
          title="Total des campagnes"
          value={stats.totalCampaigns}
          icon={Megaphone}
          colorClass="text-primary-500"
          iconBgColor="bg-gradient-to-br from-primary-100 to-primary-50"
        />
        <CampaignKpiCard
          title="Campagnes actives"
          value={stats.activeCampaigns}
          icon={TrendingUp}
          trend={stats.activeTrend}
          subtitle={`${stats.activeCampaigns > 0 ? '+' : ''}${stats.activeTrend.toFixed(1)}% vs période précédente`}
          colorClass="text-success-text"
          iconBgColor="bg-gradient-to-br from-success-100 to-[#D1FAE5]"
        />
        <CampaignKpiCard
          title="Total des leads"
          value={stats.totalLeads}
          icon={Users}
          trend={stats.leadsTrend}
          subtitle={`${stats.leadsTrend > 0 ? '+' : ''}${stats.leadsTrend.toFixed(1)}% vs période précédente`}
          colorClass="text-info-500"
          iconBgColor="bg-gradient-to-br from-info-light to-[#DBEAFE]"
        />
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-body" />
            <Input
              placeholder="Rechercher des campagnes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <CampaignFiltersDrawer
              filters={filters}
              onFiltersChange={setFilters}
              accounts={accounts}
            />
            <ViewToggle
              view={view}
              onViewChange={setView}
              availableViews={["table", "card", "kanban"]}
            />
          </div>
          
          {/* Active Filter Badges */}
          {(filters.status && filters.status.length > 0) || filters.accountId ? (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.status && filters.status.length > 0 && (
                <>
                  {filters.status.map((status) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="gap-1"
                    >
                      {status}
                      <button
                        onClick={() => {
                          const newStatus = filters.status?.filter((s) => s !== status);
                          setFilters({
                            ...filters,
                            status: newStatus && newStatus.length > 0 ? newStatus : undefined,
                          });
                        }}
                        className="ml-1 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </>
              )}
              {filters.accountId && accounts.find((a) => a.id === filters.accountId) && (
                <Badge variant="secondary" className="gap-1">
                  {accounts.find((a) => a.id === filters.accountId)?.companyName}
                  <button
                    onClick={() => setFilters({ ...filters, accountId: undefined })}
                    className="ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Campaign Views */}
      {isLoading ? (
        <div className="text-center py-12 text-text-body">Chargement...</div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
            <p className="text-body text-text-body">
              {searchQuery || Object.keys(filters).length > 0
                ? "Aucune campagne trouvée correspondant à vos filtres"
                : "Aucune campagne pour le moment"}
            </p>
            {!searchQuery && Object.keys(filters).length === 0 && (
              <Button onClick={handleNewCampaign} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première campagne
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {view === "table" && (
            <SelectableTable
              data={filteredCampaigns}
              entity="campaigns"
              getItemId={(campaign) => campaign.id}
              onRefresh={() => refetch()}
              isLoading={isLoading}
              columns={[
                {
                  key: 'name',
                  label: 'Nom de la campagne',
                  render: (campaign) => (
                    <div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCampaignClick(campaign.id);
                        }}
                        className="font-medium text-text-main hover:text-primary-500 transition-colors text-left"
                      >
                        {campaign.name}
                      </button>
                      <p className="text-sm text-text-body">
                        {campaign.account?.companyName || "Aucun compte"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Statut',
                  render: (campaign) => (
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status}
                    </Badge>
                  ),
                },
                {
                  key: 'leads',
                  label: 'Leads',
                  render: (campaign) => (
                    <span className="font-medium">{campaign._count?.leads || 0}</span>
                  ),
                },
                {
                  key: 'startDate',
                  label: 'Date de début',
                  render: (campaign) => (
                    campaign.startDate 
                      ? new Date(campaign.startDate).toLocaleDateString('fr-FR')
                      : '-'
                  ),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (campaign) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">More</span>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}`}>Voir les détails</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/leads`}>Voir les leads</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/import`}>Importer CSV</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign)}
                          className="text-destructive"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
            />
          )}

          {view === "card" && (
            <CampaignCardView
              campaigns={filteredCampaigns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleCampaignClick}
            />
          )}

          {view === "kanban" && (
            <CampaignKanbanView
              campaigns={filteredCampaigns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleCampaignClick}
            />
          )}
        </>
      )}

      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={(open) => {
          setCampaignDialogOpen(open);
          if (!open) {
            setEditingCampaignId(undefined);
          }
        }}
        campaignId={editingCampaignId}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => campaignToDelete && deleteMutation.mutate(campaignToDelete.id)}
        title="Supprimer la campagne"
        description="Êtes-vous sûr de vouloir supprimer"
        itemName={campaignToDelete?.name}
      />

      <CampaignQuickViewDrawer
        open={!!quickViewCampaignId}
        onOpenChange={(open) => {
          if (!open) setQuickViewCampaignId(null);
        }}
        campaignId={quickViewCampaignId}
        onEdit={handleEdit}
      />
    </div>
  );
}
