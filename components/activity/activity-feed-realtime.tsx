"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "./activity-feed";

interface ActivityFeedRealtimeProps {
  leadId: string;
}

export function ActivityFeedRealtime({ leadId }: ActivityFeedRealtimeProps) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Subscribe to Socket.io events for real-time activity updates
    // socket.on(`lead:${leadId}:activity`, (newActivity) => {
    //   setActivities((prev) => [newActivity, ...prev]);
    // });

    return () => {
      // Cleanup socket listeners
    };
  }, [leadId]);

  return <ActivityFeed leadId={leadId} />;
}














