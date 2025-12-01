"use client";

import { Megaphone, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type CampaignLeadsHeaderProps = {
  campaign: {
    id: string;
    name: string;
    status: string;
    account: {
      companyName: string;
    };
    _count?: {
      leads: number;
    };
  };
};

// Status labels in French
const STATUS_LABELS: Record<string, string> = {
  "draft": "Brouillon",
  "active": "Active",
  "paused": "En pause",
  "completed": "Terminée",
  "cancelled": "Annulée",
};

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Megaphone;
}) {
  return (
    <Card className="shadow-none border-border/70 bg-surface relative z-10">
      <CardContent className="px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary-500" />
        </div>
        <div>
          <p className="text-xs text-text-body">{label}</p>
          <p className="text-sm font-semibold text-text-main">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignLeadsHeader({
  campaign,
}: CampaignLeadsHeaderProps) {
  const totalLeads = campaign._count?.leads ?? 0;
  const statusLabel = STATUS_LABELS[campaign.status.toLowerCase()] || campaign.status;

  return (
    <div className="sticky top-0 z-10 -mx-6 border-b border-border/60 bg-surface backdrop-blur-md shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Gauche: Contexte de la campagne */}
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-text-body/70 mb-1">
            Espace de travail campagne
          </p>
          <h1 className="text-[22px] md:text-[24px] font-semibold text-text-main tracking-[-0.3px]">
            {campaign.name}
          </h1>
          <p className="text-body text-text-body mt-1">
            {campaign.account.companyName}
          </p>
        </div>

        {/* Droite: stats + toggle de vue */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6 md:justify-end flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 min-w-[220px] md:min-w-[360px]">
            <StatPill
              label="Total prospects"
              value={totalLeads.toLocaleString("fr-FR")}
              icon={Users}
            />
            <StatPill
              label="Statut"
              value={statusLabel}
              icon={Megaphone}
            />
            <StatPill
              label="Taux de conversion"
              value="—"
              icon={TrendingUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
