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
  Users,
  X,
  Building2,
  Hash,
  Clock,
  Target,
} from "lucide-react";

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

type CampaignSettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  assignments: Assignment[];
};

export function CampaignSettingsDrawer({
  open,
  onOpenChange,
  campaign,
  assignments,
}: CampaignSettingsDrawerProps) {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!campaign) return null;

  const schemaConfig = campaign.schemaConfig || [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col border-l">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold truncate">
                    {campaign.name}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    {campaign.account.companyName}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 border-b flex-shrink-0">
              <TabsList className="w-full h-9 p-0.5 bg-muted/50 grid grid-cols-4">
                <TabsTrigger value="overview" className="text-xs h-8 data-[state=active]:shadow-sm">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Infos
                </TabsTrigger>
                <TabsTrigger value="statuses" className="text-xs h-8 data-[state=active]:shadow-sm">
                  <ListTodo className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Statuts
                </TabsTrigger>
                <TabsTrigger value="meetings" className="text-xs h-8 data-[state=active]:shadow-sm">
                  <Video className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  RDV
                </TabsTrigger>
                <TabsTrigger value="visits" className="text-xs h-8 data-[state=active]:shadow-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Visites
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="m-0 p-4 space-y-5">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <p className="text-lg font-semibold text-emerald-700">{campaign._count.leads}</p>
                    <p className="text-xs text-emerald-600">Leads</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-lg font-semibold text-blue-700">{assignments.length}</p>
                    <p className="text-xs text-blue-600">BDs assignés</p>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Informations
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-xs text-muted-foreground">Statut</span>
                      <Badge variant={campaign.status === "Active" ? "default" : "secondary"} className="text-[10px] h-5">
                        {campaign.status === "Active" ? "Active" : campaign.status === "Draft" ? "Brouillon" : campaign.status}
                      </Badge>
                    </div>
                    {campaign.startDate && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          Début
                        </span>
                        <span className="text-xs font-medium">
                          {new Date(campaign.startDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {schemaConfig.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Champs personnalisés
                    </h3>
                    <div className="space-y-1">
                      {schemaConfig.map((field: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
                        >
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{field.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {field.key} • {field.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned BDs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      BDs Assignés
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setAssignmentDialogOpen(true)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Gérer
                    </Button>
                  </div>
                  {assignments.length === 0 ? (
                    <div className="py-6 text-center rounded-lg bg-muted/30">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">Aucun BD assigné</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.user.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
                        >
                          {assignment.user.avatar ? (
                            <img
                              src={assignment.user.avatar}
                              alt=""
                              className="h-7 w-7 rounded-full"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-[10px] font-medium text-primary">
                                {assignment.user.email.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {assignment.user.email.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Depuis le {new Date(assignment.assignedAt).toLocaleDateString("fr-FR")}
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
