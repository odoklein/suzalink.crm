"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Megaphone, ArrowRight, Search, Filter, Plus, 
  ChevronDown, Building2, Users, Target
} from "lucide-react";
import { BentoCard, BentoCardHeader, BentoCardContent } from "@/components/dashboard/shared/bento-card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  status: string;
  accountName: string;
  leadCount: number;
}

interface CampaignBooking {
  name: string;
  count: number;
}

interface CampaignListProps {
  campaigns: Campaign[] | undefined;
  byCampaign: CampaignBooking[] | undefined;
  totalCampaigns: number;
  activeCampaigns: number;
}

export function CampaignList({ 
  campaigns, 
  byCampaign,
  totalCampaigns,
  activeCampaigns
}: CampaignListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "leads" | "rdv">("leads");

  // Get RDV count for a campaign
  const getRdvCount = (campaignName: string) => {
    return byCampaign?.find(c => c.name === campaignName)?.count ?? 0;
  };

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    ?.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           campaign.accountName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "leads") return b.leadCount - a.leadCount;
      if (sortBy === "rdv") return getRdvCount(b.name) - getRdvCount(a.name);
      return 0;
    }) || [];

  // Get unique statuses
  const statuses = [...new Set(campaigns?.map(c => c.status) || [])];

  return (
    <div className="space-y-4">
      {/* Campaign Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalCampaigns}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Actives</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{activeCampaigns}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Leads total</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {campaigns?.reduce((sum, c) => sum + c.leadCount, 0) ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-cyan-600" />
            <span className="text-xs font-medium text-cyan-700">Comptes</span>
          </div>
          <p className="text-2xl font-bold text-cyan-900">
            {new Set(campaigns?.map(c => c.accountName)).size}
          </p>
        </div>
      </div>

      {/* Search, Filters and Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher campagne ou compte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            {statuses.map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              >
                {status}
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Trier par
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Nom
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("leads")}>
                Nombre de leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("rdv")}>
                Nombre de RDV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm" className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      {/* Campaign List */}
      <BentoCard size="full" gradient="blue" delay={0} className="min-h-0">
        <BentoCardHeader
          icon={<Megaphone className="h-4 w-4 text-blue-600" />}
          title="Campagnes"
          subtitle={`${filteredCampaigns.length} campagnes`}
          iconBg="bg-blue-100"
          action={
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        />
        <BentoCardContent>
          {filteredCampaigns.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredCampaigns.map((campaign) => {
                const rdvCount = getRdvCount(campaign.name);
                const isActive = campaign.status === "Active";
                
                return (
                  <Link 
                    key={campaign.id} 
                    href={`/campaigns/${campaign.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isActive ? "bg-green-500" : "bg-gray-300"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {campaign.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              {campaign.accountName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {campaign.leadCount} leads
                        </Badge>
                        {rdvCount > 0 && (
                          <Badge className="text-[10px] h-5 px-1.5 bg-cyan-100 text-cyan-700 border-cyan-200">
                            {rdvCount} RDV
                          </Badge>
                        )}
                        <Badge 
                          className={cn(
                            "text-[10px] h-5 px-1.5",
                            isActive 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <Megaphone className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter ? "Aucun résultat" : "Aucune campagne"}
              </p>
              <Link href="/campaigns/new" className="mt-3">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Créer une campagne
                </Button>
              </Link>
            </div>
          )}
        </BentoCardContent>
      </BentoCard>
    </div>
  );
}

// Skeleton loader
export function CampaignListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
