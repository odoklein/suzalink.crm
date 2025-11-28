"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  CampaignDashboard,
  CampaignDashboardSkeleton,
} from "@/components/campaigns/campaign-dashboard";
import { LeadsSection } from "@/components/campaigns/leads-section";
import { BookingsWidget } from "@/components/campaigns/bookings-widget";
import {
  ActivityFeedWidget,
  TeamPerformanceWidget,
} from "@/components/campaigns/activity-feed-widget";
import { FloatingActionBar } from "@/components/campaigns/floating-action-bar";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";
import { CampaignSettingsDrawer } from "@/components/campaigns/campaign-settings-drawer";
import { DeleteDialog } from "@/components/ui/delete-dialog";

type Campaign = {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Draft" | "Completed";
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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const campaignId = params.id as string;

  // State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch campaign
  const {
    data: campaign,
    isLoading,
    error,
  } = useQuery<Campaign>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
  });

  // Fetch assignments for settings
  const { data: assignments = [] } = useQuery({
    queryKey: ["campaign-assignments", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/assign`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: settingsDrawerOpen,
  });

  // Fetch analytics for stats
  const { data: analytics } = useQuery({
    queryKey: ["campaign-analytics", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/analytics`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Handlers
  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const handleAddLead = () => {
    // TODO: Open add lead dialog
    toast({
      title: "Coming soon",
      description: "Add lead functionality will be available soon.",
    });
  };

  const handleAddBooking = () => {
    // TODO: Open add booking dialog
    toast({
      title: "Coming soon",
      description: "Schedule booking functionality will be available soon.",
    });
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      router.push("/campaigns");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
  };

  // Calculate stats from analytics
  const stats = analytics
    ? {
        totalLeads: analytics.leadMetrics?.total || 0,
        qualifiedLeads: analytics.leadMetrics?.qualified || 0,
        contactedLeads: analytics.leadMetrics?.contacted || 0,
        bookings: analytics.activityMetrics?.meetingsScheduled || 0,
        conversionRate: analytics.leadMetrics?.conversionRate || 0,
      }
    : undefined;

  // Loading state
  if (isLoading) {
    return <CampaignDashboardSkeleton />;
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Campaign not found
          </h2>
          <p className="text-gray-500 mb-4">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/campaigns")}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CampaignDashboard
        campaign={campaign}
        stats={stats}
        onOpenSettings={() => setSettingsDrawerOpen(true)}
        leftContent={
          <LeadsSection
            campaignId={campaignId}
            onLeadClick={handleLeadClick}
            onAddLead={handleAddLead}
            maxItems={8}
          />
        }
        rightContent={
          <>
            <BookingsWidget
              campaignId={campaignId}
              onAddBooking={handleAddBooking}
            />
            <ActivityFeedWidget campaignId={campaignId} maxItems={5} />
            <TeamPerformanceWidget campaignId={campaignId} />
          </>
        }
      />

      {/* Floating Action Bar */}
      <FloatingActionBar
        campaignId={campaignId}
        onAddLead={handleAddLead}
        onAddBooking={handleAddBooking}
        onOpenSettings={() => setSettingsDrawerOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        open={!!selectedLeadId}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
      />

      {/* Settings Drawer */}
      <CampaignSettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        campaign={campaign}
        assignments={assignments}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description="Are you sure you want to delete"
        itemName={campaign.name}
      />
    </>
  );
}
