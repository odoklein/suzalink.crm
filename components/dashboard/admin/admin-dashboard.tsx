"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Clock, Settings, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// Dashboard components
import { DashboardTabs, type DashboardTab } from "./dashboard-tabs";
import { TimePeriodSelector, type TimePeriod, type ViewMode } from "./filters";
import { 
  KpiGrid, KpiGridSkeleton,
  PerformanceCharts, PerformanceChartsSkeleton,
  TeamGrid, TeamGridSkeleton,
  CampaignList, CampaignListSkeleton
} from "./widgets";

// Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  usersLoggedInToday: number;
  usersByRole: Record<string, number>;
  leads: {
    total: number;
    convertedToRdv: number;
    conversionRate: number;
  };
  campaigns: {
    total: number;
    active: number;
    list: Array<{
      id: string;
      name: string;
      status: string;
      accountName: string;
      leadCount: number;
    }>;
  };
  bookings: {
    total: number;
    today: number;
    pendingApprovals: number;
    byUser: Array<{ email: string; count: number }>;
    byCampaign: Array<{ name: string; count: number }>;
    todayDetails: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      approvalStatus: string;
      userName: string;
      leadName: string;
      campaignName: string;
    }>;
  };
  recentlyActiveUsers: Array<{
    id: string;
    email: string;
    role: string;
    lastLoginAt: string;
  }>;
  bdPerformance: Array<{
    id: string;
    email: string;
    leadsAssigned: number;
    bookingsThisWeek: number;
  }>;
}

// localStorage keys
const STORAGE_KEYS = {
  TAB: "admin-dashboard-tab",
  PERIOD: "admin-dashboard-period",
  VIEW_MODE: "admin-dashboard-view-mode",
  FILTERS: "admin-dashboard-filters",
};

export function AdminDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.email?.split("@")[0] || "Admin";
  const queryClient = useQueryClient();
  
  // State with localStorage persistence
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem(STORAGE_KEYS.TAB) as DashboardTab | null;
    const savedPeriod = localStorage.getItem(STORAGE_KEYS.PERIOD) as TimePeriod | null;
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode | null;
    const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);

    if (savedTab) setActiveTab(savedTab);
    if (savedPeriod) setTimePeriod(savedPeriod);
    if (savedViewMode) setViewMode(savedViewMode);
    if (savedFilters) setActiveFilters(JSON.parse(savedFilters));
  }, []);

  // Save preferences to localStorage
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    localStorage.setItem(STORAGE_KEYS.TAB, tab);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    localStorage.setItem(STORAGE_KEYS.PERIOD, period);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  const handleFilterToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(newFilters);
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(newFilters));
  };

  const handleFilterClear = () => {
    setActiveFilters([]);
    localStorage.removeItem(STORAGE_KEYS.FILTERS);
  };

  // Fetch admin stats
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-users-stats", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/stats?period=${timePeriod}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [queryClient]);

  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Period label for display
  const periodLabel = {
    day: "aujourd'hui",
    week: "7j",
    month: "30j",
    quarter: "trimestre",
    custom: "personnalisé",
  }[timePeriod];

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Enhanced Header with slim design and quick action buttons */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          {/* Top row: Greeting & Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-xl">👋</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {getGreeting()}, {userName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-xs text-slate-300">{currentTime}</p>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-500" />
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-slate-300">Temps réel</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-6 w-px bg-slate-600 hidden sm:block" />
              <TimePeriodSelector value={timePeriod} onChange={handlePeriodChange} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                <span className="hidden sm:inline text-xs">Actualiser</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Dashboard Content */}
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        children={{
          overview: (
            <div className="space-y-6">
              {isLoading ? (
                <>
                  <KpiGridSkeleton />
                </>
              ) : (
                <KpiGrid stats={stats} viewMode={viewMode} />
              )}
            </div>
          ),
          performance: (
            <div className="space-y-4">
              {isLoading ? (
                <PerformanceChartsSkeleton />
              ) : (
                <PerformanceCharts
                  byCampaign={stats?.bookings?.byCampaign}
                  bdPerformance={stats?.bdPerformance}
                  period={periodLabel}
                />
              )}
            </div>
          ),
          team: (
            <div className="space-y-4">
              {isLoading ? (
                <TeamGridSkeleton />
              ) : (
                <TeamGrid
                  activeUsers={stats?.recentlyActiveUsers}
                  bdPerformance={stats?.bdPerformance}
                  usersByRole={stats?.usersByRole}
                  totalUsers={stats?.totalUsers ?? 0}
                  usersLoggedInToday={stats?.usersLoggedInToday ?? 0}
                />
              )}
            </div>
          ),
          campaigns: (
            <div className="space-y-4">
              {isLoading ? (
                <CampaignListSkeleton />
              ) : (
                <CampaignList
                  campaigns={stats?.campaigns?.list}
                  byCampaign={stats?.bookings?.byCampaign}
                  totalCampaigns={stats?.campaigns?.total ?? 0}
                  activeCampaigns={stats?.campaigns?.active ?? 0}
                />
              )}
            </div>
          ),
        }}
      />
    </div>
  );
}
