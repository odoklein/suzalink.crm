"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { CampaignAssignmentDialog } from "@/components/assignments/campaign-assignment-dialog";

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

type CampaignSettingsProps = {
  campaign: Campaign;
  assignments: Assignment[];
};

export function CampaignSettings({ campaign, assignments }: CampaignSettingsProps) {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const schemaConfig = campaign.schemaConfig || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Campaign Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text-main">Campaign Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-body">Campaign Name</label>
            <p className="text-body text-text-main">{campaign.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-body">Account</label>
            <p className="text-body text-text-main">{campaign.account.companyName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-body">Status</label>
            <p className="text-body capitalize text-text-main">{campaign.status}</p>
          </div>
          {campaign.startDate && (
            <div>
              <label className="text-sm font-medium text-text-body">Start Date</label>
              <p className="text-body text-text-main">
                {new Date(campaign.startDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-text-body">Total Leads</label>
            <p className="text-body text-text-main">{campaign._count.leads}</p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text-main">Custom Fields Schema</CardTitle>
          <CardDescription className="text-text-body">
            {schemaConfig.length} custom field{schemaConfig.length !== 1 ? "s" : ""} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schemaConfig.length === 0 ? (
            <p className="text-body text-text-body">No custom fields defined</p>
          ) : (
            <div className="space-y-2">
              {schemaConfig.map((field: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-text-main">{field.label}</p>
                    <p className="text-sm text-text-body">
                      {field.key} • {field.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned BDs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-text-main">Assigned BDs</CardTitle>
              <CardDescription className="text-text-body">
                {assignments.length} BD{assignments.length !== 1 ? "s" : ""} assigned
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignmentDialogOpen(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-body text-text-body">No BDs assigned yet</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment: Assignment) => (
                <div
                  key={assignment.user.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {assignment.user.avatar ? (
                    <img
                      src={assignment.user.avatar}
                      alt={assignment.user.email}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                      <Users className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-text-main">{assignment.user.email}</p>
                    <p className="text-xs text-text-body">
                      Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignAssignmentDialog
        campaignId={campaign.id}
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
      />
    </div>
  );
}




