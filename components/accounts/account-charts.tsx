"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartData {
  leadsByStatus: Array<{ status: string; count: number }>;
  activityTimeline?: Array<{ date: string; count: number }>;
  campaignPerformance?: Array<{ name: string; leads: number; converted: number }>;
}

interface AccountChartsProps {
  accountId: string;
  data?: ChartData;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  New: "#4C85FF",
  Contacted: "#FFA445",
  Qualified: "#3BBF7A",
  Nurture: "#A46CFF",
  Lost: "#EF4444",
  Locked: "#6B7280",
};

const CHART_COLORS = ["#4C85FF", "#FFA445", "#A46CFF", "#FF6D9D", "#20C4B5", "#10B981"];

export function AccountCharts({ accountId, data, isLoading }: AccountChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Transform leadsByStatus for pie chart
  const pieData = Object.entries(data.leadsByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] || CHART_COLORS[0],
  }));

  // Generate activity timeline if not provided (mock data for now)
  const activityData = data.activityTimeline || [
    { date: "Mon", count: 12 },
    { date: "Tue", count: 19 },
    { date: "Wed", count: 8 },
    { date: "Thu", count: 15 },
    { date: "Fri", count: 22 },
    { date: "Sat", count: 5 },
    { date: "Sun", count: 3 },
  ];

  // Campaign performance data
  const campaignData = data.campaignPerformance || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-text-main">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-sm text-text-body">
            {payload[0].name === "Leads" || payload[0].name === "Converted" ? (
              <span className={payload[0].name === "Converted" ? "text-primary-500" : ""}>
                {payload[0].name}: {payload[0].value}
              </span>
            ) : (
              <span className="text-primary-500">Count: {payload[0].value}</span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Leads by Status - Donut Chart */}
      <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle>Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline - Line Chart */}
      <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3BBF7A"
                strokeWidth={2}
                dot={{ fill: "#3BBF7A", r: 4 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance - Bar Chart */}
      {campaignData.length > 0 && (
        <Card
          className="md:col-span-2 animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: "400ms" }}
        >
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="leads" fill="#4C85FF" name="Leads" animationDuration={800} />
                <Bar dataKey="converted" fill="#3BBF7A" name="Converted" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



