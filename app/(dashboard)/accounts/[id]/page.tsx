"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AccountAssignmentDialog } from "@/components/assignments/account-assignment-dialog";
import { FileManager } from "@/components/accounts/file-manager";
import { AccountHeaderEnhanced } from "@/components/accounts/account-header-enhanced";
import { AccountKPIWidgets } from "@/components/accounts/account-kpi-widgets";
import { AccountCharts } from "@/components/accounts/account-charts";
import { AccountActivityFeed } from "@/components/accounts/account-activity-feed";
import { ContactDialog } from "@/components/accounts/contact-dialog";
import {
  Users,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  Megaphone,
  Link2,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactPortalDialog } from "@/components/accounts/contact-portal-dialog";

type Account = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  contractStatus: string;
  guestToken: string;
  createdAt: string;
  updatedAt: string;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    _count?: { leads: number };
  }>;
  interlocuteurs: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    portalEnabled?: boolean;
    lastPortalAccess?: string | null;
  }>;
};

type StatsData = {
  totalLeads: number;
  activeCampaigns: number;
  contactRate: number;
  conversionRate: number;
  recentActivityCount: number;
  averageResponseTime: number;
  leadsByStatus: Record<string, number>;
  trends: {
    leads: { current: number; previous: number; change: number; isPositive: boolean };
    activities: { current: number; previous: number; change: number; isPositive: boolean };
  };
  recentActivities: Array<{
    id: string;
    type: string;
    createdAt: string;
    leadId: string;
    campaignName: string;
    userEmail: string;
  }>;
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const accountId = params.id as string;
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Account["interlocuteurs"][0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);

  const { data: account, isLoading: accountLoading } = useQuery<Account>({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) throw new Error("Échec du chargement du compte");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["account-stats", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}/stats`);
      if (!res.ok) throw new Error("Échec du chargement des statistiques");
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["account-assignments", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}/assign`);
      if (!res.ok) throw new Error("Échec du chargement des assignations");
      return res.json();
    },
  });

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte ?")) return;

    try {
      const res = await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec de la suppression");
      toast({ title: "Succès", description: "Compte supprimé" });
      router.push("/accounts");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du compte",
        variant: "destructive",
      });
    }
  };

  const handleCopyToken = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.guestToken);
      setCopiedToken(true);
      toast({ title: "Copié !", description: "Token invité copié dans le presse-papiers" });
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la copie du token",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredContacts = account?.interlocuteurs.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
  ) || [];

  const lastActivity = stats?.recentActivities[0]?.createdAt || account?.updatedAt;

  if (accountLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!account) {
    return <div className="p-6">Compte introuvable</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Enhanced Header */}
      <AccountHeaderEnhanced
        companyName={account.companyName}
        contractStatus={account.contractStatus}
        guestToken={account.guestToken}
        lastActivity={lastActivity}
        accountId={accountId}
        onDelete={handleDelete}
      />


      {/* KPI Widgets */}
      <AccountKPIWidgets
        accountId={accountId}
        data={stats}
        isLoading={statsLoading}
      />

      {/* Charts */}
      {stats && (
        <AccountCharts
          accountId={accountId}
          data={{
            leadsByStatus: stats.leadsByStatus,
            activityTimeline: undefined, // Will be generated if needed
          }}
          isLoading={statsLoading}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enhanced Company Information Card - Compact */}
        <Card className="group transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Entreprise</label>
              <p className="text-sm font-medium mt-0.5">{account.companyName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    account.contractStatus.toLowerCase() === "active" &&
                      "bg-green-50 text-green-700 border-green-200"
                  )}
                >
                  {account.contractStatus === "Active" ? "Actif" : account.contractStatus === "Inactive" ? "Inactif" : account.contractStatus === "Pending" ? "En attente" : account.contractStatus}
                </Badge>
              </div>
            </div>
            {account.logoUrl && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Logo</label>
                <div className="mt-1">
                  <img
                    src={account.logoUrl}
                    alt={account.companyName}
                    className="h-12 w-12 rounded object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Calendar Integration Section */}
            <div className="pt-2 border-t">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Intégrations calendrier
              </label>
              <div className="space-y-2">
                {account.interlocuteurs.map((contact: any) => {
                  const hasCalendar = contact.calendarIntegrations && contact.calendarIntegrations.length > 0;
                  return (
                    <div key={contact.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{contact.name}</span>
                      {hasCalendar ? (
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Connecté
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            // TODO: Open calendar connection dialog
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "La connexion de calendrier sera disponible prochainement",
                            });
                          }}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Connecter
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Campaigns Card - Compact Table */}
        <Card className="group transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Campagnes</CardTitle>
                <CardDescription className="text-xs">{account.campaigns.length} campagne{account.campaigns.length !== 1 ? "s" : ""}</CardDescription>
              </div>
              <Link href={`/campaigns/new?accountId=${accountId}`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Nouvelle
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {account.campaigns.length === 0 ? (
              <div className="text-center py-6">
                <Megaphone className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground mb-3">Aucune campagne</p>
                <Link href={`/campaigns/new?accountId=${accountId}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-3 w-3" />
                    Créer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {account.campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between rounded border p-2 hover:bg-accent transition-colors text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{campaign.name}</span>
                      {campaign._count && (
                        <span className="text-xs text-muted-foreground">
                          {campaign._count.leads} prospect{campaign._count.leads !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs ml-2",
                        campaign.status === "Active" && "bg-green-50 text-green-700 border-green-200"
                      )}
                    >
                      {campaign.status === "Active" ? "Active" : campaign.status === "Draft" ? "Brouillon" : campaign.status === "Paused" ? "En pause" : campaign.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Contacts Card */}
        <Card className="md:col-span-2 group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>
                  {account.interlocuteurs.length} contact{account.interlocuteurs.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setContactDialogOpen(true)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un contact
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {account.interlocuteurs.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50 animate-bounce" />
                <p className="text-body text-muted-foreground mb-4">
                  {searchQuery ? "Aucun contact trouvé" : "Aucun contact pour le moment"}
                </p>
                {!searchQuery && (
                  <Button size="sm" onClick={() => setContactDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter un contact
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="rounded-lg border transition-all"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 transition-all",
                        "hover:bg-accent group/item"
                      )}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-xs flex-shrink-0">
                        {getInitials(contact.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {contact.email && (
                            <span className="text-xs text-muted-foreground truncate">{contact.email}</span>
                          )}
                          {contact.phone && (
                            <span className="text-xs text-muted-foreground">{contact.phone}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {contact.portalEnabled && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Portail
                          </Badge>
                        )}
                        
                        {/* Portal Access Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setPortalDialogOpen(true);
                          }}
                          title="Accès au portail"
                        >
                          <Link2 className={cn(
                            "h-4 w-4",
                            contact.portalEnabled ? "text-emerald-600" : "text-slate-400"
                          )} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Assigned BDs Card */}
        <Card className="group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>BDs assignés</CardTitle>
                <CardDescription>
                  {assignments.length} BD{assignments.length !== 1 ? "s" : ""} assigné{assignments.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentDialogOpen(true)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Users className="mr-2 h-4 w-4" />
                Gérer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-body text-muted-foreground mb-4">Aucun BD assigné pour le moment</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAssignmentDialogOpen(true)}
                >
                  Assigner un BD
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment: any, index: number) => (
                  <div
                    key={assignment.user.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
                      "hover:bg-accent hover:shadow-sm",
                      "animate-in slide-in-from-right-4 fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {assignment.user.avatar ? (
                      <img
                        src={assignment.user.avatar}
                        alt={assignment.user.email}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                        {getInitials(assignment.user.email)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{assignment.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigné le {new Date(assignment.assignedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      {stats && (
        <AccountActivityFeed
          accountId={accountId}
          activities={stats.recentActivities}
          isLoading={statsLoading}
        />
      )}

      {/* File Manager */}
      <FileManager accountId={accountId} />

      {/* Dialogs */}
      <AccountAssignmentDialog
        accountId={accountId}
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
      />
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        accountId={accountId}
      />
      <ContactPortalDialog
        open={portalDialogOpen}
        onOpenChange={setPortalDialogOpen}
        contact={selectedContact}
        accountId={accountId}
      />
    </div>
  );
}
