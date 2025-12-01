"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, CheckCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "recharts";

type PortalData = {
  account: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
  stats: {
    totalLeads: number;
    leadsByStatus: Array<{ status: string; count: number }>;
    contactRate: number;
    conversionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    createdAt: string;
  }>;
};

type AccountFile = {
  id: string;
  fileName: string;
  fileSize: number;
  description?: string;
  category: string;
  createdAt: string;
  fileUrl: string;
};

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#9CA3AF"];

export default function GuestPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading } = useQuery<PortalData>({
    queryKey: ["portal", token],
    queryFn: async () => {
      const res = await fetch(`/api/portal/${token}`);
      if (!res.ok) throw new Error("Failed to fetch portal data");
      return res.json();
    },
  });

  // Fetch public files for this account
  const { data: files = [] } = useQuery<AccountFile[]>({
    queryKey: ["portal-files", data?.account.id],
    queryFn: async () => {
      if (!data?.account.id) return [];
      const res = await fetch(`/api/accounts/${data.account.id}/files`);
      if (!res.ok) return [];
      const allFiles = await res.json();
      // Filter to only public files
      return allFiles.filter((f: any) => f.isPublic);
    },
    enabled: !!data?.account.id,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-body text-muted-foreground">Invalid portal token</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = data.stats.leadsByStatus.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {data.account.logoUrl ? (
              <img
                src={data.account.logoUrl}
                alt={data.account.companyName}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <Building2 className="h-6 w-6 text-primary-500" />
              </div>
            )}
            <div>
              <h1 className="text-h1">{data.account.companyName}</h1>
              <p className="text-body text-muted-foreground">Campaign Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm">Total Prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-kpi">{data.stats.totalLeads}</div>
              <p className="text-caption text-muted-foreground">All campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm">Contact Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-kpi">{data.stats.contactRate.toFixed(1)}%</div>
              <p className="text-caption text-muted-foreground">Prospects contacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm">Conversion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-kpi">{data.stats.conversionRate.toFixed(1)}%</div>
              <p className="text-caption text-muted-foreground">Qualified prospects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm">Active Campaigns</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-kpi">
                {data.stats.leadsByStatus.filter((s) => s.status === "Active").length}
              </div>
              <p className="text-caption text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Prospects by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stats.leadsByStatus}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-body text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium capitalize">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Downloadable Files */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Files & Documents</CardTitle>
              <CardDescription>Download campaign files and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-primary-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-main truncate">{file.fileName}</p>
                        <p className="text-sm text-text-body">
                          {formatFileSize(file.fileSize)} • {file.category} •{" "}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                        {file.description && (
                          <p className="text-sm text-text-body mt-1">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={file.fileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

