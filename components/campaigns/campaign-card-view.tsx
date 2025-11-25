"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignHealthIndicator, calculateCampaignHealth } from "./campaign-health-indicator";
import { Users, Calendar, TrendingUp, MoreVertical, ExternalLink } from "lucide-react";
import type { Campaign } from "./types";

type CampaignCardViewProps = {
  campaigns: Campaign[];
  onEdit?: (campaignId: string) => void;
  onDelete?: (campaign: Campaign) => void;
  onView?: (campaignId: string) => void;
};

export function CampaignCardView({
  campaigns,
  onEdit,
  onDelete,
  onView,
}: CampaignCardViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success-100 text-success-text";
      case "Paused":
        return "bg-warning-100 text-warning-500";
      case "Draft":
        return "bg-muted text-muted-foreground";
      case "Completed":
        return "bg-info-100 text-info-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate health for each campaign (simplified - would use real analytics in production)
  const getCampaignHealth = (campaign: Campaign) => {
    const leadCount = campaign._count?.leads || 0;
    const daysSinceStart = campaign.startDate
      ? Math.floor((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Simplified health calculation - in production would fetch real analytics
    const health = calculateCampaignHealth({
      contactRate: campaign.status === "Active" ? 60 : 0,
      conversionRate: campaign.status === "Active" ? 10 : 0,
      activityFrequency: campaign.status === "Active" ? 5 : 0,
      bdCoverage: 70,
      leadCount,
      daysSinceStart,
    });

    return health;
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-text-body">
        No campaigns found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const health = getCampaignHealth(campaign);
        const trend = campaign.status === "Active" ? "up" : "stable";

        return (
          <Card
            key={campaign.id}
            className="hover:shadow-md hover:border-primary-200 transition-all duration-200 group cursor-pointer"
            onClick={() => onView && onView(campaign.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView && onView(campaign.id);
                    }}
                    className="text-left group-hover:text-primary-500 transition-colors w-full"
                  >
                    <h3 className="text-lg font-semibold text-text-main mb-1 line-clamp-1">
                      {campaign.name}
                    </h3>
                  </button>
                  <p className="text-sm text-text-body truncate">
                    {campaign.account?.companyName || "No account"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(campaign.id)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Quick View
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/campaigns/${campaign.id}`} onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Details
                      </Link>
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(campaign.id);
                      }}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/campaigns/${campaign.id}/leads`} onClick={(e) => e.stopPropagation()}>
                        View Leads
                      </Link>
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(campaign);
                        }}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Health Indicator */}
              <div className="mb-4">
                <CampaignHealthIndicator
                  health={health}
                  trend={trend}
                  bdCoverage={70}
                />
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text-body">
                    <Users className="h-4 w-4" />
                    <span>Leads</span>
                  </div>
                  <span className="font-semibold text-text-main">
                    {campaign._count?.leads || 0}
                  </span>
                </div>

                {campaign.startDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-text-body">
                      <Calendar className="h-4 w-4" />
                      <span>Start Date</span>
                    </div>
                    <span className="text-sm text-text-body">
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-4 border-t border-border-light">
                <Badge
                  variant="outline"
                  className={getStatusColor(campaign.status)}
                >
                  {campaign.status}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView && onView(campaign.id);
                  }}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  View →
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

