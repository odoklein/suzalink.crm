"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignStatusManager } from "./campaign-status-manager";
import { CampaignMeetingTypesManager } from "./campaign-meeting-types-manager";
import { CampaignVisitDaysCalendar } from "./campaign-visit-days-calendar";
import { CampaignAssignmentDialog } from "@/components/assignments/campaign-assignment-dialog";
import {
  ListTodo,
  Calendar,
  Video,
  Settings2,
  Users,
  X,
  Building2,
  Info,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  schemaConfig: any;
  account: {
    id: string;
    companyName: string;
  };
  _count: {
    leads: number;
  };
};

type Assignment = {
  user: {
    id: string;
    email: string;
    avatar?: string | null;
  };
  assignedAt: string;
};

interface CampaignConfigurationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  assignments: Assignment[];
}

export function CampaignConfigurationDrawer({
  open,
  onOpenChange,
  campaign,
  assignments,
}: CampaignConfigurationDrawerProps) {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  if (!campaign) return null;

  const schemaConfig = campaign.schemaConfig || [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[520px] p-0 flex flex-col overflow-hidden">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold">Configuration</SheetTitle>
                  <p className="text-xs text-muted-foreground">{campaign.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 border-b flex-shrink-0">
              <TabsList className="w-full h-9 p-0.5 bg-muted/50">
                <TabsTrigger value="info" className="flex-1 text-xs h-8 data-[state=active]:shadow-sm">
                  <Info className="h-3.5 w-3.5 mr-1.5" />
                  Infos
                </TabsTrigger>
                <TabsTrigger value="statuses" className="flex-1 text-xs h-8 data-[state=active]:shadow-sm">
                  <ListTodo className="h-3.5 w-3.5 mr-1.5" />
                  Statuts
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex-1 text-xs h-8 data-[state=active]:shadow-sm">
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  RDV
                </TabsTrigger>
                <TabsTrigger value="visits" className="flex-1 text-xs h-8 data-[state=active]:shadow-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Visites
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Info Tab */}
              <TabsContent value="info" className="m-0 p-4 space-y-4">
                {/* Campaign Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Informations
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Nom</span>
                      <span className="text-sm font-medium">{campaign.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Compte</span>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{campaign.account.companyName}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Statut</span>
                      <Badge variant={campaign.status === "Active" ? "default" : "secondary"} className="text-xs">
                        {campaign.status === "Active" ? "Active" : campaign.status === "Draft" ? "Brouillon" : campaign.status}
                      </Badge>
                    </div>
                    {campaign.startDate && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <span className="text-sm text-muted-foreground">Début</span>
                        <span className="text-sm font-medium">
                          {new Date(campaign.startDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Leads</span>
                      <Badge variant="outline" className="text-xs">{campaign._count.leads}</Badge>
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Champs personnalisés
                  </h3>
                  {schemaConfig.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun champ défini</p>
                  ) : (
                    <div className="space-y-1.5">
                      {schemaConfig.map((field: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{field.label}</p>
                            <p className="text-xs text-muted-foreground">{field.key} • {field.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned BDs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      BDs assignés
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAssignmentDialogOpen(true)}>
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Gérer
                    </Button>
                  </div>
                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun BD assigné</p>
                  ) : (
                    <div className="space-y-1.5">
                      {assignments.map((assignment) => (
                        <div key={assignment.user.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
                          {assignment.user.avatar ? (
                            <img src={assignment.user.avatar} alt="" className="h-7 w-7 rounded-full" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{assignment.user.email.split("@")[0]}</p>
                            <p className="text-xs text-muted-foreground">
                              Assigné le {new Date(assignment.assignedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Statuses Tab */}
              <TabsContent value="statuses" className="m-0 p-4">
                <CampaignStatusManager campaignId={campaign.id} />
              </TabsContent>

              {/* Meeting Types Tab */}
              <TabsContent value="meetings" className="m-0 p-4">
                <CampaignMeetingTypesManager campaignId={campaign.id} />
              </TabsContent>

              {/* Visits Tab */}
              <TabsContent value="visits" className="m-0 p-4">
                <CampaignVisitDaysCalendar campaignId={campaign.id} />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      <CampaignAssignmentDialog
        campaignId={campaign.id}
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
      />
    </>
  );
}

