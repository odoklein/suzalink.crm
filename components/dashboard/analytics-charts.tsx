"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, Users, Target, Clock, Activity } from "lucide-react";

interface ChartData {
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  campaignPerformance: Array<{
    name: string;
    leads: number;
    status: string;
  }>;
}

interface MetricsData {
  qualifiedLeads: number;
  contactedLeads: number;
  recentActivities: number;
  pipelineVelocity: number;
}

interface TrendsData {
  leads: {
    current: number;
    previous: number;
    change: string;
    isPositive: boolean;
  };
  activities: {
    current: number;
    previous: number;
    change: string;
    isPositive: boolean;
  };
}

const STATUS_COLORS = {
  'New': '#4C85FF',
  'Contacted': '#4C85FF',
  'Qualified': '#3BBF7A',
  'Nurture': '#FFA445',
  'Lost': '#FF4D4F'
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface AnalyticsChartsProps {
  charts: ChartData;
  metrics: MetricsData;
  trends: TrendsData;
}

export function AnalyticsCharts({ charts, metrics, trends }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Pipeline Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-body-sm font-medium text-text-body">Pipeline Metrics</CardTitle>
          <Target className="h-4 w-4 text-text-body" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-[28px] font-semibold text-text-main">{metrics.qualifiedLeads}</div>
              <p className="text-caption text-text-body">Qualified Leads</p>
            </div>
            <div>
              <div className="text-h2 font-semibold text-text-main">{metrics.contactedLeads}</div>
              <p className="text-caption text-text-body">Contacted This Month</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-body" />
              <span className="text-body-sm text-text-body">{metrics.pipelineVelocity} days avg velocity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Trends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-body-sm font-medium text-text-body">Activity Trends</CardTitle>
          <Activity className="h-4 w-4 text-text-body" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-[28px] font-semibold text-text-main">{metrics.recentActivities}</div>
              <p className="text-caption text-text-body">Activities This Week</p>
            </div>
            <div className="flex items-center gap-2">
              {trends.activities.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500" />
              )}
              <span className={`text-body-sm ${
                trends.activities.isPositive ? 'text-success-500' : 'text-danger-500'
              }`}>
                {trends.activities.change} vs last week
              </span>
            </div>
            <div className="flex items-center gap-2">
              {trends.leads.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500" />
              )}
              <span className={`text-body-sm ${
                trends.leads.isPositive ? 'text-success-500' : 'text-danger-500'
              }`}>
                {trends.leads.change} leads vs last month
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Status Distribution */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-text-main">Lead Status Distribution</CardTitle>
          <CardDescription className="text-text-body">Current pipeline breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {charts.statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#6B7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value} leads (${props.payload.percentage}%)`,
                    props.payload.status
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-text-main">Campaign Performance</CardTitle>
          <CardDescription className="text-text-body">Top performing campaigns by lead count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value} leads`,
                    `${props.payload.name} (${props.payload.status})`
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E6E8EB',
                    borderRadius: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    padding: '12px'
                  }}
                />
                <Bar 
                  dataKey="leads" 
                  fill="#3BBF7A"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
