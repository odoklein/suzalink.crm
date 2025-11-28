"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignLeadsHeader } from "@/components/leads/campaign-leads-header";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";

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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* En-tête avec statistiques */}
      <CampaignLeadsHeader campaign={campaign} />

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

        {/* Section tableau des leads */}
        <section aria-label="Tableau des leads" className="space-y-3">
          <LeadTable
            campaignId={campaignId}
            schemaConfig={campaign.schemaConfig || []}
            onLeadClick={setSelectedLeadId}
          />
        </section>
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
