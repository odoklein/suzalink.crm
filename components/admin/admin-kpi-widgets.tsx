"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, UserPlus, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    ADMIN: number;
    MANAGER: number;
    BD: number;
    DEVELOPER: number;
  };
  avgLoginFrequency: number;
  trends: {
    totalChange: number;
    activeChange: number;
  };
}

export function AdminKpiWidgets() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) {
    return <AdminKpiSkeleton />;
  }

  const kpis = [
    {
      title: "Total Utilisateurs",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      trend: stats?.trends?.totalChange ?? 0,
      color: "primary",
      bgColor: "bg-[#1A6BFF]/10",
      iconColor: "text-[#1A6BFF]",
    },
    {
      title: "Utilisateurs Actifs",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      trend: stats?.trends?.activeChange ?? 0,
      color: "success",
      bgColor: "bg-[#00D985]/10",
      iconColor: "text-[#00D985]",
    },
    {
      title: "Utilisateurs Inactifs",
      value: stats?.inactiveUsers ?? 0,
      icon: UserX,
      trend: 0,
      color: "warning",
      bgColor: "bg-[#FFAA00]/10",
      iconColor: "text-[#FFAA00]",
    },
    {
      title: "Nouveaux ce mois",
      value: stats?.newUsersThisMonth ?? 0,
      icon: UserPlus,
      trend: 0,
      color: "accent",
      bgColor: "bg-[#A46CFF]/10",
      iconColor: "text-[#A46CFF]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.title}
            className="border-[#E6E8EB] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: "fadeInUp 0.3s ease-out forwards",
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#6B7280]">{kpi.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-bold text-[#1B1F24] tracking-tight">
                      {kpi.value}
                    </span>
                    {kpi.trend !== 0 && (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          kpi.trend > 0 ? "text-[#00D985]" : "text-[#FF3B3B]"
                        }`}
                      >
                        {kpi.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(kpi.trend)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Distribution & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Role Distribution Card */}
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1B1F24]">Distribution par rôle</h3>
            </div>
            <div className="space-y-3">
              {[
                { role: "Administrateur", key: "ADMIN", color: "#EF4444" },
                { role: "Gestionnaire", key: "MANAGER", color: "#1A6BFF" },
                { role: "Business Developer", key: "BD", color: "#00D985" },
                { role: "Développeur", key: "DEVELOPER", color: "#A46CFF" },
              ].map((item) => {
                const count = stats?.usersByRole?.[item.key as keyof typeof stats.usersByRole] ?? 0;
                const total = stats?.totalUsers ?? 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[#1B1F24] font-medium">{item.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#6B7280]">{count}</span>
                        <span className="text-xs text-[#9CA3AF]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview Card */}
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1B1F24]">Vue d'ensemble</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D985]/10">
                <Activity className="h-3.5 w-3.5 text-[#00D985]" />
                <span className="text-xs font-medium text-[#00D985]">Actif</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#F8F9FA] to-[#F1F3F5]">
                <p className="text-xs font-medium text-[#6B7280] mb-1">Taux d'activité</p>
                <p className="text-2xl font-bold text-[#1B1F24]">
                  {stats?.totalUsers
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">des utilisateurs actifs</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#F8F9FA] to-[#F1F3F5]">
                <p className="text-xs font-medium text-[#6B7280] mb-1">Connexions moyennes</p>
                <p className="text-2xl font-bold text-[#1B1F24]">
                  {stats?.avgLoginFrequency?.toFixed(1) ?? "0"}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">par semaine / utilisateur</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E6E8EB]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Dernière activité système</span>
                <span className="text-[#1B1F24] font-medium">Il y a quelques instants</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function AdminKpiSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#E6E8EB]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-16" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



