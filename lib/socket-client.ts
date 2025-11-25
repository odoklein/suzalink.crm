"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

type SocketEvents = {
  "message:new": (message: any) => void;
  "message:updated": (message: any) => void;
  "message:deleted": (data: { messageId: string; conversationId: string }) => void;
  "typing:start": (data: { conversationId: string; userId: string; userName: string }) => void;
  "typing:stop": (data: { conversationId: string; userId: string }) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string }) => void;
  "conversation:updated": (conversation: any) => void;
};

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Connect to Socket.io server
    // For development, use the same origin; for production, configure NEXT_PUBLIC_SOCKET_URL
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    
    const socket = io(socketUrl, {
      path: "/api/socket",
      auth: {
        userId: session.user.id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  const emit = <K extends keyof SocketEvents>(
    event: K,
    data: Parameters<SocketEvents[K]>[0] extends (...args: any[]) => void
      ? Parameters<Parameters<SocketEvents[K]>[0]>[0]
      : never
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = <K extends keyof SocketEvents>(
    event: K,
    handler: SocketEvents[K]
  ) => {
    socketRef.current?.on(event, handler as any);
  };

  const off = <K extends keyof SocketEvents>(event: K) => {
    socketRef.current?.off(event);
  };

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };
}

