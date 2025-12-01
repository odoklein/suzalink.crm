"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Megaphone, UserCheck, Target, TrendingUp, TrendingDown, Calendar, AlertCircle, 
  Phone, ArrowUpRight, ArrowDownRight, Users, Building2, Clock,
  CheckCircle, Zap, Award, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { type AdminStats } from "../admin-dashboard";
import { type ViewMode } from "../filters/view-mode-toggle";

interface KpiGridProps {
  stats: AdminStats | undefined;
  viewMode?: ViewMode;
}

// Generate realistic trend data
const generateTrendData = (base: number, days: number = 7) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    const variance = (Math.random() - 0.5) * 0.3;
    const trend = 1 + (i / days) * 0.1;
    data.push({
      day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
      value: Math.round(base * (0.7 + variance) * trend),
    });
  }
  return data;
};

// Calculate trend percentage
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
};

export function KpiGrid({ stats, viewMode = "standard" }: KpiGridProps) {
  const isCompact = viewMode === "compact";
  const isDetailed = viewMode === "detailed";

  // Prepare data for conversion chart
  const conversionData = [
    { name: "Convertis", value: stats?.leads?.convertedToRdv ?? 0, color: "#10B981" },
    { name: "Non convertis", value: (stats?.leads?.total ?? 0) - (stats?.leads?.convertedToRdv ?? 0), color: "#E5E7EB" },
  ];

  // Generate trend data for charts
  const bookingsTrend = generateTrendData(stats?.bookings?.today ?? 5);
  const campaignsTrend = generateTrendData(stats?.campaigns?.active ?? 3);

  // Mock trends (in real app, calculate from historical data)
  const trends = {
    campaigns: calculateTrend(stats?.campaigns?.total ?? 0, (stats?.campaigns?.total ?? 0) * 0.9),
    users: calculateTrend(stats?.activeUsers ?? 0, (stats?.activeUsers ?? 0) * 0.85),
    bookings: calculateTrend(stats?.bookings?.today ?? 0, (stats?.bookings?.today ?? 0) * 0.8),
    conversion: calculateTrend(stats?.leads?.conversionRate ?? 0, (stats?.leads?.conversionRate ?? 0) * 0.95),
  };

  const getInitials = (user: { email: string }) => user.email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Main KPI Cards - 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campaigns Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trends.campaigns.isPositive ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              )}>
                {trends.campaigns.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trends.campaigns.value}%
              </div>
            </div>
            
            <p className="text-blue-100 text-sm font-medium mb-1">Campagnes</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight">{stats?.campaigns?.total ?? 0}</p>
                <p className="text-blue-200 text-xs mt-1">
                  <span className="text-white font-semibold">{stats?.campaigns?.active ?? 0}</span> actives
                </p>
              </div>
              {!isCompact && (
                <div className="h-12 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={campaignsTrend}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="rgba(255,255,255,0.8)" 
                        fill="rgba(255,255,255,0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-xs font-medium text-green-100">{stats?.usersLoggedInToday ?? 0} en ligne</span>
              </div>
            </div>
            
            <p className="text-emerald-100 text-sm font-medium mb-1">Utilisateurs actifs</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight">{stats?.activeUsers ?? 0}</p>
                <p className="text-emerald-200 text-xs mt-1">
                  sur <span className="text-white font-semibold">{stats?.totalUsers ?? 0}</span> total
                </p>
              </div>
              {!isCompact && stats?.recentlyActiveUsers && (
                <div className="flex -space-x-2">
                  {stats.recentlyActiveUsers.slice(0, 3).map((user: { id: string; email: string }, i: number) => (
                    <Avatar key={user.id} className="h-8 w-8 border-2 border-emerald-500">
                      <AvatarFallback className="text-[10px] bg-white/20 text-white font-semibold">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {(stats.recentlyActiveUsers.length > 3) && (
                    <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-semibold">
                      +{stats.recentlyActiveUsers.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bookings Today Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              {(stats?.bookings?.pendingApprovals ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-400/30 text-amber-100">
                  <Clock className="h-3 w-3" />
                  {stats?.bookings?.pendingApprovals} en attente
                </div>
              )}
            </div>
            
            <p className="text-violet-100 text-sm font-medium mb-1">RDV Aujourd'hui</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight">{stats?.bookings?.today ?? 0}</p>
                <p className="text-violet-200 text-xs mt-1">
                  <span className="text-white font-semibold">{stats?.bookings?.total ?? 0}</span> cette semaine
                </p>
              </div>
              {!isCompact && (
                <div className="h-12 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bookingsTrend}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="rgba(255,255,255,0.8)" 
                        fill="rgba(255,255,255,0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trends.conversion.isPositive ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"
              )}>
                {trends.conversion.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trends.conversion.value}%
              </div>
            </div>
            
            <p className="text-amber-100 text-sm font-medium mb-1">Taux de conversion</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight">{stats?.leads?.conversionRate ?? 0}%</p>
                <p className="text-amber-200 text-xs mt-1">
                  <span className="text-white font-semibold">{stats?.leads?.convertedToRdv ?? 0}</span> / {stats?.leads?.total ?? 0} leads
                </p>
              </div>
              {!isCompact && (
                <div className="w-14 h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={26}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#fff" : "rgba(255,255,255,0.3)"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Leads */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.leads?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total leads</p>
          </div>
        </div>

        {/* Accounts */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(stats?.campaigns?.list?.map((c: { accountName: string }) => c.accountName) ?? []).size}
            </p>
            <p className="text-xs text-muted-foreground">Comptes clients</p>
          </div>
        </div>

        {/* Top Performer */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Award className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {stats?.bdPerformance?.[0]?.email.split("@")[0] ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Top BD • {stats?.bdPerformance?.[0]?.bookingsThisWeek ?? 0} RDV
            </p>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            (stats?.bookings?.pendingApprovals ?? 0) > 0 ? "bg-rose-100" : "bg-green-100"
          )}>
            {(stats?.bookings?.pendingApprovals ?? 0) > 0 ? (
              <AlertCircle className="h-5 w-5 text-rose-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.pendingApprovals ?? 0}</p>
            <p className="text-xs text-muted-foreground">À valider</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Skeleton loader for KPI Grid
export function KpiGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i: number) => (
          <div 
            key={i} 
            className={cn(
              "h-[160px] rounded-2xl animate-pulse",
              i === 0 && "bg-blue-200",
              i === 1 && "bg-emerald-200",
              i === 2 && "bg-violet-200",
              i === 3 && "bg-amber-200",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i: number) => (
          <div key={i} className="h-[72px] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
