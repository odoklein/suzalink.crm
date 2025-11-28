"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, UserCheck, Megaphone, Target, Calendar, Clock, 
  TrendingUp, Plus, Settings, CheckCircle, Activity, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  return (
    <div className="space-y-5">
      {/* KPIs Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <KpiCard icon={Megaphone} iconBg="bg-blue-50" iconColor="text-blue-600" 
          value={stats?.campaigns?.total ?? 0} label="Campagnes" 
          badge={`${stats?.campaigns?.active ?? 0} actives`} badgeColor="bg-green-50 text-green-700" />
        
        <KpiCard icon={UserCheck} iconBg="bg-green-50" iconColor="text-green-600"
          value={stats?.activeUsers ?? 0} label="Utilisateurs actifs"
          subtext={`${stats?.usersLoggedInToday ?? 0} en ligne`} />
        
        <KpiCard icon={Target} iconBg="bg-purple-50" iconColor="text-purple-600"
          value={stats?.leads?.total ?? 0} label="Total Leads" />
        
        <KpiCard icon={TrendingUp} iconBg="bg-amber-50" iconColor="text-amber-600"
          value={`${stats?.leads?.conversionRate ?? 0}%`} label="Leads → RDV"
          subtext={`${stats?.leads?.convertedToRdv ?? 0} convertis`} />
        
        <KpiCard icon={Calendar} iconBg="bg-cyan-50" iconColor="text-cyan-600"
          value={stats?.bookings?.today ?? 0} label="RDV Aujourd'hui" />
        
        <KpiCard icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600"
          value={stats?.bookings?.pendingApprovals ?? 0} label="En attente"
          badge={(stats?.bookings?.pendingApprovals ?? 0) > 0 ? "À valider" : undefined} 
          badgeColor="bg-orange-50 text-orange-600" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings List */}
        <Card className="lg:col-span-2 border-gray-200">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-600" />
                RDV récents & à venir
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">{stats?.bookings?.today ?? 0} aujourd'hui</Badge>
                <Badge variant="secondary" className="text-[10px]">{stats?.bookings?.total ?? 0} total</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.bookings?.todayDetails?.length ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {stats.bookings.todayDetails.map((b) => {
                  const bookingDate = new Date(b.startTime);
                  const isToday = bookingDate.toDateString() === new Date().toDateString();
                  const isPast = bookingDate < new Date();
                  
                  return (
                    <div key={b.id} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                      isToday ? "bg-cyan-50 hover:bg-cyan-100" : isPast ? "bg-gray-50 opacity-60" : "bg-gray-50 hover:bg-gray-100"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-center w-16">
                          <p className="text-[10px] text-gray-500">{format(bookingDate, "dd MMM", { locale: fr })}</p>
                          <p className="text-xs font-semibold">{format(bookingDate, "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.leadName || "N/A"}</p>
                          <p className="text-xs text-gray-500">{b.campaignName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{b.userName}</span>
                        {isToday && <Badge className="text-[9px] h-4 bg-cyan-100 text-cyan-700">Aujourd'hui</Badge>}
                        {b.approvalStatus === "on_hold" ? (
                          <Clock className="h-3.5 w-3.5 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Aucun RDV</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            <QuickLink href="/admin/users" icon={Plus} iconColor="text-blue-600" label="Créer un utilisateur" />
            <QuickLink href="/accounts" icon={Plus} iconColor="text-green-600" label="Nouveau compte" />
            <QuickLink href="/campaigns" icon={Megaphone} iconColor="text-purple-600" label="Campagnes" />
            <QuickLink href="/calendar" icon={Calendar} iconColor="text-cyan-600" label="Calendrier" />
            <QuickLink href="/planning" icon={Users} iconColor="text-amber-600" label="Planning BD" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RDV by Campaign */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">RDV par campagne</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.bookings?.byCampaign?.length ? (
              <div className="space-y-2">
                {stats.bookings.byCampaign.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate max-w-[140px]">{c.name}</span>
                    <Badge variant="secondary" className="text-xs">{c.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">-</p>
            )}
          </CardContent>
        </Card>

        {/* RDV by User */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">RDV par BD</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.bookings?.byUser?.length ? (
              <div className="space-y-2">
                {stats.bookings.byUser.slice(0, 4).map((u, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-green-100 text-green-700">
                          {getInitials(u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">{u.email.split("@")[0]}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{u.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">-</p>
            )}
          </CardContent>
        </Card>

        {/* BD Performance */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">Top BD (7j)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.bdPerformance?.length ? (
              <div className="space-y-2">
                {stats.bdPerformance.slice(0, 4).map((bd, i) => (
                  <div key={bd.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">#{i + 1}</span>
                      <span className="text-sm text-gray-700">{bd.email.split("@")[0]}</span>
                    </div>
                    <Badge className="text-xs bg-purple-100 text-purple-700">{bd.bookingsThisWeek} RDV</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns & Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Users */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                Utilisateurs actifs
              </CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                  Voir <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.recentlyActiveUsers?.length ? (
              <div className="space-y-2">
                {stats.recentlyActiveUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">
                            {getInitials(u.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white" />
                      </div>
                      <span className="text-sm text-gray-700">{u.email.split("@")[0]}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur actif</p>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card className="border-gray-200">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-600" />
                Campagnes
              </CardTitle>
              <Link href="/campaigns">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                  Gérer <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {stats?.campaigns?.list?.length ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {stats.campaigns.list.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${c.status === "Active" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-sm text-gray-700 truncate max-w-[150px]">{c.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.leadCount} leads</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucune campagne</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// KPI Card Component
function KpiCard({ icon: Icon, iconBg, iconColor, value, label, badge, badgeColor, subtext }: {
  icon: any; iconBg: string; iconColor: string; value: string | number; label: string;
  badge?: string; badgeColor?: string; subtext?: string;
}) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[10px] text-gray-500 truncate">{label}</p>
          </div>
        </div>
        {(badge || subtext) && (
          <div className="mt-1.5 ml-9">
            {badge && <Badge className={`text-[9px] h-4 px-1.5 ${badgeColor}`}>{badge}</Badge>}
            {subtext && <p className="text-[10px] text-gray-400">{subtext}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Link Component
function QuickLink({ href, icon: Icon, iconColor, label }: {
  href: string; icon: any; iconColor: string; label: string;
}) {
  return (
    <Link href={href}>
      <Button variant="ghost" className="w-full justify-start h-8 text-sm font-normal">
        <Icon className={`h-3.5 w-3.5 mr-2 ${iconColor}`} />
        {label}
      </Button>
    </Link>
  );
}

// Skeleton
function AdminKpiSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[260px] lg:col-span-2 rounded-lg" />
        <Skeleton className="h-[260px] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[140px] rounded-lg" />)}
      </div>
    </div>
  );
}
