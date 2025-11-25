import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      // Authenticate socket connection
      // You can pass token in handshake auth
      const userId = socket.handshake.auth?.userId;
      if (!userId) {
        return next(new Error("Authentication error"));
      }
      socket.data.userId = userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected: ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Emit online status
    socket.broadcast.emit("user:online", { userId });

    // Handle user status requests
    socket.on("user:status", (data: { userId: string }) => {
      // Check if user is online
      const userSockets = io.sockets.adapter.rooms.get(`user:${data.userId}`);
      const isOnline = userSockets && userSockets.size > 0;
      socket.emit("user:status:response", {
        userId: data.userId,
        isOnline,
      });
    });

    // Handle joining conversation rooms
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle typing indicators
    socket.on("typing:start", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected: ${socket.id}`);
      // Emit offline status
      socket.broadcast.emit("user:offline", { userId });
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Helper function to emit events
export function emitToConversation(
  conversationId: string,
  event: string,
  data: any
) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

