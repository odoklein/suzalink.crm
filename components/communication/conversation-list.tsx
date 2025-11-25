"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserStatus } from "./user-status";

type Conversation = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  lastMessage: {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      avatar: string | null;
    };
  } | null;
  unreadCount: number;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      avatar: string | null;
    };
  }>;
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (conversation: Conversation, currentUserId?: string) => {
    if (conversation.type === "GROUP") {
      return conversation.name || "Groupe sans nom";
    }
    // For direct messages, show the other participant's email
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.user.email.split("@")[0] || "Unknown";
  };

  const getAvatar = (conversation: Conversation, currentUserId?: string) => {
    if (conversation.type === "GROUP") {
      return null;
    }
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.user.avatar || null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className="divide-y divide-[#E5E7EB]">
      {conversations.map((conversation) => {
        const isSelected = selectedId === conversation.id;
        const displayName = getDisplayName(conversation, currentUserId);
        const avatar = getAvatar(conversation, currentUserId);
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== currentUserId
        );

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "w-full p-4 text-left hover:bg-[#F9FAFB] transition-colors",
              isSelected && "bg-[#F9FAFB] border-l-4 border-[#3BBF7A]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A]">
                    {getInitials(otherParticipant?.user.email || displayName)}
                  </AvatarFallback>
                </Avatar>
                {conversation.type === "DIRECT" && otherParticipant && (
                  <UserStatus
                    userId={otherParticipant.userId}
                    className="absolute bottom-0 right-0 border-2 border-white rounded-full"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-text-main truncate">{displayName}</p>
                  {conversation.lastMessage && (
                    <span className="text-xs text-text-body flex-shrink-0 ml-2">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-body truncate">
                    {conversation.lastMessage
                      ? conversation.lastMessage.content.substring(0, 50) + "..."
                      : "Aucun message"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-[#3BBF7A] text-white ml-2 flex-shrink-0">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

