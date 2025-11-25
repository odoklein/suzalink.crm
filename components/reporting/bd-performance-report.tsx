"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface BDPerformanceData {
  userId: string;
  email: string;
  callsPerDay: number;
  emailsPerDay: number;
  totalCalls: number;
  totalEmails: number;
  conversionRate: number;
  qualifiedLeads: number;
  totalLeads: number;
  pipelineValue: number;
  dailyActivity: Array<{
    date: string;
    calls: number;
    emails: number;
  }>;
}

export function BDPerformanceReport() {
  const [timeRange, setTimeRange] = useState("30");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [accountId, setAccountId] = useState<string>("all");

  const { data: bdPerformance, isLoading } = useQuery<BDPerformanceData[]>({
    queryKey: ["bd-performance", timeRange, campaignId, accountId],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        ...(campaignId !== "all" && { campaignId }),
        ...(accountId !== "all" && { accountId }),
      });
      const res = await fetch(`/api/reports/bd-performance?${params}`);
      if (!res.ok) throw new Error("Failed to fetch BD performance");
      return res.json();
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  const handleExport = async (format: "csv" | "pdf") => {
    const params = new URLSearchParams({
      timeRange,
      format,
      ...(campaignId !== "all" && { campaignId }),
      ...(accountId !== "all" && { accountId }),
    });
    window.open(`/api/reports/bd-performance/export?${params}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3BBF7A]" />
      </div>
    );
  }

  // Aggregate daily activity across all BDs
  const aggregatedDailyActivity = bdPerformance?.reduce((acc, bd) => {
    bd.dailyActivity?.forEach((day) => {
      const existing = acc.find((d) => d.date === day.date);
      if (existing) {
        existing.calls += day.calls;
        existing.emails += day.emails;
      } else {
        acc.push({ ...day });
      }
    });
    return acc;
  }, [] as Array<{ date: string; calls: number; emails: number }>) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-[#E6E8EB]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Période</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="365">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Campagne</label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les campagnes</SelectItem>
                  {campaigns?.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Compte</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les comptes</SelectItem>
                  {accounts?.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={() => handleExport("csv")}
                variant="outline"
                className="rounded-[12px]"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={() => handleExport("pdf")}
                variant="outline"
                className="rounded-[12px]"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Chart */}
      {aggregatedDailyActivity.length > 0 && (
        <Card className="border-[#E6E8EB]">
          <CardHeader>
            <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
              Activité quotidienne
            </CardTitle>
            <CardDescription className="text-body text-[#6B7280]">
              Volume d'appels et d'emails par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={aggregatedDailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tickFormatter={(value) => new Date(value).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E6E8EB",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#4C85FF"
                  strokeWidth={2}
                  name="Appels"
                />
                <Line
                  type="monotone"
                  dataKey="emails"
                  stroke="#3BBF7A"
                  strokeWidth={2}
                  name="Emails"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* BD Performance Table */}
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Performance des Business Developers
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Métriques détaillées par BD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BD</TableHead>
                <TableHead className="text-right">Appels/jour</TableHead>
                <TableHead className="text-right">Emails/jour</TableHead>
                <TableHead className="text-right">Total appels</TableHead>
                <TableHead className="text-right">Total emails</TableHead>
                <TableHead className="text-right">Taux de conversion</TableHead>
                <TableHead className="text-right">Leads qualifiés</TableHead>
                <TableHead className="text-right">Valeur pipeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bdPerformance?.map((bd) => (
                <TableRow key={bd.userId}>
                  <TableCell className="font-medium">
                    {bd.email.split("@")[0]}
                  </TableCell>
                  <TableCell className="text-right">{bd.callsPerDay.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{bd.emailsPerDay.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{bd.totalCalls}</TableCell>
                  <TableCell className="text-right">{bd.totalEmails}</TableCell>
                  <TableCell className="text-right">
                    {(bd.conversionRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {bd.qualifiedLeads} / {bd.totalLeads}
                  </TableCell>
                  <TableCell className="text-right">
                    {bd.pipelineValue.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

