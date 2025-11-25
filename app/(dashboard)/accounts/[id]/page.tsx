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
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactPortalDialog } from "@/components/accounts/contact-portal-dialog";
import { ContactBookingDialog } from "@/components/accounts/contact-booking-dialog";

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
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
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
        {/* Enhanced Company Information Card */}
        <Card className="group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom de l'entreprise</label>
              <p className="text-body font-medium">{account.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut du contrat</label>
              <div className="mt-1">
                <Badge
                  className={cn(
                    "capitalize",
                    account.contractStatus.toLowerCase() === "active" &&
                      "bg-green-100 text-green-700 border-green-200 animate-pulse"
                  )}
                >
                  {account.contractStatus === "Active" ? "Actif" : account.contractStatus === "Inactive" ? "Inactif" : account.contractStatus === "Pending" ? "En attente" : account.contractStatus}
                </Badge>
              </div>
            </div>
            {account.logoUrl && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Logo</label>
                <div className="mt-2 group/logo">
                  <img
                    src={account.logoUrl}
                    alt={account.companyName}
                    className="h-20 w-20 rounded-lg object-cover transition-transform duration-300 group-hover/logo:scale-110"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Campaigns Card */}
        <Card className="group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Campagnes</CardTitle>
            <CardDescription>{account.campaigns.length} campagne{account.campaigns.length !== 1 ? "s" : ""} au total</CardDescription>
          </CardHeader>
          <CardContent>
            {account.campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50 animate-bounce" />
                <p className="text-body text-muted-foreground mb-4">Aucune campagne pour le moment</p>
                <Link href={`/campaigns/new?accountId=${accountId}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une campagne
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {account.campaigns.map((campaign, index) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className={cn(
                      "block rounded-lg border p-3 transition-all duration-300 hover:bg-accent hover:shadow-md",
                      "animate-in slide-in-from-right-4 fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium">{campaign.name}</span>
                        {campaign._count && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign._count.leads} prospect{campaign._count.leads !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          campaign.status === "Active" && "bg-green-100 text-green-700"
                        )}
                      >
                        {campaign.status === "Active" ? "Active" : campaign.status === "Draft" ? "Brouillon" : campaign.status === "Paused" ? "En pause" : campaign.status}
                      </Badge>
                    </div>
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
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
                      "hover:bg-accent hover:shadow-sm group/item",
                      "animate-in slide-in-from-right-4 fade-in"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                      {getInitials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      {contact.position && (
                        <p className="text-xs text-muted-foreground">{contact.position}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs text-muted-foreground hover:text-primary-600 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-xs text-muted-foreground hover:text-primary-600 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Portal Status Badge */}
                      {contact.portalEnabled && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Portail</span>
                        </div>
                      )}
                      
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
                        {/* Book Meeting Button (only for portal-enabled contacts) */}
                        {contact.portalEnabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact(contact);
                              setBookingDialogOpen(true);
                            }}
                            title="Réserver un rendez-vous"
                          >
                            <CalendarDays className="h-4 w-4 text-primary-600" />
                          </Button>
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
                        
                        {contact.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`mailto:${contact.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {contact.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={`tel:${contact.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
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
      <ContactBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        contact={selectedContact}
      />
    </div>
  );
}
