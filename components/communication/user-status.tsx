"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket-client";
import { cn } from "@/lib/utils";

type UserStatusProps = {
  userId: string;
  className?: string;
};

export function UserStatus({ userId, className }: UserStatusProps) {
  const { on, off, socket } = useSocket();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!socket?.connected) return;

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === userId) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      if (data.userId === userId) {
        setIsOnline(false);
      }
    };

    // Request initial status
    socket.emit("user:status", { userId });

    on("user:online", handleUserOnline);
    on("user:offline", handleUserOffline);

    return () => {
      off("user:online");
      off("user:offline");
    };
  }, [socket, userId, on, off]);

  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full",
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
      title={isOnline ? "En ligne" : "Hors ligne"}
    />
  );
}

