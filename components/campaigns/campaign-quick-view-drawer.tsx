"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Building2,
  Users,
  Edit,
  ExternalLink,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
  _count?: {
    leads: number;
  };
};

type CampaignQuickViewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
  onEdit?: (campaignId: string) => void;
};

export function CampaignQuickViewDrawer({
  open,
  onOpenChange,
  campaignId,
  onEdit,
}: CampaignQuickViewDrawerProps) {
  const router = useRouter();

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!campaignId && open,
  });

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

  if (!campaignId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-20 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : campaign ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                    {campaign.name}
                  </SheetTitle>
                  <SheetDescription className="text-body text-text-body mt-2">
                    Campaign details and overview
                  </SheetDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(campaign.status)} ml-2`}
                >
                  {campaign.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-text-body" />
                      <span className="text-sm text-text-body">Total Leads</span>
                    </div>
                    <div className="text-[24px] font-semibold text-text-main">
                      {campaign._count?.leads || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-text-body" />
                      <span className="text-sm text-text-body">Account</span>
                    </div>
                    <div className="text-sm font-medium text-text-main truncate">
                      {campaign.account.companyName}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Information */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-text-body" />
                      <span className="text-sm font-medium text-text-body">Start Date</span>
                    </div>
                    <p className="text-body text-text-main">
                      {campaign.startDate
                        ? format(new Date(campaign.startDate), "PPP")
                        : "Not set"}
                    </p>
                  </div>

                  {campaign.schemaConfig && Array.isArray(campaign.schemaConfig) && campaign.schemaConfig.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-text-body" />
                        <span className="text-sm font-medium text-text-body">Custom Fields</span>
                      </div>
                      <p className="text-body text-text-main">
                        {campaign.schemaConfig.length} custom field{campaign.schemaConfig.length !== 1 ? "s" : ""} configured
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onEdit) {
                      onEdit(campaign.id);
                    }
                    onOpenChange(false);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/campaigns/${campaign.id}`);
                    onOpenChange(false);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/campaigns/${campaign.id}/leads`);
                    onOpenChange(false);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Leads ({campaign._count?.leads || 0})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/campaigns/${campaign.id}/import`);
                    onOpenChange(false);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-body text-text-body">Campaign not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

