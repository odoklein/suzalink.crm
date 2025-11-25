"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CampaignHealthIndicator, calculateCampaignHealth } from "./campaign-health-indicator";
import { Users, Calendar } from "lucide-react";
import type { Campaign } from "./types";

type CampaignKanbanViewProps = {
  campaigns: Campaign[];
  onEdit?: (campaignId: string) => void;
  onDelete?: (campaign: Campaign) => void;
  onView?: (campaignId: string) => void;
};

const STATUS_COLUMNS = [
  { id: "Draft", label: "Draft", color: "bg-muted" },
  { id: "Active", label: "Active", color: "bg-success-100" },
  { id: "Paused", label: "Paused", color: "bg-warning-100" },
  { id: "Completed", label: "Completed", color: "bg-info-100" },
];

export function CampaignKanbanView({
  campaigns,
  onEdit,
  onDelete,
  onView,
}: CampaignKanbanViewProps) {
  const campaignsByStatus = STATUS_COLUMNS.reduce((acc, column) => {
    acc[column.id] = campaigns.filter((c) => c.status === column.id);
    return acc;
  }, {} as Record<string, Campaign[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success-100 text-success-text border-success-200";
      case "Paused":
        return "bg-warning-100 text-warning-500 border-warning-200";
      case "Draft":
        return "bg-muted text-muted-foreground border-border";
      case "Completed":
        return "bg-info-100 text-info-500 border-info-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCampaignHealth = (campaign: Campaign) => {
    const leadCount = campaign._count?.leads || 0;
    const health = calculateCampaignHealth({
      contactRate: campaign.status === "Active" ? 60 : 0,
      conversionRate: campaign.status === "Active" ? 10 : 0,
      activityFrequency: campaign.status === "Active" ? 5 : 0,
      bdCoverage: 70,
      leadCount,
      daysSinceStart: 0,
    });
    return health;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((column) => {
        const columnCampaigns = campaignsByStatus[column.id] || [];

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 space-y-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-main">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnCampaigns.length}
                </Badge>
              </div>
            </div>

            {/* Campaign Cards */}
            <div className="space-y-3">
              {columnCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-text-body">
                    No {column.label.toLowerCase()} campaigns
                  </CardContent>
                </Card>
              ) : (
                columnCampaigns.map((campaign) => {
                  const health = getCampaignHealth(campaign);

                  return (
                    <Card
                      key={campaign.id}
                      className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer"
                      onClick={() => onView && onView(campaign.id)}
                    >
                      <CardContent className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView && onView(campaign.id);
                          }}
                          className="text-left block mb-3 w-full"
                        >
                          <h4 className="font-semibold text-text-main mb-1 line-clamp-2 hover:text-primary-500 transition-colors">
                            {campaign.name}
                          </h4>
                          <p className="text-xs text-text-body truncate">
                            {campaign.account?.companyName || "No account"}
                          </p>
                        </button>

                        {/* Health Indicator */}
                        <div className="mb-3">
                          <CampaignHealthIndicator
                            health={health}
                            trend={campaign.status === "Active" ? "up" : "stable"}
                          />
                        </div>

                        {/* Quick Metrics */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-text-body">
                              <Users className="h-3 w-3" />
                              <span>Leads</span>
                            </div>
                            <span className="font-medium text-text-main">
                              {campaign._count?.leads || 0}
                            </span>
                          </div>

                          {campaign.startDate && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-text-body">
                                <Calendar className="h-3 w-3" />
                                <span>Started</span>
                              </div>
                              <span className="text-text-body">
                                {new Date(campaign.startDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(campaign.status)} w-full justify-center text-xs`}
                        >
                          {campaign.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

