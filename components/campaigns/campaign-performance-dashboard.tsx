"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

type CampaignPerformanceDashboardProps = {
  campaignId: string;
};

const COLORS = {
  primary: "#3BBF7A",
  secondary: "#4C85FF",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  purple: "#A46CFF",
  pink: "#FF6D9D",
  teal: "#20C4B5",
};

export function CampaignPerformanceDashboard({
  campaignId,
}: CampaignPerformanceDashboardProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["campaign-analytics", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-text-body">
        No analytics data available
      </div>
    );
  }

  const { leadMetrics, activityMetrics, bdPerformance } = analytics;

  // Prepare funnel data
  const funnelData = [
    {
      name: "Total",
      value: leadMetrics.total,
      fill: COLORS.primary,
    },
    {
      name: "Contacted",
      value: leadMetrics.contacted,
      fill: COLORS.secondary,
    },
    {
      name: "Qualified",
      value: leadMetrics.qualified,
      fill: COLORS.info,
    },
  ];

  // Prepare status distribution data
  const statusData = Object.entries(leadMetrics.byStatus || {}).map(
    ([status, count], index) => ({
      name: status,
      value: count as number,
      fill: Object.values(COLORS)[index % Object.values(COLORS).length],
    })
  );

  // Prepare BD performance data
  const bdPerformanceData = bdPerformance.map((bd: any) => ({
    name: bd.email.split("@")[0],
    leads: bd.leadCount,
    qualified: bd.qualifiedCount,
    conversionRate:
      bd.leadCount > 0 ? ((bd.qualifiedCount / bd.leadCount) * 100).toFixed(1) : 0,
  }));

  // Prepare activity breakdown data
  const activityData = [
    {
      name: "Calls",
      value: activityMetrics.callsMade || 0,
    },
    {
      name: "Emails",
      value: activityMetrics.emailsSent || 0,
    },
    {
      name: "Meetings",
      value: activityMetrics.meetingsScheduled || 0,
    },
    {
      name: "Notes",
      value: activityMetrics.notesLogged || 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Funnel Chart */}
      <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-text-main">
            Lead Progression Funnel
          </CardTitle>
          <CardDescription className="text-body text-text-body">
            Lead progression through the campaign pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E6E8EB",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution and Activity Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-h2 font-semibold text-text-main">
              Lead Status Distribution
            </CardTitle>
            <CardDescription className="text-body text-text-body">
              Distribution of leads by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-h2 font-semibold text-text-main">
              Activity Breakdown
            </CardTitle>
            <CardDescription className="text-body text-text-body">
              Total interactions by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E6E8EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BD Performance Comparison */}
      {bdPerformanceData.length > 0 && (
        <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-h2 font-semibold text-text-main">
              Business Developer Performance
            </CardTitle>
            <CardDescription className="text-body text-text-body">
              Performance comparison of assigned BDs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bdPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E6E8EB",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="leads" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                <Bar dataKey="qualified" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

