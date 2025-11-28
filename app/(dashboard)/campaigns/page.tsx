"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Search,
  Megaphone,
  TrendingUp,
  Users,
  Filter,
  X,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { CampaignDialog } from "@/components/campaigns/campaign-dialog";
import {
  CampaignCardEnhanced,
  CampaignCardSkeleton,
} from "@/components/campaigns/campaign-card-enhanced";
import { FloatingCreateButton } from "@/components/campaigns/floating-action-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Draft" | "Completed";
  startDate: string | null;
  account: {
    id: string;
    companyName: string;
  };
  _count?: {
    leads: number;
  };
};

const STATUS_OPTIONS = [
  { value: "Active", label: "Active", color: "bg-emerald-500" },
  { value: "Paused", label: "En pause", color: "bg-amber-500" },
  { value: "Draft", label: "Brouillon", color: "bg-gray-400" },
  { value: "Completed", label: "Terminée", color: "bg-blue-500" },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Delete mutation
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

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    let result = campaigns;

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((c) => statusFilter.includes(c.status));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.account?.companyName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [campaigns, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "Active").length;
    const totalLeads = campaigns.reduce((sum, c) => sum + (c._count?.leads || 0), 0);
    const avgLeads = total > 0 ? Math.round(totalLeads / total) : 0;

    return { total, active, totalLeads, avgLeads };
  }, [campaigns]);

  // Handlers
  const handleEdit = (campaignId: string) => {
    setEditingCampaignId(campaignId);
    setCampaignDialogOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setCampaignToDelete({ id: campaign.id, name: campaign.name });
    setDeleteDialogOpen(true);
  };

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`);
  };

  const handleNewCampaign = () => {
    setEditingCampaignId(undefined);
    setCampaignDialogOpen(true);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter.length > 0 || searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white">
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gérez vos campagnes commerciales et suivez leurs performances
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Campagnes",
                value: stats.total,
                icon: Megaphone,
                color: "text-primary-500",
                bg: "bg-primary-50",
              },
              {
                label: "Actives",
                value: stats.active,
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Total Leads",
                value: stats.totalLeads,
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Moy. par Campagne",
                value: stats.avgLeads,
                icon: CheckCircle2,
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white",
                  "transition-all duration-300 hover:shadow-md hover:border-gray-200",
                  "animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Row */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des campagnes ou comptes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-primary-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 rounded-xl gap-2 transition-all duration-150",
                    statusFilter.length > 0 && "border-primary-300 bg-primary-50 shadow-sm shadow-primary-100"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Statut
                  {statusFilter.length > 0 && (
                    <Badge className="h-5 px-1.5 text-xs bg-primary-500 animate-in zoom-in-75 duration-150">
                      {statusFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.value}
                    checked={statusFilter.includes(status.value)}
                    onCheckedChange={() => toggleStatusFilter(status.value)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn("w-2 h-2 rounded-full", status.color)} />
                      {status.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter([])}>
                      <X className="h-4 w-4 opacity-60" />
                      Effacer la sélection
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear all filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1.5" />
                Effacer les filtres
              </Button>
            )}

            {/* Results count */}
            <div className="ml-auto text-sm text-gray-500">
              {filteredCampaigns.length} campagne{filteredCampaigns.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          // Loading skeleton grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <CampaignCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Megaphone className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? "Aucune campagne ne correspond à vos filtres" : "Aucune campagne pour le moment"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              {hasActiveFilters
                ? "Essayez d'ajuster vos critères de recherche ou de filtre."
                : "Créez votre première campagne pour commencer à suivre vos leads et conversions."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Effacer tous les filtres
              </Button>
            ) : (
              <Button onClick={handleNewCampaign}>Créer votre première campagne</Button>
            )}
          </div>
        ) : (
          // Campaign cards grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((campaign, index) => (
              <CampaignCardEnhanced
                key={campaign.id}
                campaign={campaign}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClick={handleCampaignClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <FloatingCreateButton onClick={handleNewCampaign} label="Nouvelle Campagne" />

      {/* Dialogs */}
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
    </div>
  );
}
