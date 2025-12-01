"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { MiniProgressRing } from "@/components/dashboard/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Megaphone, Play, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  accountName: string;
  totalLeads: number;
  remainingLeads: number;
  qualifiedLeads: number;
  status: "Active" | "Paused" | "Draft";
}

interface CampaignCardsProps {
  campaigns: Campaign[];
}

export function CampaignCards({ campaigns }: CampaignCardsProps) {
  if (campaigns.length === 0) {
    return (
      <BentoCard size="md" gradient="purple" delay={150}>
        <BentoCardHeader
          icon={<Megaphone className="h-5 w-5 text-purple-600" />}
          title="Mes campagnes"
          subtitle="Campagnes assignées"
          iconBg="bg-purple-100"
        />
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Megaphone className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Aucune campagne assignée
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contactez votre manager
          </p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard size="md" gradient="purple" delay={150} className="overflow-hidden">
      <BentoCardHeader
        icon={<Megaphone className="h-5 w-5 text-purple-600" />}
        title="Mes campagnes"
        subtitle={`${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""} active${campaigns.length > 1 ? "s" : ""}`}
        iconBg="bg-purple-100"
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

      <div className="space-y-2 -mx-1">
        {campaigns.slice(0, 4).map((campaign, index) => {
          const progress = campaign.totalLeads > 0
            ? Math.round(((campaign.totalLeads - campaign.remainingLeads) / campaign.totalLeads) * 100)
            : 0;

          return (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}/leads`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "hover:bg-gray-50 transition-all duration-150",
                "group border border-transparent hover:border-gray-100"
              )}
              style={{ animationDelay: `${(index + 3) * 50}ms` }}
            >
              {/* Progress Ring */}
              <MiniProgressRing
                value={progress}
                size={36}
                color={progress >= 80 ? "success" : progress >= 50 ? "warning" : "primary"}
              />

              {/* Campaign Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {campaign.name}
                  </span>
                  {campaign.status === "Paused" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                      Pause
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <Users className="h-3 w-3" />
                  <span>{campaign.remainingLeads} leads restants</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-600">{campaign.qualifiedLeads} qualifiés</span>
                </div>
              </div>

              {/* Action */}
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="h-4 w-4 fill-current" />
              </Button>
            </Link>
          );
        })}
      </div>

      {campaigns.length > 4 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            href="/campaigns"
            className="text-xs text-gray-500 hover:text-primary-500 transition-colors"
          >
            +{campaigns.length - 4} autres campagnes
          </Link>
        </div>
      )}
    </BentoCard>
  );
}


