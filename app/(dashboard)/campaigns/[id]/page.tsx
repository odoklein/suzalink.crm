"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, FileDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignOverview } from "@/components/campaigns/campaign-overview";
import { CampaignSettings } from "@/components/campaigns/campaign-settings";
import { CampaignSettingsDrawer } from "@/components/campaigns/campaign-settings-drawer";
import { CampaignPerformanceDashboard } from "@/components/campaigns/campaign-performance-dashboard";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";
import { Settings, PanelRight } from "lucide-react";

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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const campaignId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview", "performance", "leads", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["campaign-assignments", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/assign`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const handleTabChange = (value: string) => {
    if (value === "leads") {
      // Redirect to dedicated leads page
      router.push(`/campaigns/${campaignId}/leads`);
      return;
    }
    setActiveTab(value);
    router.replace(`/campaigns/${campaignId}?tab=${value}`, { scroll: false });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Success", description: "Campaign deleted" });
      router.push("/campaigns");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-muted rounded-2xl"></div>
          <div className="h-10 bg-muted rounded-lg w-64"></div>
          <div className="grid gap-8 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="text-center py-12">
          <p className="text-body text-text-body">Campaign not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border bg-gradient-to-br from-white via-[#F8FAF9] to-white rounded-2xl p-6 -mx-2 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-primary-100 hover:text-primary-500 transition-all duration-150"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px] leading-tight mb-1">
              {campaign.name}
            </h1>
            <p className="text-sm text-text-body font-medium">
              {campaign.account.companyName}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/campaigns/${campaignId}/import`}>
              <Button 
                variant="outline"
                className="hover:border-primary-500 hover:text-primary-500 transition-all duration-150"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </Link>
            <Link href={`/campaigns/${campaignId}/edit`}>
              <Button 
                variant="outline"
                className="hover:border-primary-500 hover:text-primary-500 transition-all duration-150"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="hover:bg-destructive/90 transition-all duration-150"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-8 bg-[#F1F5F3] p-1.5 rounded-lg border border-border-light">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-500 data-[state=active]:shadow-sm font-medium transition-all duration-150"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="performance"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-500 data-[state=active]:shadow-sm font-medium transition-all duration-150"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="leads"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-500 data-[state=active]:shadow-sm font-medium transition-all duration-150"
          >
            Leads
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-white data-[state=active]:text-primary-500 data-[state=active]:shadow-sm font-medium transition-all duration-150"
            onClick={() => setSettingsDrawerOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CampaignOverview 
            campaignId={campaignId}
            onLeadClick={setSelectedLeadId}
          />
        </TabsContent>

        <TabsContent value="performance">
          <CampaignPerformanceDashboard campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="settings">
          <CampaignSettings 
            campaign={campaign} 
            assignments={assignments} 
          />
        </TabsContent>
      </Tabs>

      <CampaignSettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={(open) => {
          setSettingsDrawerOpen(open);
          if (!open && activeTab === "settings") {
            setActiveTab("overview");
          }
        }}
        campaign={campaign}
        assignments={assignments}
      />

      <LeadDetailsDrawer
        open={!!selectedLeadId}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
      />
    </div>
  );
}

