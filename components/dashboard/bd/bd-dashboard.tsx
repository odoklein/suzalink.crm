"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { BentoGrid } from "@/components/dashboard/shared/bento-card";
import { MissionCard } from "./mission-card";
import { TodayStats } from "./today-stats";
import { CampaignCards } from "./campaign-cards";
import { ActivityFeed } from "./activity-feed";
import { Leaderboard } from "./leaderboard";
import { UpcomingTasks } from "./upcoming-tasks";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BDDashboardData {
  user: {
    name: string;
    id: string;
  };
  mission: {
    dailyGoal: number;
    currentProgress: number;
    streak: number;
  };
  todayStats: {
    callsMade: number;
    callsTarget: number;
    callsTrend: number[];
    leadsQualified: number;
    leadsTarget: number;
    avgCallDuration: string;
    conversionRate: number;
    conversionChange: number;
  };
  campaigns: Array<{
    id: string;
    name: string;
    accountName: string;
    totalLeads: number;
    remainingLeads: number;
    qualifiedLeads: number;
    status: "Active" | "Paused" | "Draft";
  }>;
  activities: Array<{
    id: string;
    type: "call" | "email" | "meeting" | "qualified" | "lost" | "note" | "assigned";
    leadName: string;
    campaignName: string;
    description: string;
    createdAt: string;
  }>;
  leaderboard: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    change: number;
    isCurrentUser: boolean;
  }>;
  tasks: {
    items: Array<{
      id: string;
      title: string;
      leadName?: string;
      dueDate: string;
      priority: "urgent" | "high" | "medium" | "low";
      completed: boolean;
    }>;
    overdueCount: number;
  };
}

export function BDDashboard() {
  const { data: session } = useSession();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<BDDashboardData>({
    queryKey: ["bd-dashboard-stats", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/bd/stats");
      if (!res.ok) throw new Error("Failed to fetch BD dashboard data");
      return res.json();
    },
    enabled: !!session?.user?.id,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-gray-500">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-red-500 mb-4">Erreur lors du chargement</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Bento Grid */}
      <BentoGrid columns={3}>
        {/* Mission Card - Spans 2 columns */}
        <MissionCard
          userName={data.user.name}
          dailyGoal={data.mission.dailyGoal}
          currentProgress={data.mission.currentProgress}
          streak={data.mission.streak}
          assignedCampaigns={data.campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            leadsRemaining: c.remainingLeads,
          }))}
        />

        {/* Today's Stats - Grid of 4 small cards in 1 column space */}
        <div className="col-span-1">
          <TodayStats
            callsMade={data.todayStats.callsMade}
            callsTarget={data.todayStats.callsTarget}
            callsTrend={data.todayStats.callsTrend}
            leadsQualified={data.todayStats.leadsQualified}
            leadsTarget={data.todayStats.leadsTarget}
            avgCallDuration={data.todayStats.avgCallDuration}
            conversionRate={data.todayStats.conversionRate}
            conversionChange={data.todayStats.conversionChange}
          />
        </div>

        {/* Campaign Cards */}
        <CampaignCards campaigns={data.campaigns} />

        {/* Activity Feed */}
        <ActivityFeed activities={data.activities} />

        {/* Leaderboard */}
        <Leaderboard
          entries={data.leaderboard}
          currentUserId={data.user.id}
          period="week"
        />

        {/* Upcoming Tasks */}
        <UpcomingTasks
          tasks={data.tasks.items}
          overdueCount={data.tasks.overdueCount}
        />
      </BentoGrid>
    </div>
  );
}




