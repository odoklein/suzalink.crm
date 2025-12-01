"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, UserCheck, Megaphone, Target, Calendar, Clock, 
  TrendingUp, Plus, Settings, CheckCircle, Activity, ArrowRight,
  Award, AlertCircle, BarChart3
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardContent } from "@/components/dashboard/shared/bento-card";
import { Sparkline } from "@/components/dashboard/shared/sparkline";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

interface AdminStats {
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

// Mock trend data for sparklines - in real app, fetch from API
const getTrendData = (base: number) => [
  base * 0.8,
  base * 0.9,
  base * 0.85,
  base * 0.95,
  base * 1.0,
  base * 1.05,
  base,
];

export function AdminKpiWidgets() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <AdminKpiSkeleton />;

  const getInitials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  // Prepare data for charts
  const conversionData = [
    { name: "Convertis", value: stats?.leads?.convertedToRdv ?? 0, color: "#10B981" },
    { name: "Non convertis", value: (stats?.leads?.total ?? 0) - (stats?.leads?.convertedToRdv ?? 0), color: "#E5E7EB" },
  ];

  const weeklyRDVData = stats?.bookings?.byCampaign?.slice(0, 5).map(c => ({
    name: c.name.length > 10 ? c.name.substring(0, 10) + "..." : c.name,
    count: c.count,
  })) || [];

  return (
    <div className="space-y-4">
      {/* Section: Aujourd'hui */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Aujourd'hui</h2>
        <BentoGrid columns={3}>
          {/* All KPI cards with same height */}
          <BentoCard size="md" gradient="blue" delay={0} className="cursor-pointer group hover:shadow-sm h-[160px]">
            <BentoCardHeader
              icon={<Megaphone className="h-4 w-4 text-blue-600" />}
              title="Campagnes"
              subtitle={`${stats?.campaigns?.active ?? 0} actives`}
              iconBg="bg-blue-100"
            />
            <BentoCardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {stats?.campaigns?.total ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total campagnes</p>
                </div>
                <Sparkline 
                  data={getTrendData(stats?.campaigns?.total ?? 0)} 
                  width={80} 
                  height={32} 
                  color="primary"
                />
              </div>
            </BentoCardContent>
          </BentoCard>

          <BentoCard size="md" gradient="green" delay={50} className="cursor-pointer group hover:shadow-sm h-[160px]">
            <BentoCardHeader
              icon={<UserCheck className="h-4 w-4 text-green-600" />}
              title="Utilisateurs actifs"
              iconBg="bg-green-100"
            />
            <BentoCardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {stats?.activeUsers ?? 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground">
                      {stats?.usersLoggedInToday ?? 0} en ligne
                    </p>
                  </div>
                </div>
                <Sparkline 
                  data={getTrendData(stats?.activeUsers ?? 0)} 
                  width={80} 
                  height={32} 
                  color="success"
                />
              </div>
            </BentoCardContent>
          </BentoCard>

          <BentoCard size="md" gradient="purple" delay={100} className="cursor-pointer group hover:shadow-sm h-[160px]">
            <BentoCardHeader
              icon={<Target className="h-4 w-4 text-purple-600" />}
              title="Total Leads"
              iconBg="bg-purple-100"
            />
            <BentoCardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {stats?.leads?.total ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.leads?.convertedToRdv ?? 0} convertis
                  </p>
                </div>
                <Sparkline 
                  data={getTrendData(stats?.leads?.total ?? 0)} 
                  width={80} 
                  height={32} 
                  color="primary"
                />
              </div>
            </BentoCardContent>
          </BentoCard>

          <BentoCard size="md" gradient="amber" delay={150} className="cursor-pointer group hover:shadow-sm h-[160px]">
            <BentoCardHeader
              icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
              title="Taux de conversion"
              iconBg="bg-amber-100"
            />
            <BentoCardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {stats?.leads?.conversionRate ?? 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Leads → RDV</p>
                </div>
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={24}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </BentoCardContent>
          </BentoCard>

          <BentoCard size="md" gradient="cyan" delay={200} className="cursor-pointer group hover:shadow-sm h-[160px]">
            <BentoCardHeader
              icon={<Calendar className="h-4 w-4 text-cyan-600" />}
              title="RDV Aujourd'hui"
              iconBg="bg-cyan-100"
            />
            <BentoCardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900 leading-none">
                    {stats?.bookings?.today ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.bookings?.total ?? 0} total
                  </p>
                </div>
              </div>
            </BentoCardContent>
          </BentoCard>

          <BentoCard 
            size="md" 
            gradient="rose" 
            delay={250} 
            className={cn(
              "cursor-pointer group hover:shadow-sm h-[160px]",
              (stats?.bookings?.pendingApprovals ?? 0) > 0 && "ring-2 ring-rose-200"
            )}
          >
            <BentoCardHeader
              icon={<AlertCircle className="h-4 w-4 text-rose-600" />}
              title="En attente"
              iconBg="bg-rose-100"
            />
            <BentoCardContent>
              <div>
                <p className="text-4xl font-bold text-gray-900 leading-none">
                  {stats?.bookings?.pendingApprovals ?? 0}
                </p>
                {(stats?.bookings?.pendingApprovals ?? 0) > 0 && (
                  <Badge className="text-[10px] h-5 bg-rose-100 text-rose-700 border-rose-200 mt-1">
                    À valider
                  </Badge>
                )}
              </div>
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>

      {/* Section: Activité récente */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Activité récente</h2>
        <BentoGrid columns={3}>
          {/* RDV Timeline - Redesigned */}
          <BentoCard size="xl" gradient="cyan" delay={300} className="col-span-2">
            <BentoCardHeader
              icon={<Calendar className="h-4 w-4 text-cyan-600" />}
              title="RDV récents & à venir"
              subtitle="Aujourd'hui et cette semaine"
              iconBg="bg-cyan-100"
              action={
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {stats?.bookings?.today ?? 0} aujourd'hui
                  </Badge>
                </div>
              }
            />
            <BentoCardContent>
              {stats?.bookings?.todayDetails?.length ? (
                <div className="space-y-0 max-h-[320px] overflow-y-auto pr-2 -mr-2">
                  {stats.bookings.todayDetails.map((b, index) => {
                    const bookingDate = new Date(b.startTime);
                    const isToday = bookingDate.toDateString() === new Date().toDateString();
                    const isPast = bookingDate < new Date();
                    const isLast = index === stats.bookings.todayDetails.length - 1;
                    
                    return (
                      <div key={b.id} className="relative flex gap-4 pb-4 last:pb-0">
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        
                        {/* Timeline dot */}
                        <div className={cn(
                          "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
                          isToday 
                            ? "bg-cyan-50 border-cyan-300" 
                            : isPast 
                              ? "bg-gray-100 border-gray-300" 
                              : "bg-white border-gray-300"
                        )}>
                          <div className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            isToday ? "bg-cyan-600" : isPast ? "bg-gray-400" : "bg-gray-600"
                          )} />
                        </div>
                        
                        {/* Content */}
                        <div className={cn(
                          "flex-1 min-w-0 pb-3 pt-1",
                          isPast && "opacity-60"
                        )}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {b.leadName || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  {format(bookingDate, "HH:mm", { locale: fr })}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground truncate">
                                  {b.campaignName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {b.userName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isToday && (
                                <Badge className="text-[9px] h-4 bg-cyan-100 text-cyan-700 border-cyan-200">
                                  Aujourd'hui
                                </Badge>
                              )}
                              {b.approvalStatus === "on_hold" ? (
                                <Clock className="h-4 w-4 text-orange-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center">
                  <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun RDV programmé</p>
                </div>
              )}
            </BentoCardContent>
          </BentoCard>

          {/* Quick Actions - Redesigned */}
          <BentoCard size="md" gradient="none" delay={350}>
            <BentoCardHeader
              icon={<Settings className="h-4 w-4 text-gray-600" />}
              title="Actions rapides"
              subtitle="Accès direct"
              iconBg="bg-gray-100"
            />
            <BentoCardContent>
              <div className="space-y-1">
                <QuickLink href="/admin/users" icon={Plus} iconColor="text-blue-600" iconBg="bg-blue-100" label="Créer un utilisateur" />
                <QuickLink href="/accounts" icon={Plus} iconColor="text-green-600" iconBg="bg-green-100" label="Nouveau compte" />
                <QuickLink href="/campaigns" icon={Megaphone} iconColor="text-purple-600" iconBg="bg-purple-100" label="Campagnes" />
                <QuickLink href="/calendar" icon={Calendar} iconColor="text-cyan-600" iconBg="bg-cyan-100" label="Calendrier" />
                <QuickLink href="/planning" icon={Users} iconColor="text-amber-600" iconBg="bg-amber-100" label="Planning BD" />
              </div>
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>

      {/* Section: Performance */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Performance</h2>
        <BentoGrid columns={3}>
          {/* RDV by Campaign - with bar chart */}
          <BentoCard size="lg" gradient="blue" delay={400} className="col-span-2">
            <BentoCardHeader
              icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
              title="RDV par campagne (7j)"
              subtitle="Répartition des rendez-vous"
              iconBg="bg-blue-100"
            />
            <BentoCardContent>
              {weeklyRDVData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyRDVData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#6B7280" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#1A6BFF" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune donnée</p>
                </div>
              )}
            </BentoCardContent>
          </BentoCard>

          {/* Top BD Performance */}
          <BentoCard size="md" gradient="purple" delay={450}>
            <BentoCardHeader
              icon={<Award className="h-4 w-4 text-purple-600" />}
              title="Top BD (7j)"
              iconBg="bg-purple-100"
            />
            <BentoCardContent>
              {stats?.bdPerformance?.length ? (
                <div className="space-y-2.5">
                  {stats.bdPerformance.slice(0, 5).map((bd, i) => (
                    <div key={bd.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={cn(
                          "text-xs font-bold w-4 text-center shrink-0",
                          i === 0 ? "text-yellow-600" : i === 1 ? "text-gray-500" : i === 2 ? "text-orange-600" : "text-gray-400"
                        )}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {bd.email.split("@")[0]}
                        </span>
                      </div>
                      <Badge className="text-[10px] h-5 bg-purple-100 text-purple-700 border-purple-200">
                        {bd.bookingsThisWeek}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">-</p>
              )}
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>

      {/* Section: Équipe */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Équipe</h2>
        <BentoGrid columns={2}>
          {/* Active Users - Compressed */}
          <BentoCard size="lg" gradient="green" delay={550}>
            <BentoCardHeader
              icon={<Activity className="h-4 w-4 text-green-600" />}
              title="Utilisateurs actifs"
              subtitle="Dernière activité"
              iconBg="bg-green-100"
              action={
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                    Voir <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              }
            />
            <BentoCardContent>
              {stats?.recentlyActiveUsers?.length ? (
                <div className="space-y-1.5">
                  {stats.recentlyActiveUsers.slice(0, 8).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="relative">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 font-semibold">
                              {getInitials(u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {u.email.split("@")[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(u.lastLoginAt), "HH:mm", { locale: fr })}
                        </p>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-center">
                  <Users className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun utilisateur actif</p>
                </div>
              )}
            </BentoCardContent>
          </BentoCard>

          {/* Campaigns List */}
          <BentoCard size="lg" gradient="blue" delay={600}>
            <BentoCardHeader
              icon={<Megaphone className="h-4 w-4 text-blue-600" />}
              title="Campagnes"
              subtitle="Toutes les campagnes"
              iconBg="bg-blue-100"
              action={
                <Link href="/campaigns">
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                    Gérer <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              }
            />
            <BentoCardContent>
              {stats?.campaigns?.list?.length ? (
                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-2 -mr-2">
                  {stats.campaigns.list.slice(0, 10).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          c.status === "Active" ? "bg-green-500" : "bg-gray-300"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {c.accountName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 ml-2 shrink-0">
                        {c.leadCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-center">
                  <Megaphone className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune campagne</p>
                </div>
              )}
            </BentoCardContent>
          </BentoCard>
        </BentoGrid>
      </div>
    </div>
  );
}

// Enhanced Quick Link Component
function QuickLink({ 
  href, 
  icon: Icon, 
  iconColor, 
  iconBg,
  label 
}: {
  href: string; 
  icon: any; 
  iconColor: string;
  iconBg?: string;
  label: string;
}) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className="w-full justify-start h-9 text-xs font-normal hover:bg-gray-100 transition-colors group"
      >
        <div className={cn(
          "h-6 w-6 rounded-md flex items-center justify-center mr-2.5 transition-transform group-hover:scale-110",
          iconBg || "bg-gray-100"
        )}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        </div>
        <span className="flex-1 text-left">{label}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    </Link>
  );
}

// Enhanced Skeleton
function AdminKpiSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <BentoGrid columns={3}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </BentoGrid>
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <BentoGrid columns={3}>
          <Skeleton className="col-span-2 h-[360px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl" />
        </BentoGrid>
      </div>
    </div>
  );
}
