"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, FileText, PhoneCall, Clock, MessageSquare, CheckCircle, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LeadScoringCard } from "@/components/leads/lead-scoring-card";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import { useState } from "react";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { ScheduleMeetingDialog } from "@/components/bookings/schedule-meeting-dialog";
import { LeadActivityTimelineDrawer } from "@/components/leads/lead-activity-timeline-drawer";
import { LeadQuickActionsDrawer } from "@/components/leads/lead-quick-actions-drawer";
import { PanelRight, Activity } from "lucide-react";

type Lead = {
  id: string;
  status: string;
  campaignId: string;
  standardData: any;
  customData: any;
  campaign?: {
    name: string;
    schemaConfig?: any[];
  };
  activities?: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata?: any;
    user?: {
      email: string;
    };
  }>;
};

type LeadDetailContentProps = {
  leadId: string;
  initialLead: Lead;
};

export function LeadDetailContent({ leadId, initialLead }: LeadDetailContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [quickActionsDrawerOpen, setQuickActionsDrawerOpen] = useState(false);

  const { data: lead = initialLead } = useQuery<Lead>({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    initialData: initialLead,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast({ title: "Success", description: "Status updated" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          type: "NOTE",
          metadata: { note },
        }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      setNote("");
      toast({ title: "Success", description: "Note added" });
    },
  });

  const standardData = lead.standardData || {};
  const customData = lead.customData || {};
  const schemaConfig = lead.campaign?.schemaConfig || [];

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/campaigns/${lead.campaignId}?tab=leads`}>
          <Button variant="ghost" size="icon" className="hover:bg-primary-50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-main tracking-[-0.5px]">
            {standardData.firstName} {standardData.lastName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{lead.campaign?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setQuickActionsDrawerOpen(true)}
            title="Quick actions"
            className="hover:border-primary-200 hover:bg-primary-50/30"
          >
            <PanelRight className="mr-2 h-4 w-4" />
            Actions
          </Button>
          {standardData.phone && (
            <ClickToDial phoneNumber={standardData.phone} />
          )}
          {standardData.email && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/inbox/compose?leadId=${leadId}`)}
              className="hover:border-primary-200 hover:bg-primary-50/30"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          )}
          <ScheduleMeetingDialog
            leadId={leadId}
            leadName={`${standardData.firstName} ${standardData.lastName}`}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-50/30 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                  <p className="text-sm font-medium text-text-main mt-1">{standardData.email || "-"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</Label>
                  <p className="text-sm font-medium text-text-main mt-1">{standardData.phone || "-"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Poste</Label>
                  <p className="text-sm font-medium text-text-main mt-1">{standardData.jobTitle || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {schemaConfig.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  Champs personnalisés
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {schemaConfig.map((field: any) => (
                  <div key={field.key} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </Label>
                    <div className="mt-2">
                      <FieldValueDisplay field={field} value={customData[field.key]} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Historique des activités</CardTitle>
                    <CardDescription>Historique complet des interactions</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivityDrawerOpen(true)}
                  title="View full timeline"
                  className="hover:bg-green-50"
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!lead.activities || lead.activities.length === 0 ? (
                <EmptyState
                  illustration="/illustrations/empty-activities.svg"
                  title="Aucune activité"
                  description="Commencez par passer un appel ou envoyer un email."
                  size="sm"
                />
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-200 via-green-200 to-purple-200" />
                  
                  <div className="space-y-4">
                    {lead.activities?.map((activity: any) => {
                      const activityIcon = {
                        CALL: <PhoneCall className="h-4 w-4" />,
                        EMAIL: <Mail className="h-4 w-4" />,
                        NOTE: <MessageSquare className="h-4 w-4" />,
                        STATUS_CHANGE: <CheckCircle className="h-4 w-4" />,
                      }[activity.type] || <FileText className="h-4 w-4" />;

                      const activityColor = {
                        CALL: "bg-gradient-to-br from-blue-500 to-blue-600",
                        EMAIL: "bg-gradient-to-br from-green-500 to-green-600",
                        NOTE: "bg-gradient-to-br from-yellow-500 to-yellow-600",
                        STATUS_CHANGE: "bg-gradient-to-br from-purple-500 to-purple-600",
                      }[activity.type] || "bg-gray-500";

                      const activityLabel = {
                        CALL: "Appel",
                        EMAIL: "Email",
                        NOTE: "Note",
                        STATUS_CHANGE: "Changement de statut",
                      }[activity.type] || activity.type;

                      return (
                        <div key={activity.id} className="relative pl-10">
                          <div className={`absolute left-0 top-1 w-8 h-8 rounded-xl ${activityColor} flex items-center justify-center text-white shadow-lg z-10`}>
                            {activityIcon}
                          </div>
                          
                          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-text-main">
                                  {activityLabel}
                                </p>
                                <p className="text-xs text-text-body">
                                  par {activity.user?.email || 'Système'}
                                </p>
                              </div>
                              <p className="text-xs text-text-body flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                <Clock className="h-3 w-3" />
                                {new Date(activity.createdAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            
                            {activity.metadata?.note && (
                              <p className="text-sm text-text-main mt-2 bg-gray-50 p-3 rounded-lg border-l-2 border-primary-300">
                                {activity.metadata.note}
                              </p>
                            )}
                            
                            {activity.metadata?.outcome && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-100 text-primary-700">
                                  {activity.metadata.outcome}
                                </span>
                              </div>
                            )}
                            
                            {activity.metadata?.oldStatus && activity.metadata?.newStatus && (
                              <p className="text-sm text-text-body mt-2">
                                Statut changé de <span className="font-medium">{activity.metadata.oldStatus}</span> à <span className="font-medium text-primary-500">{activity.metadata.newStatus}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadScoringCard leadId={leadId} />

          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut</Label>
                <Select
                  value={lead.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">Nouveau</SelectItem>
                    <SelectItem value="Locked">Verrouillé</SelectItem>
                    <SelectItem value="Contacted">Contacté</SelectItem>
                    <SelectItem value="Qualified">Qualifié</SelectItem>
                    <SelectItem value="Nurture">Nourri</SelectItem>
                    <SelectItem value="Lost">Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Ajouter une note</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ajouter une note..."
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!note.trim()}
                  className="w-full h-11 transition-all hover:scale-[1.01]"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ajouter la note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadActivityTimelineDrawer
        open={activityDrawerOpen}
        onOpenChange={setActivityDrawerOpen}
        activities={lead?.activities || []}
        leadName={`${standardData.firstName} ${standardData.lastName}`}
      />

      <LeadQuickActionsDrawer
        open={quickActionsDrawerOpen}
        onOpenChange={setQuickActionsDrawerOpen}
        leadId={leadId}
        leadName={`${standardData.firstName} ${standardData.lastName}`}
        phone={standardData.phone}
        email={standardData.email}
        campaignId={lead?.campaignId}
      />
    </div>
  );
}

