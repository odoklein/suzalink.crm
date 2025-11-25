"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  RefreshCw, 
  Filter,
  Loader2,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { 
  ActivityFeedItem, 
  getActivityIcon, 
  getActivityColor,
  formatActivityDescription 
} from "@/lib/notifications";

interface ActivityFeedResponse {
  activities: ActivityFeedItem[];
  total: number;
  hasMore: boolean;
}

interface ActivityFeedProps {
  limit?: number;
  targetId?: string;
  showHeader?: boolean;
  className?: string;
}

export function ActivityFeed({ 
  limit = 20, 
  targetId, 
  showHeader = true,
  className = "" 
}: ActivityFeedProps) {
  const { data, isLoading, refetch, isRefetching } = useQuery<ActivityFeedResponse>({
    queryKey: ["activity-feed", { limit, targetId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(targetId && { targetId }),
      });
      
      const res = await fetch(`/api/activity-feed?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activity feed");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const activities = data?.activities || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTargetUrl = (target: ActivityFeedItem['target']) => {
    if (!target) return null;
    
    switch (target.type) {
      case 'lead':
        return `/leads/${target.id}`;
      case 'campaign':
        return `/campaigns/${target.id}`;
      case 'account':
        return `/accounts/${target.id}`;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "" : "p-0"}>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-body text-muted-foreground">
              Loading activity feed...
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-body text-muted-foreground">
              No recent activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const targetUrl = getTargetUrl(activity.target);
              
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={activity.actor.avatar} />
                    <AvatarFallback className="bg-primary-100 text-primary-500 text-xs">
                      {getInitials(activity.actor.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-text-main">
                          <span className="font-medium">{activity.actor.name}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {activity.target && (
                            <>
                              {' '}
                              {targetUrl ? (
                                <Link 
                                  href={targetUrl}
                                  className="font-medium text-primary-500 hover:text-primary-600"
                                >
                                  {activity.target.name}
                                </Link>
                              ) : (
                                <span className="font-medium">{activity.target.name}</span>
                              )}
                            </>
                          )}
                        </p>
                        
                        {activity.description !== formatActivityDescription(activity) && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        {targetUrl && (
                          <Link href={targetUrl}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                      
                      {activity.target && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {activity.target.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {data?.hasMore && (
              <div className="text-center pt-4 border-t">
                <Button variant="outline" size="sm">
                  Load More Activities
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}





