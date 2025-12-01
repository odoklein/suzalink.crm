"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  UserPlus,
} from "lucide-react";

type ActivityType = "call" | "email" | "meeting" | "qualified" | "lost" | "note" | "assigned";

interface ActivityItem {
  id: string;
  type: ActivityType;
  leadName: string;
  campaignName: string;
  description: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityConfig: Record<ActivityType, { icon: typeof Phone; color: string; bgColor: string }> = {
  call: {
    icon: Phone,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  email: {
    icon: Mail,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  meeting: {
    icon: Calendar,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  qualified: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  lost: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  note: {
    icon: MessageSquare,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  assigned: {
    icon: UserPlus,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
};

export function ActivityFeed({ activities, maxItems = 6 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <BentoCard size="md" gradient="blue" delay={200}>
      <BentoCardHeader
        icon={<Activity className="h-5 w-5 text-blue-600" />}
        title="Activité récente"
        subtitle="Vos dernières actions"
        iconBg="bg-blue-100"
      />

      {displayedActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Aucune activité récente</p>
          <p className="text-xs text-gray-400 mt-1">
            Commencez une session de prospection
          </p>
        </div>
      ) : (
        <div className="space-y-1 -mx-1">
          {displayedActivities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg",
                  "hover:bg-gray-50 transition-colors",
                  "animate-in fade-in-0 slide-in-from-left-2"
                )}
                style={{ animationDelay: `${(index + 4) * 50}ms` }}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {activity.leadName}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 truncate">
                      {activity.campaignName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {activity.description}
                  </p>
                </div>

                {/* Time */}
                <span className="text-[10px] text-gray-400 shrink-0">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: false,
                    locale: fr,
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
}


