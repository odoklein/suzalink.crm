"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Users,
  Building2,
  Plus,
  X,
  Target,
  TrendingUp,
  UserCheck,
  Briefcase,
  Search,
  CheckCircle2,
  Circle,
  Filter,
  ExternalLink,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface Campaign {
  id: string;
  name: string;
  account: {
    id: string;
    companyName: string;
  };
  _count: {
    leads: number;
  };
}

interface Lead {
  id: string;
  status: string;
  standardData: any;
  customData: any;
}

interface WeeklyAssignment {
  id: string;
  userId: string;
  campaignId: string;
  weekStart: string;
  notes?: string;
  user: User;
  campaign: Campaign;
  assignedBy: {
    email: string;
  };
}

interface WeeklyPlanningData {
  assignments: WeeklyAssignment[];
  users: User[];
  campaigns: Campaign[];
  weekStart: string;
}

// Campaign colors for visual distinction
const CAMPAIGN_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
  { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
];

// Add Assignment Dialog Component
function AddAssignmentDialog({ 
  users, 
  campaigns, 
  existingAssignments,
  campaignColorMap,
  onAssign 
}: { 
  users: User[]; 
  campaigns: Campaign[];
  existingAssignments: WeeklyAssignment[];
  campaignColorMap: Map<string, typeof CAMPAIGN_COLORS[0]>;
  onAssign: (userId: string, campaignId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [searchUser, setSearchUser] = useState("");
  const [searchCampaign, setSearchCampaign] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser]);

  const filteredCampaigns = useMemo(() => {
    // Filter out campaigns already assigned to the selected user
    const userAssignedCampaigns = existingAssignments
      .filter(a => a.userId === selectedUser)
      .map(a => a.campaignId);
    
    return campaigns.filter(c => 
      c.name.toLowerCase().includes(searchCampaign.toLowerCase()) &&
      !userAssignedCampaigns.includes(c.id)
    );
  }, [campaigns, searchCampaign, selectedUser, existingAssignments]);

  const handleAssign = () => {
    if (selectedUser && selectedCampaign) {
      onAssign(selectedUser, selectedCampaign);
      setOpen(false);
      setSelectedUser("");
      setSelectedCampaign("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle assignation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle assignation</DialogTitle>
          <DialogDescription>
            Assigner une campagne à un BD pour cette semaine
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">BD *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un BD..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Aucun BD trouvé</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left",
                      selectedUser === user.id && "bg-primary/10"
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{user.email.split("@")[0]}</span>
                    {selectedUser === user.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Campagne *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={searchCampaign}
                onChange={(e) => setSearchCampaign(e.target.value)}
                className="pl-9 h-9"
                disabled={!selectedUser}
              />
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
              {!selectedUser ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Sélectionnez d'abord un BD</p>
              ) : filteredCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">
                  {searchCampaign ? "Aucune campagne trouvée" : "Toutes les campagnes sont assignées"}
                </p>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const colors = campaignColorMap.get(campaign.id);
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left",
                        selectedCampaign === campaign.id && "bg-primary/10"
                      )}
                    >
                      <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", colors?.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{campaign.account.companyName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">
                        {campaign._count.leads} leads
                      </Badge>
                      {selectedCampaign === campaign.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAssign}
              disabled={!selectedUser || !selectedCampaign}
            >
              Assigner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Campaign Leads Sheet Component
function CampaignLeadsSheet({
  campaign,
  colors,
  open,
  onOpenChange,
}: {
  campaign: Campaign | null;
  colors: typeof CAMPAIGN_COLORS[0] | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchLead, setSearchLead] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["campaign-leads", campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const res = await fetch(`/api/leads?campaignId=${campaign.id}&limit=100`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.leads || [];
    },
    enabled: !!campaign?.id && open,
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const name = `${lead.standardData?.firstName || ""} ${lead.standardData?.lastName || ""}`.toLowerCase();
      const matchesSearch = name.includes(searchLead.toLowerCase()) ||
        lead.standardData?.email?.toLowerCase().includes(searchLead.toLowerCase()) ||
        lead.standardData?.company?.toLowerCase().includes(searchLead.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchLead, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    leads.forEach((lead) => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  if (!campaign) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn("h-3 w-3 rounded-full", colors?.dot)} />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold truncate">
                {campaign.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">{campaign.account.companyName}</p>
            </div>
            <Badge variant="outline" className="flex-shrink-0">
              {campaign._count.leads} leads
            </Badge>
          </div>
        </SheetHeader>

        <div className="p-3 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter("all")}
            >
              Tous ({statusCounts.all || 0})
            </Button>
            {Object.entries(statusCounts)
              .filter(([key]) => key !== "all")
              .map(([status, count]) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter(status)}
                >
                  {status} ({count})
                </Button>
              ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Target className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Aucun lead trouvé</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {(lead.standardData?.firstName?.[0] || "").toUpperCase()}
                      {(lead.standardData?.lastName?.[0] || "").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {lead.standardData?.firstName} {lead.standardData?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.standardData?.company || lead.standardData?.email || "-"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">
                    {lead.status}
                  </Badge>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function WeeklyPlanningPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0];
  });

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [leadsSheetOpen, setLeadsSheetOpen] = useState(false);

  const { data, isLoading } = useQuery<WeeklyPlanningData>({
    queryKey: ["weekly-planning", currentWeek],
    queryFn: async () => {
      const res = await fetch(`/api/planning/weekly?week=${currentWeek}`);
      if (!res.ok) throw new Error("Failed to fetch planning");
      return res.json();
    },
  });

  const createAssignment = useMutation({
    mutationFn: async ({ userId, campaignId }: { userId: string; campaignId: string }) => {
      const res = await fetch("/api/planning/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          campaignId,
          weekStart: currentWeek,
        }),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-planning", currentWeek] });
      toast({ title: "Assignation créée", description: "La campagne a été assignée au BD" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/planning/weekly/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-planning", currentWeek] });
      toast({ title: "Assignation supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Navigate weeks
  const goToPreviousWeek = () => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - 7);
    setCurrentWeek(date.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + 7);
    setCurrentWeek(date.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeek(monday.toISOString().split("T")[0]);
  };

  // Check if viewing current week
  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0] === currentWeek;
  }, [currentWeek]);

  // Group assignments by user
  const assignmentsByUser = useMemo(() => {
    if (!data?.assignments) return new Map<string, WeeklyAssignment[]>();
    
    const map = new Map<string, WeeklyAssignment[]>();
    for (const assignment of data.assignments) {
      const existing = map.get(assignment.userId) || [];
      existing.push(assignment);
      map.set(assignment.userId, existing);
    }
    return map;
  }, [data?.assignments]);

  // Campaign color mapping
  const campaignColorMap = useMemo(() => {
    const map = new Map<string, typeof CAMPAIGN_COLORS[0]>();
    data?.campaigns.forEach((campaign, index) => {
      map.set(campaign.id, CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]);
    });
    return map;
  }, [data?.campaigns]);

  const formatWeekRange = () => {
    const start = new Date(currentWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    
    const startStr = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const endStr = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} — ${endStr}`;
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  // Stats
  const stats = useMemo(() => {
    if (!data) return { totalAssignments: 0, assignedBDs: 0, totalLeads: 0, unassignedCampaigns: 0 };
    
    const assignedUserIds = new Set(data.assignments.map(a => a.userId));
    const assignedCampaignIds = new Set(data.assignments.map(a => a.campaignId));
    const totalLeads = data.assignments.reduce((sum, a) => sum + (a.campaign._count.leads || 0), 0);
    const unassignedCampaigns = data.campaigns.filter(c => !assignedCampaignIds.has(c.id)).length;
    
    return {
      totalAssignments: data.assignments.length,
      assignedBDs: assignedUserIds.size,
      totalLeads,
      unassignedCampaigns,
    };
  }, [data]);

  const handleViewLeads = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLeadsSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-sm text-muted-foreground">Chargement du planning...</p>
          </div>
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const campaigns = data?.campaigns || [];

  return (
    <TooltipProvider>
      <div className="p-6 space-y-4 max-w-[1440px] mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Planning BD</h1>
            <p className="text-sm text-muted-foreground">
              Assignation des campagnes par semaine
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Add Assignment Button */}
            <AddAssignmentDialog
              users={users}
              campaigns={campaigns}
              existingAssignments={data?.assignments || []}
              campaignColorMap={campaignColorMap}
              onAssign={(userId, campaignId) => createAssignment.mutate({ userId, campaignId })}
            />
            
            {/* Week Navigation - Compact */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 px-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatWeekRange()}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {!isCurrentWeek && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs ml-1"
                  onClick={goToCurrentWeek}
                >
                  Aujourd'hui
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-700">{stats.totalAssignments}</p>
              <p className="text-xs text-blue-600">Assignations</p>
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-700">{stats.assignedBDs}</p>
              <p className="text-xs text-emerald-600">BDs actifs</p>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-purple-700">{stats.totalLeads}</p>
              <p className="text-xs text-purple-600">Leads à traiter</p>
            </div>
          </div>
          
          <div className={cn(
            "rounded-lg p-3 flex items-center gap-3",
            stats.unassignedCampaigns > 0 ? "bg-amber-50" : "bg-slate-50"
          )}>
            <div className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center",
              stats.unassignedCampaigns > 0 ? "bg-amber-100" : "bg-slate-100"
            )}>
              <TrendingUp className={cn(
                "h-4 w-4",
                stats.unassignedCampaigns > 0 ? "text-amber-600" : "text-slate-600"
              )} />
            </div>
            <div>
              <p className={cn(
                "text-lg font-semibold",
                stats.unassignedCampaigns > 0 ? "text-amber-700" : "text-slate-700"
              )}>{stats.unassignedCampaigns}</p>
              <p className={cn(
                "text-xs",
                stats.unassignedCampaigns > 0 ? "text-amber-600" : "text-slate-600"
              )}>Non assignées</p>
            </div>
          </div>
        </div>

        {/* Main Grid - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4">
          {/* BD Assignments - Takes 2 columns */}
          <div className="col-span-2 bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Assignations BD</h2>
              </div>
              <Badge variant="secondary" className="text-xs">
                {users.length} BD{users.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aucun BD disponible</p>
                </div>
              ) : (
                users.map((user) => {
                  const userAssignments = assignmentsByUser.get(user.id) || [];
                  const totalUserLeads = userAssignments.reduce(
                    (sum, a) => sum + (a.campaign._count.leads || 0), 
                    0
                  );
                  
                  return (
                    <div key={user.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* User Avatar & Info */}
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {user.email.split("@")[0]}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {totalUserLeads} leads
                            </span>
                          </div>
                          
                          {/* Assigned Campaigns */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {userAssignments.map((assignment) => {
                              const colors = campaignColorMap.get(assignment.campaignId);
                              return (
                                <Tooltip key={assignment.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all",
                                        colors?.bg, colors?.text, colors?.border,
                                        "hover:shadow-sm"
                                      )}
                                    >
                                      <div className={cn("h-1.5 w-1.5 rounded-full", colors?.dot)} />
                                      <span className="max-w-[120px] truncate">
                                        {assignment.campaign.name}
                                      </span>
                                      <button
                                        onClick={() => deleteAssignment.mutate(assignment.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-medium">{assignment.campaign.name}</p>
                                    <p className="text-muted-foreground">
                                      {assignment.campaign.account.companyName} • {assignment.campaign._count.leads} leads
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            
                            {/* Add Campaign Button */}
                            <Select
                              value=""
                              onValueChange={(campaignId) => {
                                if (campaignId) {
                                  createAssignment.mutate({ userId: user.id, campaignId });
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 w-7 p-0 border-dashed hover:border-primary hover:bg-primary/5">
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              </SelectTrigger>
                              <SelectContent align="start">
                                {campaigns
                                  .filter(c => !userAssignments.some(a => a.campaignId === c.id))
                                  .map((campaign) => {
                                    const colors = campaignColorMap.get(campaign.id);
                                    return (
                                      <SelectItem key={campaign.id} value={campaign.id}>
                                        <div className="flex items-center gap-2">
                                          <div className={cn("h-2 w-2 rounded-full", colors?.dot)} />
                                          <span className="truncate">{campaign.name}</span>
                                          <Badge variant="outline" className="ml-auto text-[10px] h-4">
                                            {campaign._count.leads}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                {campaigns.filter(c => !userAssignments.some(a => a.campaignId === c.id)).length === 0 && (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                                    Toutes assignées
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Campaigns Overview - Takes 1 column */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium">Campagnes</h2>
              </div>
              <Badge variant="secondary" className="text-xs">
                {campaigns.length}
              </Badge>
            </div>
            
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aucune campagne active</p>
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const colors = campaignColorMap.get(campaign.id);
                  const assignedUsers = data?.assignments.filter(a => a.campaignId === campaign.id) || [];
                  const isAssigned = assignedUsers.length > 0;
                  
                  return (
                    <div 
                      key={campaign.id} 
                      className={cn(
                        "p-3 transition-colors group",
                        !isAssigned && "bg-amber-50/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn("h-2 w-2 rounded-full mt-1.5 flex-shrink-0", colors?.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate flex-1">{campaign.name}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleViewLeads(campaign)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Voir les leads</TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {campaign.account.companyName}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {campaign._count.leads} leads
                            </Badge>
                            
                            {isAssigned ? (
                              <div className="flex -space-x-1.5">
                                {assignedUsers.slice(0, 3).map((a) => (
                                  <Tooltip key={a.id}>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-5 w-5 border-2 border-background">
                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                          {getInitials(a.user.email)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      {a.user.email.split("@")[0]}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {assignedUsers.length > 3 && (
                                  <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                    <span className="text-[8px] text-muted-foreground">
                                      +{assignedUsers.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 text-amber-600 border-amber-200 bg-amber-50">
                                Non assignée
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Leads Sheet */}
      <CampaignLeadsSheet
        campaign={selectedCampaign}
        colors={selectedCampaign ? campaignColorMap.get(selectedCampaign.id) : undefined}
        open={leadsSheetOpen}
        onOpenChange={setLeadsSheetOpen}
      />
    </TooltipProvider>
  );
}
