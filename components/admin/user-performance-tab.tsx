"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Award,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { EmptyState } from "@/components/help/empty-state";

interface PerformanceData {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    avgTimeToConvert: number;
    byStatus: {
      status: string;
      count: number;
    }[];
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  activities: {
    total: number;
    calls: number;
    emails: number;
    notes: number;
    thisWeek: number;
    lastWeek: number;
  };
  comparison: {
    leadsVsAvg: number;
    conversionVsAvg: number;
    tasksVsAvg: number;
  };
  timeline: {
    date: string;
    leads: number;
    conversions: number;
  }[];
}

interface UserPerformanceTabProps {
  userId: string;
}

export function UserPerformanceTab({ userId }: UserPerformanceTabProps) {
  const { data: performance, isLoading } = useQuery<PerformanceData>({
    queryKey: ["user-performance", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/performance`);
      if (!res.ok) throw new Error("Failed to fetch performance");
      return res.json();
    },
  });

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  if (!performance) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Données non disponibles"
        description="Les données de performance ne sont pas encore disponibles pour cet utilisateur."
      />
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-[#1A6BFF]",
      Locked: "bg-[#F59E0B]",
      Contacted: "bg-[#A46CFF]",
      Qualified: "bg-[#00D985]",
      Nurture: "bg-[#6B7280]",
      Lost: "bg-[#EF4444]",
    };
    return colors[status] || "bg-[#6B7280]";
  };

  const activityChange =
    performance.activities.lastWeek > 0
      ? Math.round(
          ((performance.activities.thisWeek - performance.activities.lastWeek) /
            performance.activities.lastWeek) *
            100
        )
      : performance.activities.thisWeek > 0
      ? 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads Metric */}
        <Card className="border-[#E6E8EB] hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#6B7280]">Total Leads</p>
                <p className="text-3xl font-bold text-[#1B1F24]">{performance.leads.total}</p>
                <div className="flex items-center gap-1.5">
                  {performance.comparison.leadsVsAvg >= 0 ? (
                    <Badge className="bg-[#00D985]/10 text-[#00D985] border-0 text-xs font-medium">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      {performance.comparison.leadsVsAvg}% vs équipe
                    </Badge>
                  ) : (
                    <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-0 text-xs font-medium">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      {Math.abs(performance.comparison.leadsVsAvg)}% vs équipe
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#1A6BFF]/10">
                <Target className="h-5 w-5 text-[#1A6BFF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-[#E6E8EB] hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#6B7280]">Taux de conversion</p>
                <p className="text-3xl font-bold text-[#1B1F24]">
                  {performance.leads.conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6B7280]">
                    {performance.leads.converted} convertis sur {performance.leads.total}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#00D985]/10">
                <TrendingUp className="h-5 w-5 text-[#00D985]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-[#E6E8EB] hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#6B7280]">Tâches complétées</p>
                <p className="text-3xl font-bold text-[#1B1F24]">{performance.tasks.completed}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6B7280]">
                    {performance.tasks.completionRate.toFixed(0)}% de complétion
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#A46CFF]/10">
                <CheckCircle className="h-5 w-5 text-[#A46CFF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity This Week */}
        <Card className="border-[#E6E8EB] hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#6B7280]">Activités cette semaine</p>
                <p className="text-3xl font-bold text-[#1B1F24]">
                  {performance.activities.thisWeek}
                </p>
                <div className="flex items-center gap-1.5">
                  {activityChange >= 0 ? (
                    <Badge className="bg-[#00D985]/10 text-[#00D985] border-0 text-xs font-medium">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />+{activityChange}% vs semaine
                      dernière
                    </Badge>
                  ) : (
                    <Badge className="bg-[#EF4444]/10 text-[#EF4444] border-0 text-xs font-medium">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      {activityChange}% vs semaine dernière
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F59E0B]/10">
                <Zap className="h-5 w-5 text-[#F59E0B]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <Card className="border-[#E6E8EB]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1B1F24]">
              Distribution des leads par statut
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280]">
              Répartition des leads assignés à cet utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {performance.leads.byStatus.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6B7280]">
                Aucun lead assigné
              </div>
            ) : (
              <div className="space-y-3">
                {performance.leads.byStatus.map((item) => {
                  const percentage =
                    performance.leads.total > 0
                      ? Math.round((item.count / performance.leads.total) * 100)
                      : 0;
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)}`}
                          />
                          <span className="text-[#1B1F24] font-medium">{item.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#6B7280]">{item.count}</span>
                          <span className="text-xs text-[#9CA3AF]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${getStatusColor(
                            item.status
                          )}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card className="border-[#E6E8EB]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1B1F24]">
              Répartition des activités
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280]">
              Types d'activités réalisées par cet utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A6BFF]/5 to-[#1A6BFF]/10 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#1A6BFF]/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#1A6BFF]" />
                </div>
                <p className="text-2xl font-bold text-[#1B1F24]">{performance.activities.calls}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Appels</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#00D985]/5 to-[#00D985]/10 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#00D985]/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#00D985]" />
                </div>
                <p className="text-2xl font-bold text-[#1B1F24]">{performance.activities.emails}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Emails</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#A46CFF]/5 to-[#A46CFF]/10 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#A46CFF]/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-[#A46CFF]" />
                </div>
                <p className="text-2xl font-bold text-[#1B1F24]">{performance.activities.notes}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Notes</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E6E8EB]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Total des activités</span>
                <span className="text-lg font-semibold text-[#1B1F24]">
                  {performance.activities.total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Overview */}
      <Card className="border-[#E6E8EB]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1B1F24]">
            Aperçu des tâches
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280]">
            État des tâches assignées à cet utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#E6E8EB] bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#6B7280]" />
                <span className="text-sm text-[#6B7280]">Total</span>
              </div>
              <p className="text-2xl font-bold text-[#1B1F24]">{performance.tasks.total}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E6E8EB] bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#00D985]" />
                <span className="text-sm text-[#6B7280]">Complétées</span>
              </div>
              <p className="text-2xl font-bold text-[#00D985]">{performance.tasks.completed}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E6E8EB] bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-sm text-[#6B7280]">En attente</span>
              </div>
              <p className="text-2xl font-bold text-[#F59E0B]">{performance.tasks.pending}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E6E8EB] bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="text-sm text-[#6B7280]">En retard</span>
              </div>
              <p className="text-2xl font-bold text-[#EF4444]">{performance.tasks.overdue}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Taux de complétion</span>
              <span className="text-sm font-semibold text-[#1B1F24]">
                {performance.tasks.completionRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-[#F1F3F5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00D985] to-[#00B870] rounded-full transition-all duration-500"
                style={{ width: `${performance.tasks.completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="border-[#E6E8EB] bg-gradient-to-br from-[#F8F9FA] to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#1A6BFF]/10">
              <Award className="h-6 w-6 text-[#1A6BFF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1B1F24] mb-1">Résumé de performance</h3>
              <p className="text-sm text-[#6B7280]">
                Cet utilisateur a traité{" "}
                <span className="font-semibold text-[#1B1F24]">{performance.leads.total}</span>{" "}
                leads avec un taux de conversion de{" "}
                <span className="font-semibold text-[#00D985]">
                  {performance.leads.conversionRate.toFixed(1)}%
                </span>
                . Le temps moyen de conversion est de{" "}
                <span className="font-semibold text-[#1B1F24]">
                  {performance.leads.avgTimeToConvert > 0
                    ? `${performance.leads.avgTimeToConvert} jours`
                    : "N/A"}
                </span>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#E6E8EB]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-5">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

