"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  Mail,
  FileText,
  Activity,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSection } from "./campaign-dashboard";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: string;
  createdAt: string;
  metadata?: Record<string, any>;
  lead?: {
    id: string;
    standardData: {
      firstName?: string;
      lastName?: string;
    };
  };
  user?: {
    id: string;
    email: string;
    avatar?: string | null;
  };
}

interface ActivityFeedWidgetProps {
  campaignId: string;
  maxItems?: number;
  onViewAll?: () => void;
}

const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: typeof Phone;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  CALL: {
    icon: Phone,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Call made",
  },
  EMAIL: {
    icon: Mail,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Email sent",
  },
  NOTE: {
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Note added",
  },
  STATUS_CHANGE: {
    icon: Activity,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    label: "Status changed",
  },
  MEETING: {
    icon: Calendar,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    label: "Meeting scheduled",
  },
  MESSAGE: {
    icon: MessageSquare,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    label: "Message sent",
  },
  COMPLETED: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed",
  },
};

const DEFAULT_CONFIG = {
  icon: Zap,
  color: "text-gray-600",
  bgColor: "bg-gray-100",
  label: "Activity",
};

function ActivityRow({
  activity,
  index,
}: {
  activity: ActivityItem;
  index: number;
}) {
  const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  const leadName = activity.lead?.standardData
    ? [
        activity.lead.standardData.firstName,
        activity.lead.standardData.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "Unknown lead";

  const userEmail = activity.user?.email || "System";
  const userName = userEmail.split("@")[0];

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });

  // Get description based on type and metadata
  let description = config.label;
  if (activity.type === "STATUS_CHANGE" && activity.metadata) {
    description = `Status: ${activity.metadata.newStatus || "Updated"}`;
  } else if (activity.type === "CALL" && activity.metadata?.duration) {
    description = `Call (${activity.metadata.duration}m)`;
  } else if (activity.type === "EMAIL" && activity.metadata?.subject) {
    description = `Email: ${activity.metadata.subject}`;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        index > 0 && "border-t border-gray-100",
        "animate-in fade-in slide-in-from-right-2"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900 truncate">{leadName}</p>
          <span className="text-[11px] text-gray-400 shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{description}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">by {userName}</p>
      </div>
    </div>
  );
}

function ActivitySkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn("flex items-start gap-3 py-3 animate-pulse", index > 0 && "border-t border-gray-100")}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-8 w-8 rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function ActivityFeedWidget({
  campaignId,
  maxItems = 6,
  onViewAll,
}: ActivityFeedWidgetProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["campaign-activities-preview", campaignId],
    queryFn: async () => {
      const res = await fetch(
        `/api/campaigns/${campaignId}/analytics?includeActivities=true`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.recentActivities || [];
    },
  });

  const displayActivities = activities.slice(0, maxItems);

  return (
    <DashboardSection
      title="Recent Activity"
      subtitle={`${activities.length} activities`}
      action={
        onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs text-primary-600"
            onClick={onViewAll}
          >
            View all
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )
      }
    >
      {isLoading ? (
        <div>
          {[...Array(4)].map((_, i) => (
            <ActivitySkeleton key={i} index={i} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">
            Activities will appear here as you work with leads
          </p>
        </div>
      ) : (
        <div>
          {displayActivities.map((activity: ActivityItem, index: number) => (
            <ActivityRow key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

// Team performance widget (optional companion)
interface TeamMember {
  id: string;
  email: string;
  avatar?: string | null;
  leadCount: number;
  qualifiedCount: number;
}

export function TeamPerformanceWidget({
  campaignId,
}: {
  campaignId: string;
}) {
  const { data: analytics } = useQuery({
    queryKey: ["campaign-analytics", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/analytics`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const team: TeamMember[] = analytics?.bdPerformance || [];

  if (team.length === 0) return null;

  return (
    <DashboardSection title="Team Performance" subtitle="Assigned BDs">
      <div className="space-y-3">
        {team.slice(0, 5).map((member, index) => {
          const email = member.email;
          const name = email.split("@")[0];
          const initials = name.slice(0, 2).toUpperCase();
          const qualifiedRate =
            member.leadCount > 0
              ? Math.round((member.qualifiedCount / member.leadCount) * 100)
              : 0;

          return (
            <div
              key={member.id || member.email || `team-${index}`}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors",
                "animate-in fade-in slide-in-from-right-2"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Avatar className="h-8 w-8 border border-gray-200">
                {member.avatar && <AvatarImage src={member.avatar} />}
                <AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate capitalize">
                  {name}
                </p>
                <p className="text-xs text-gray-500">
                  {member.leadCount} leads • {qualifiedRate}% qualified
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${qualifiedRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
}

