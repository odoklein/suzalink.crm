"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Activity {
  id: string;
  type: string;
  createdAt: string;
  leadId: string;
  campaignName: string;
  userEmail: string;
}

interface AccountActivityFeedProps {
  accountId: string;
  activities?: Activity[];
  isLoading?: boolean;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: Phone,
  EMAIL: Mail,
  NOTE: FileText,
  STATUS_CHANGE: UserCheck,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-700",
  EMAIL: "bg-purple-100 text-purple-700",
  NOTE: "bg-gray-100 text-gray-700",
  STATUS_CHANGE: "bg-green-100 text-green-700",
};

function ActivityItem({
  activity,
  index,
}: {
  activity: Activity;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTIVITY_ICONS[activity.type] || FileText;
  const colorClass = ACTIVITY_COLORS[activity.type] || "bg-gray-100 text-gray-700";

  return (
    <div
      className={cn(
        "group rounded-lg border p-3 transition-all duration-300 hover:bg-accent/50",
        "animate-in slide-in-from-right-4 fade-in",
        "cursor-pointer"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={colorClass}>
              {activity.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm font-medium text-text-main">
            {activity.userEmail}
          </p>
          <p className="text-sm text-text-body truncate">
            Campaign: {activity.campaignName}
          </p>
          {expanded && (
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              <p>Lead ID: {activity.leadId}</p>
              <p>Time: {new Date(activity.createdAt).toLocaleString()}</p>
            </div>
          )}
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

export function AccountActivityFeed({
  accountId,
  activities = [],
  isLoading = false,
}: AccountActivityFeedProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((activity) => activity.type === filter);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "500ms" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="CALL">Calls</SelectItem>
                <SelectItem value="EMAIL">Emails</SelectItem>
                <SelectItem value="NOTE">Notes</SelectItem>
                <SelectItem value="STATUS_CHANGE">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-body text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredActivities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



