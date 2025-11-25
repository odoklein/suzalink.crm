"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, X, Archive, ArchiveRestore, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageSearch } from "./message-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type ConversationHeaderProps = {
  conversationId: string;
};

export function ConversationHeader({ conversationId }: ConversationHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (archive: boolean) => {
      const res = await fetch(`/api/conversations/${conversationId}/archive`, {
        method: archive ? "POST" : "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to archive conversation");
      }
      return res.json();
    },
    onSuccess: (_, archived) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast({
        title: archived ? "Conversation archivée" : "Conversation désarchivée",
        description: archived
          ? "La conversation a été archivée avec succès."
          : "La conversation a été désarchivée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !conversation) {
    return (
      <div className="border-b border-[#E5E7EB] p-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // For direct messages, show the other participant
  const otherParticipant =
    conversation.type === "DIRECT"
      ? conversation.participants.find((p: any) => p.userId !== conversation.createdById)
      : null;

  const displayName =
    conversation.type === "GROUP"
      ? conversation.name || "Groupe sans nom"
      : otherParticipant?.user.email.split("@")[0] || "Unknown";

  const avatar =
    conversation.type === "DIRECT"
      ? otherParticipant?.user.avatar || null
      : null;

  if (showSearch) {
    return (
      <MessageSearch
        conversationId={conversationId}
        onSearch={setSearchQuery}
        onClose={() => setShowSearch(false)}
      />
    );
  }

  return (
    <div className="border-b border-[#E5E7EB] p-4 bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A]">
            {getInitials(otherParticipant?.user.email || displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-text-main">{displayName}</h3>
          {conversation.type === "GROUP" && (
            <p className="text-sm text-text-body">
              {conversation.participants.length} participant
              {conversation.participants.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => archiveMutation.mutate(!conversation.archivedAt)}
              >
                {conversation.archivedAt ? (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Désarchiver
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {conversation.type === "GROUP" && (
            <div className="flex items-center gap-2 text-text-body">
              <Users className="h-5 w-5" />
              <span className="text-sm">{conversation.participants.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

