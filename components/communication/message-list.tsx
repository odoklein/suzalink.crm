"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/lib/socket-client";
import { TypingIndicator } from "./typing-indicator";
import { MessageItem } from "./message-item";
import { DateSeparator } from "./date-separator";
import { PinnedMessages } from "./pinned-messages";
import { isSameDay } from "date-fns";

type Message = {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    avatar: string | null;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string | null;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{
      id: string;
      email: string;
      avatar: string | null;
    }>;
  }>;
};

type MessageListProps = {
  conversationId: string;
};

export function MessageList({ conversationId }: MessageListProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, off, socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: messagesData, isLoading } = useQuery<{
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
  }>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    // Remove polling, use Socket.io instead
    refetchInterval: false,
  });

  // Update messages from query data
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Join conversation room and set up real-time listeners
  useEffect(() => {
    if (!socket?.connected) return;

    socket.emit("conversation:join", conversationId);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    const handleUpdatedMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    };

    const handleDeletedMessage = (data: {
      messageId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId ? { ...m, deletedAt: new Date().toISOString() } : m
          )
        );
      }
    };

    on("message:new", handleNewMessage);
    on("message:updated", handleUpdatedMessage);
    on("message:deleted", handleDeletedMessage);

    return () => {
      socket.emit("conversation:leave", conversationId);
      off("message:new");
      off("message:updated");
      off("message:deleted");
    };
  }, [socket, conversationId, on, off, queryClient]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      fetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
      }).catch(console.error);
    }
  }, [conversationId, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-body">Chargement des messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-body">Aucun message. Commencez la conversation !</p>
      </div>
    );
  }

  // Group messages by date
  const shouldShowDateSeparator = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    if (!currentMessage || !previousMessage) return false;
    
    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);
    return !isSameDay(currentDate, previousDate);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <PinnedMessages conversationId={conversationId} />
      {messages.map((message, index) => (
        <div key={message.id}>
          {shouldShowDateSeparator(index) && (
            <DateSeparator date={new Date(message.createdAt)} />
          )}
          <MessageItem message={message} />
        </div>
      ))}
      <TypingIndicator conversationId={conversationId} />
      <div ref={messagesEndRef} />
    </div>
  );
}

