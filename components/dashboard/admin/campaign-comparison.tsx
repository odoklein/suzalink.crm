"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { MiniProgressRing } from "@/components/dashboard/shared/progress-ring";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Users,
  Target,
} from "lucide-react";
import Link from "next/link";

interface CampaignStats {
  id: string;
  name: string;
  accountName: string;
  status: "Active" | "Paused" | "Completed";
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  trend: number; // Percentage change
  isTopPerformer: boolean;
  isUnderperforming: boolean;
}

interface CampaignComparisonProps {
  campaigns: CampaignStats[];
}

const statusConfig = {
  Active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  Paused: { label: "Pause", color: "bg-amber-100 text-amber-700" },
  Completed: { label: "Terminée", color: "bg-gray-100 text-gray-700" },
};

export function CampaignComparison({ campaigns }: CampaignComparisonProps) {
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => b.conversionRate - a.conversionRate
  );

  const avgConversion =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length
      : 0;

  return (
    <BentoCard size="lg" gradient="amber" delay={150}>
      <BentoCardHeader
        icon={<Megaphone className="h-5 w-5 text-amber-600" />}
        title="Performance campagnes"
        subtitle={`${campaigns.length} campagnes • Moy. ${avgConversion.toFixed(1)}% conversion`}
        iconBg="bg-amber-100"
        action={
          <Link
            href="/campaigns"
            className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            Tout voir
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      <div className="space-y-2">
        {sortedCampaigns.slice(0, 5).map((campaign, index) => {
          const status = statusConfig[campaign.status];
          const isAboveAvg = campaign.conversionRate >= avgConversion;

          return (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all",
                "hover:bg-gray-50 group",
                campaign.isTopPerformer && "bg-emerald-50/50 border border-emerald-100",
                campaign.isUnderperforming && "bg-red-50/50 border border-red-100"
              )}
            >
              {/* Rank */}
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  index === 0
                    ? "bg-amber-100 text-amber-700"
                    : index === 1
                    ? "bg-gray-200 text-gray-600"
                    : index === 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {index + 1}
              </div>

              {/* Campaign Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {campaign.name}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      status.color
                    )}
                  >
                    {status.label}
                  </span>
                  {campaign.isTopPerformer && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500 text-white">
                      Top
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {campaign.totalLeads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {campaign.qualifiedLeads} qualifiés
                  </span>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      isAboveAvg ? "text-emerald-600" : "text-gray-900"
                    )}
                  >
                    {campaign.conversionRate}%
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-xs",
                      campaign.trend >= 0 ? "text-emerald-600" : "text-red-500"
                    )}
                  >
                    {campaign.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(campaign.trend)}%
                  </div>
                </div>
                <MiniProgressRing
                  value={campaign.conversionRate * 2} // Scale for visual impact
                  size={36}
                  color={
                    campaign.conversionRate >= 50
                      ? "success"
                      : campaign.conversionRate >= 30
                      ? "warning"
                      : "danger"
                  }
                />
              </div>
            </Link>
          );
        })}
      </div>
    </BentoCard>
  );
}

