"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SalesWorkspace } from "@/components/leads/sales-workspace";
import { CampaignLeadsHeader } from "@/components/leads/campaign-leads-header";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";

type ViewMode = "workspace" | "table" | "both";

const LeadTable = dynamic(
  () =>
    import("@/components/leads/lead-table-enhanced").then(
      (mod) => mod.LeadTable
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="h-8 w-40 rounded-md bg-muted animate-pulse mb-4" />
        <div className="h-10 w-full rounded-md bg-muted animate-pulse mb-2" />
        <div className="h-10 w-full rounded-md bg-muted animate-pulse mb-2" />
        <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      </div>
    ),
  }
);

type Campaign = {
  id: string;
  name: string;
  status: string;
  schemaConfig: any;
  account: {
    id: string;
    companyName: string;
  };
  _count?: {
    leads: number;
  };
};

type CampaignLeadsContentProps = {
  campaign: Campaign;
  campaignId: string;
};

export function CampaignLeadsContent({ campaign, campaignId }: CampaignLeadsContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("workspace");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* En-tête collant avec toggle de vue et statistiques rapides */}
      <CampaignLeadsHeader
        campaign={campaign}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="px-6 pb-6 space-y-6">
        {/* Ligne de retour */}
        <div className="pt-4 flex items-center gap-3">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-text-body">
            Retour aux campagnes
          </span>
        </div>

        {/* Section espace de travail */}
        {viewMode !== "table" && (
          <section
            className="md:sticky md:top-[96px] z-[50]"
            aria-label="Espace de travail commercial"
          >
            <SalesWorkspace campaignId={campaignId} />
            {viewMode === "workspace" && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  Voir tous les leads
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Section tableau des leads */}
        {viewMode !== "workspace" && (
          <section aria-label="Tableau des leads" className="space-y-3">
            <LeadTable
              campaignId={campaignId}
              schemaConfig={campaign.schemaConfig || []}
              onLeadClick={setSelectedLeadId}
            />
          </section>
        )}
      </div>

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
