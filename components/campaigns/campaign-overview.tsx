"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CampaignKpiCard } from "./campaign-kpi-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type CampaignOverviewProps = {
  campaignId: string;
  onLeadClick?: (leadId: string) => void;
};

type AnalyticsData = {
  leadMetrics: {
    total: number;
    byStatus: Record<string, number>;
    contacted: number;
    contactedRate: number;
    qualified: number;
    conversionRate: number;
    withEmail: number;
    withPhone: number;
    emailRate: number;
    phoneRate: number;
  };
  activityMetrics: {
    total: number;
    byType: Record<string, number>;
    callsMade: number;
    emailsSent: number;
    notesLogged: number;
    meetingsScheduled: number;
    recentActivities: number;
    activityTrend: number;
  };
  bdPerformance: Array<{
    bdId: string;
    email: string;
    avatar?: string | null;
    assignedAt: string;
    leadCount: number;
    qualifiedCount: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata?: any;
    lead: {
      id: string;
      standardData: any;
    };
    user: {
      id: string;
      email: string;
      avatar?: string | null;
    };
  }>;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "CALL":
      return Phone;
    case "EMAIL":
      return Mail;
    case "NOTE":
      return FileText;
    case "STATUS_CHANGE":
      return Activity;
    default:
      return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "CALL":
      return "text-info-500";
    case "EMAIL":
      return "text-success-text";
    case "NOTE":
      return "text-warning-500";
    case "STATUS_CHANGE":
      return "text-purple-500";
    default:
      return "text-text-body";
  }
};

const getActivityGradient = (type: string) => {
  switch (type) {
    case "CALL":
      return "bg-gradient-to-br from-info-500 to-info-400";
    case "EMAIL":
      return "bg-gradient-to-br from-success-text to-success-500";
    case "NOTE":
      return "bg-gradient-to-br from-warning-500 to-[#F59E0B]";
    case "STATUS_CHANGE":
      return "bg-gradient-to-br from-purple-500 to-purple-400";
    default:
      return "bg-gradient-to-br from-text-body to-[#6B7280]";
  }
};

const getActivityBorder = (type: string) => {
  switch (type) {
    case "CALL":
      return "border-info-200";
    case "EMAIL":
      return "border-success-200";
    case "NOTE":
      return "border-warning-200";
    case "STATUS_CHANGE":
      return "border-purple-200";
    default:
      return "border-border";
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function CampaignOverview({ campaignId, onLeadClick }: CampaignOverviewProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
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
        <div className="grid gap-8 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-2 border-transparent">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded-xl" />
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

  const { leadMetrics, activityMetrics, bdPerformance, recentActivities } = analytics;

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid gap-8 md:grid-cols-4">
        <CampaignKpiCard
          title="Total Leads"
          value={leadMetrics.total}
          icon={Users}
          subtitle={`${leadMetrics.withEmail} with email`}
          colorClass="text-info-500"
          iconBgColor="bg-gradient-to-br from-info-light to-[#DBEAFE]"
        />
        <CampaignKpiCard
          title="Contacted Rate"
          value={`${leadMetrics.contactedRate.toFixed(1)}%`}
          icon={TrendingUp}
          subtitle={`${leadMetrics.contacted} of ${leadMetrics.total} leads`}
          colorClass="text-primary-500"
          iconBgColor="bg-gradient-to-br from-primary-100 to-primary-50"
        />
        <CampaignKpiCard
          title="Qualified Leads"
          value={leadMetrics.qualified}
          icon={Activity}
          subtitle={`${leadMetrics.conversionRate.toFixed(1)}% conversion`}
          colorClass="text-success-text"
          iconBgColor="bg-gradient-to-br from-success-100 to-[#D1FAE5]"
        />
        <CampaignKpiCard
          title="Active This Week"
          value={activityMetrics.recentActivities}
          icon={Clock}
          trend={activityMetrics.activityTrend}
          subtitle="activities"
          colorClass="text-warning-500"
          iconBgColor="bg-gradient-to-br from-warning-100 to-[#FEF3C7]"
        />
      </div>

      {/* Middle Section: BDs and Activity Breakdown */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Assigned BDs */}
        <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-h2 font-semibold text-text-main">Assigned Business Developers</CardTitle>
            <CardDescription className="text-body text-text-body mt-1">
              {bdPerformance.length} BD{bdPerformance.length !== 1 ? "s" : ""} working this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bdPerformance.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-10 w-10 text-text-body mb-3 opacity-50" />
                <p className="text-body text-text-body font-medium">
                  No BDs assigned yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bdPerformance.map((bd) => (
                  <div
                    key={bd.bdId}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border-light hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent hover:border-primary-200 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-border-light group-hover:ring-primary-200 transition-all duration-200">
                      <AvatarImage src={bd.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-400 text-white font-semibold shadow-sm">
                        {bd.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-main truncate mb-1">
                        {bd.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-text-body font-medium">
                        {bd.leadCount} lead{bd.leadCount !== 1 ? "s" : ""} • {bd.qualifiedCount} qualified
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-primary-50 border-primary-200 text-primary-500 font-medium px-2.5 py-1"
                      >
                        Assigned {new Date(bd.assignedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Breakdown */}
        <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-h2 font-semibold text-text-main">Campaign Activity</CardTitle>
            <CardDescription className="text-body text-text-body mt-1">
              Total interactions: <span className="font-semibold text-text-main">{activityMetrics.total}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-info-light/60 to-info-light/30 border border-info-500/20 hover:border-info-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl p-2.5 bg-gradient-to-br from-info-500 to-info-400 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-text-main">Calls Made</span>
                </div>
                <span className="text-xl font-bold text-info-500">
                  {activityMetrics.callsMade}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-success-100/60 to-success-100/30 border border-success-500/20 hover:border-success-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl p-2.5 bg-gradient-to-br from-success-text to-success-500 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-text-main">Emails Sent</span>
                </div>
                <span className="text-xl font-bold text-success-text">
                  {activityMetrics.emailsSent}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-warning-100/60 to-warning-100/30 border border-warning-500/20 hover:border-warning-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl p-2.5 bg-gradient-to-br from-warning-500 to-[#F59E0B] shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-text-main">Meetings Scheduled</span>
                </div>
                <span className="text-xl font-bold text-warning-500">
                  {activityMetrics.meetingsScheduled}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#F3F4F6] to-[#E5E7EB] border border-border hover:border-primary-200 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl p-2.5 bg-gradient-to-br from-text-body to-[#6B7280] shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-text-main">Notes Logged</span>
                </div>
                <span className="text-xl font-bold text-text-main">
                  {activityMetrics.notesLogged}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card className="border-2 border-transparent hover:border-primary-200 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-h2 font-semibold text-text-main">Recent Activity</CardTitle>
          <CardDescription className="text-body text-text-body mt-1">
            Latest interactions across all campaign leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-14 w-14 text-text-body mb-4 opacity-40" />
              <p className="text-body text-text-body font-medium">No activities yet</p>
              <p className="text-sm text-text-body mt-1">Activities will appear here as they happen</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary-200 via-primary-100 to-transparent rounded-full" />
              <div className="space-y-6">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const leadName = `${activity.lead.standardData?.firstName || ""} ${
                    activity.lead.standardData?.lastName || ""
                  }`.trim() || "Unknown Lead";

                  return (
                    <div 
                      key={activity.id} 
                      className="relative flex gap-4 pl-12 group hover:translate-x-1 transition-transform duration-200"
                    >
                      <div
                        className={`absolute left-0 rounded-xl p-2.5 ${getActivityGradient(activity.type)} border-2 ${getActivityBorder(activity.type)} shadow-sm group-hover:scale-110 transition-transform duration-200`}
                      >
                        <ActivityIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 pb-2 pt-0.5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-main mb-1">
                              {activity.type === "CALL" && "Call logged"}
                              {activity.type === "EMAIL" && "Email sent"}
                              {activity.type === "NOTE" && "Note added"}
                              {activity.type === "STATUS_CHANGE" && "Status updated"}
                            </p>
                            <p className="text-xs text-text-body font-medium mb-1">
                              <button
                                onClick={() => onLeadClick && onLeadClick(activity.lead.id)}
                                className="hover:text-primary-500 transition-colors cursor-pointer font-semibold"
                              >
                                {leadName}
                              </button> • by <span className="text-primary-500">{activity.user.email.split("@")[0]}</span>
                            </p>
                            {activity.metadata && (
                              <p className="text-xs text-text-body mt-1 line-clamp-1">
                                {activity.metadata.outcome || activity.metadata.subject || ""}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-text-body whitespace-nowrap font-medium bg-[#F8FAF9] px-2.5 py-1 rounded-md">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


