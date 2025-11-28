"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusManager } from "./campaign-status-manager";
import { CampaignMeetingTypesManager } from "./campaign-meeting-types-manager";
import { CampaignVisitDaysCalendar } from "./campaign-visit-days-calendar";
import {
  ListTodo,
  Calendar,
  Video,
  Settings2,
} from "lucide-react";

interface CampaignConfigurationPanelProps {
  campaignId: string;
}

export function CampaignConfigurationPanel({ campaignId }: CampaignConfigurationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Configuration de la campagne
        </CardTitle>
        <CardDescription>
          Configurez les statuts, types de RDV et le calendrier des visites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="statuses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statuses" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Statuts</span>
            </TabsTrigger>
            <TabsTrigger value="meeting-types" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Types RDV</span>
            </TabsTrigger>
            <TabsTrigger value="visit-days" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Visites</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statuses">
            <CampaignStatusManager campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="meeting-types">
            <CampaignMeetingTypesManager campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="visit-days">
            <CampaignVisitDaysCalendar campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

