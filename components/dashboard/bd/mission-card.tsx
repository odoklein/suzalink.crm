"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/dashboard/shared/progress-ring";
import { 
  Play, 
  Zap, 
  Target, 
  TrendingUp,
  ChevronRight,
  Flame
} from "lucide-react";
import Link from "next/link";

interface MissionCardProps {
  userName: string;
  dailyGoal: number;
  currentProgress: number;
  streak: number;
  assignedCampaigns: Array<{ id: string; name: string; leadsRemaining: number }>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function MissionCard({
  userName,
  dailyGoal,
  currentProgress,
  streak,
  assignedCampaigns,
}: MissionCardProps) {
  const progressPercent = dailyGoal > 0 ? Math.min((currentProgress / dailyGoal) * 100, 100) : 0;
  const firstName = userName.split(" ")[0] || userName;

  return (
    <div className="relative col-span-full lg:col-span-2 rounded-2xl overflow-hidden min-h-[320px]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: "3s" }} />
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {getGreeting()}, {firstName} 👋
            </h2>
            <p className="text-white/80 text-sm">
              Prêt à conquérir de nouveaux leads aujourd'hui ?
            </p>
          </div>
          
          {/* Streak Badge */}
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Flame className="h-4 w-4 text-yellow-300" />
              <span className="text-white font-semibold text-sm">{streak} jours</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center gap-8">
          {/* Progress Ring */}
          <div className="shrink-0">
            <div className="relative">
              <ProgressRing
                value={progressPercent}
                size={140}
                strokeWidth={12}
                color="amber"
                showValue={false}
                animated
              />
              {/* Custom center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {currentProgress}
                </span>
                <span className="text-white/70 text-xs">sur {dailyGoal}</span>
              </div>
            </div>
          </div>

          {/* Stats & CTA */}
          <div className="flex-1 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <Target className="h-3 w-3" />
                  Objectif
                </div>
                <div className="text-xl font-bold text-white">{dailyGoal} leads</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Restant
                </div>
                <div className="text-xl font-bold text-white">
                  {Math.max(0, dailyGoal - currentProgress)}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className={cn(
                "w-full h-14 text-base font-semibold",
                "bg-white text-orange-600 hover:bg-white/90",
                "shadow-lg shadow-black/20",
                "transition-all duration-200 hover:scale-[1.02]"
              )}
              asChild
            >
              <Link href="/campaigns">
                <Play className="h-5 w-5 mr-2 fill-current" />
                Commencer ma session
                <ChevronRight className="h-5 w-5 ml-auto" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Campaign Chips */}
        {assignedCampaigns.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-2">
              <Zap className="h-3 w-3" />
              Vos campagnes
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedCampaigns.slice(0, 4).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}/leads`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                    "bg-white/20 backdrop-blur-sm text-white text-xs font-medium",
                    "hover:bg-white/30 transition-colors"
                  )}
                >
                  {campaign.name}
                  <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px]">
                    {campaign.leadsRemaining}
                  </span>
                </Link>
              ))}
              {assignedCampaigns.length > 4 && (
                <span className="text-white/60 text-xs self-center">
                  +{assignedCampaigns.length - 4} autres
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




