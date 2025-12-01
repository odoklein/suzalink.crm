"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Award, ArrowRight, Download
} from "lucide-react";
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardContent } from "@/components/dashboard/shared/bento-card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface BdPerformance {
  id: string;
  email: string;
  leadsAssigned: number;
  bookingsThisWeek: number;
}

interface CampaignBooking {
  name: string;
  count: number;
}

interface PerformanceChartsProps {
  byCampaign: CampaignBooking[] | undefined;
  bdPerformance: BdPerformance[] | undefined;
  period?: string;
  onExport?: () => void;
}

export function PerformanceCharts({ 
  byCampaign, 
  bdPerformance,
  period = "7j",
  onExport
}: PerformanceChartsProps) {
  const weeklyRDVData = byCampaign?.slice(0, 6).map(c => ({
    name: c.name.length > 12 ? c.name.substring(0, 12) + "..." : c.name,
    fullName: c.name,
    count: c.count,
  })) || [];

  return (
    <div className="space-y-4">
      {/* RDV by Campaign Chart */}
      <BentoCard size="full" gradient="blue" delay={0} className="min-h-[320px]">
        <BentoCardHeader
          icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
          title={`RDV par campagne (${period})`}
          subtitle="Répartition des rendez-vous"
          iconBg="bg-blue-100"
          action={
            onExport && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={onExport}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            )
          }
        />
        <BentoCardContent>
          {weeklyRDVData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRDVData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6B7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      value, 
                      props.payload.fullName
                    ]}
                    labelFormatter={() => 'RDV'}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#1A6BFF" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[220px] text-center">
              <BarChart3 className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              <p className="text-xs text-muted-foreground mt-1">Les données apparaîtront ici</p>
            </div>
          )}
        </BentoCardContent>
      </BentoCard>

      {/* BD Leaderboard */}
      <BentoCard size="full" gradient="purple" delay={100} className="min-h-0">
        <BentoCardHeader
          icon={<Award className="h-4 w-4 text-purple-600" />}
          title={`Top BD (${period})`}
          subtitle="Classement par nombre de RDV"
          iconBg="bg-purple-100"
          action={
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        />
        <BentoCardContent>
          {bdPerformance?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bdPerformance.slice(0, 6).map((bd, i) => (
                <div 
                  key={bd.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                    i === 0 ? "bg-yellow-50 border border-yellow-200" :
                    i === 1 ? "bg-gray-50 border border-gray-200" :
                    i === 2 ? "bg-orange-50 border border-orange-200" :
                    "bg-white border border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn(
                      "text-lg font-bold w-6 text-center shrink-0",
                      i === 0 ? "text-yellow-600" : 
                      i === 1 ? "text-gray-500" : 
                      i === 2 ? "text-orange-600" : 
                      "text-gray-400"
                    )}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {bd.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {bd.leadsAssigned} leads
                      </span>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-xs h-6 px-2",
                    i === 0 ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                    i === 1 ? "bg-gray-100 text-gray-700 border-gray-300" :
                    i === 2 ? "bg-orange-100 text-orange-700 border-orange-300" :
                    "bg-purple-100 text-purple-700 border-purple-200"
                  )}>
                    {bd.bookingsThisWeek} RDV
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[120px] text-center">
              <Award className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            </div>
          )}
        </BentoCardContent>
      </BentoCard>
    </div>
  );
}

// Skeleton loader
export function PerformanceChartsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 h-[320px] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="h-[220px] bg-gray-100 rounded-lg" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
