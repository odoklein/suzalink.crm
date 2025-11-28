"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // TODO: Connect to Socket.io and update connection status
    // For now, simulate connection
    setIsConnected(true);

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 ${
        isConnected ? "border-[#3BBF7A] text-[#3BBF7A]" : "border-[#6B7280] text-[#6B7280]"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="text-xs">En direct</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Hors ligne</span>
        </>
      )}
    </Badge>
  );
}











