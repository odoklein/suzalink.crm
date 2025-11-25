"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Star,
  Archive,
  MoreVertical,
  Send,
  Paperclip,
  AtSign,
  Type,
  Mail,
  User,
  Trash2,
  Loader2,
  Mic,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { NewConversationDialog } from "@/components/communication/new-conversation-dialog";
import { useSocket } from "@/lib/socket-client";

// Helper function to get initials from name/email
function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.split(/[@.\s]/);
  return parts
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return messageDate.toLocaleDateString();
}

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
  isOptimistic?: boolean; // For optimistic updates
};

export default function CommunicationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { socket, isConnected, emit, on, off } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [messageContent, setMessageContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const optimisticMessageIdRef = useRef(0);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch conversations
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery<{
    conversations: Conversation[];
    total: number;
  }>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    refetchInterval: false,
  });

  const conversations = conversationsData?.conversations || [];

  // Fetch selected conversation details
  const { data: selectedConversation } = useQuery({
    queryKey: ["conversation", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      const res = await fetch(`/api/conversations/${selectedConversationId}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!selectedConversationId,
  });

  // Fetch messages with pagination
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<{
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
  }>({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return { messages: [], nextCursor: null, hasMore: false };
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedConversationId,
  });

  // Reset pagination when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      setNextCursor(null);
      setHasMoreMessages(true);
    }
  }, [selectedConversationId]);

  // Mark conversation as read when selected
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsReadMutation.mutate(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Update messages state and pagination
  useEffect(() => {
    if (messagesData) {
      setHasMoreMessages(messagesData.hasMore);
      if (!nextCursor) {
        setNextCursor(messagesData.nextCursor);
      }
    }
  }, [messagesData]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket?.connected || !selectedConversationId) return;

    socket.emit("conversation:join", selectedConversationId);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === selectedConversationId) {
        queryClient.setQueryData(
          ["messages", selectedConversationId],
          (old: any) => {
            // Remove optimistic message if exists
            const filtered = (old?.messages || []).filter(
              (m: Message) => !m.isOptimistic || m.id !== `optimistic-${optimisticMessageIdRef.current}`
            );
            // Avoid duplicates
            if (filtered.some((m: Message) => m.id === message.id)) {
              return old;
            }
            return {
              messages: [...filtered, message],
              nextCursor: old?.nextCursor,
              hasMore: old?.hasMore,
            };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    const handleTypingStart = (data: { conversationId: string; userId: string; userName: string }) => {
      if (data.conversationId === selectedConversationId && data.userId !== session?.user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === selectedConversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    on("message:new", handleNewMessage);
    on("typing:start", handleTypingStart);
    on("typing:stop", handleTypingStop);

    return () => {
      socket.emit("conversation:leave", selectedConversationId);
      off("message:new");
      off("typing:start");
      off("typing:stop");
    };
  }, [socket, selectedConversationId, session?.user?.id, on, off, queryClient]);

  // Load more messages (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversationId || !hasMoreMessages || isLoadingMore || !nextCursor) return;
    
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages?cursor=${nextCursor}`);
      if (!res.ok) throw new Error("Failed to load more messages");
      const data = await res.json();
      
      // Append older messages to the beginning of the existing list
      queryClient.setQueryData(
        ["messages", selectedConversationId],
        (old: any) => ({
          messages: [...data.messages, ...(old?.messages || [])],
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
        })
      );
      
      setHasMoreMessages(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedConversationId, hasMoreMessages, isLoadingMore, nextCursor, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesData?.messages?.length) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messagesData?.messages?.length]);

  // Infinite scroll handler
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedConversationId) return;

    const handleScroll = () => {
      // Load more when scrolled to top (for older messages)
      if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore && nextCursor) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMoreMessages, isLoadingMore, selectedConversationId, nextCursor, loadMoreMessages]);

  // Typing indicator
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTyping = useCallback(() => {
    if (!selectedConversationId || !socket?.connected) return;
    
    socket?.emit("typing:start", { conversationId: selectedConversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", { conversationId: selectedConversationId });
    }, 3000);
  }, [selectedConversationId, socket]);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!selectedConversationId) {
      toast({
        title: "Error",
        description: "Please select a conversation first",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/conversations/${selectedConversationId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const attachment = await res.json();
      setPendingAttachments((prev) => [...prev, attachment]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        
        // Upload and send voice message
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await handleFileUpload(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      const attachmentIds = pendingAttachments.map((att) => att.id);
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachmentIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      setPendingAttachments([]);
      return res.json();
    },
    onMutate: async (content: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages", selectedConversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<{
        messages: Message[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(["messages", selectedConversationId]);

      // Optimistically update
      const optimisticId = `optimistic-${++optimisticMessageIdRef.current}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        conversationId: selectedConversationId!,
        userId: session?.user?.id || "",
        content,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        user: {
          id: session?.user?.id || "",
          email: session?.user?.email || "",
          avatar: session?.user?.avatar || null,
        },
        isOptimistic: true,
      };

      queryClient.setQueryData(
        ["messages", selectedConversationId],
        (old: any) => ({
          messages: [...(old?.messages || []), optimisticMessage],
          nextCursor: old?.nextCursor,
          hasMore: old?.hasMore,
        })
      );

      // Update conversation list
      queryClient.setQueryData(
        ["conversations"],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            conversations: old.conversations.map((conv: Conversation) =>
              conv.id === selectedConversationId
                ? {
                    ...conv,
                    lastMessage: {
                      id: optimisticId,
                      content,
                      userId: session?.user?.id || "",
                      createdAt: new Date().toISOString(),
                      user: {
                        id: session?.user?.id || "",
                        email: session?.user?.email || "",
                        avatar: session?.user?.avatar || null,
                      },
                    },
                  }
                : conv
            ),
          };
        }
      );

      return { previousMessages };
    },
    onSuccess: () => {
      setMessageContent("");
      setPendingAttachments([]);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket?.emit("typing:stop", { conversationId: selectedConversationId! });
      // Invalidate to get real message from server
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error, _content, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", selectedConversationId],
          context.previousMessages
        );
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const otherParticipant = conv.participants.find((p) => p.userId !== session?.user?.id);
    return (
      conv.name?.toLowerCase().includes(query) ||
      otherParticipant?.user.email.toLowerCase().includes(query)
    );
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
  if (!selectedConversationId && filteredConversations.length > 0) {
    setSelectedConversationId(filteredConversations[0].id);
  }
  }, [filteredConversations.length, selectedConversationId]);

  const messages = messagesData?.messages || [];
  const otherParticipant = selectedConversation?.participants?.find(
    (p: any) => p.userId !== session?.user?.id
  );
  const displayName = selectedConversation?.type === "GROUP"
    ? selectedConversation.name || "Group"
    : otherParticipant?.user.email.split("@")[0] || "Unknown";

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Conversation List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-sm">
          {/* Search and Filter Header */}
          <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <Button
              size="sm"
              onClick={() => setNewConversationDialogOpen(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
                placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary-500"
            />
          </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-10 w-10 hover:bg-gray-100 transition-colors">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoadingConversations ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                No conversations found
            </div>
          ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation, index) => {
                  const isSelected = selectedConversationId === conversation.id;
                  const otherParticipant = conversation.participants.find(
                    (p) => p.userId !== session?.user?.id
                  );
                  const displayName = conversation.type === "GROUP"
                    ? conversation.name || "Group"
                    : otherParticipant?.user.email.split("@")[0] || "Unknown";
                  const initials = getInitials(otherParticipant?.user.email || displayName);
                  const preview = conversation.lastMessage
                    ? conversation.lastMessage.content.length > 50
                      ? conversation.lastMessage.content.substring(0, 50) + "..."
                      : conversation.lastMessage.content
                    : "No messages yet";

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200",
                        isSelected && "bg-primary-50 border-l-4 border-l-primary-500 shadow-sm"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-offset-2 ring-transparent transition-all duration-200 hover:ring-primary-200">
                          <AvatarImage src={otherParticipant?.user.avatar || undefined} />
                          <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn(
                              "text-sm font-medium truncate transition-colors",
                              isSelected ? "text-primary-700" : "text-gray-900"
                            )}>
                              {displayName}
                            </p>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {formatRelativeTime(conversation.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600 truncate">
                              {preview}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center ml-2 flex-shrink-0 animate-pulse">
                                <span className="text-xs text-white font-medium">
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>

        {/* Center Column - Messages */}
      <div className="flex-1 flex flex-col bg-white">
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary-200">
                      <AvatarImage src={otherParticipant?.user.avatar || undefined} />
                      <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold">
                        {getInitials(otherParticipant?.user.email || displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
                      {selectedConversation.type === "GROUP" && (
                        <p className="text-sm text-gray-500">
                          {selectedConversation.participants?.length || 0} participants
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100 transition-colors">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100 transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 bg-gray-50"
              >
                {isLoadingMore && (
                  <div className="text-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary-500" />
                  </div>
                )}
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
                      <p className="text-gray-500">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.userId === session?.user?.id;
                      const messageUser = message.user;
                      const initials = getInitials(messageUser.email);
                      const isOptimistic = message.isOptimistic;
                      const showAvatar = index === 0 || messages[index - 1]?.userId !== message.userId;

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex items-end gap-2 group",
                            isOwnMessage && "flex-row-reverse",
                            "animate-in fade-in slide-in-from-bottom-2 duration-300",
                            isOptimistic && "opacity-70"
                          )}
                          style={{
                            animationDelay: `${index * 20}ms`,
                          }}
                        >
                          {showAvatar && (
                            <Avatar className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <AvatarImage src={messageUser.avatar || undefined} />
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && <div className="w-8" />}
                          <div className={cn(
                            "flex flex-col max-w-[70%]",
                            isOwnMessage && "items-end"
                          )}>
                            {showAvatar && (
                              <div className={cn(
                                "flex items-center gap-2 mb-1 px-1",
                                isOwnMessage && "flex-row-reverse"
                              )}>
                                <span className="text-xs font-medium text-gray-600">
                                  {isOwnMessage ? "You" : messageUser.email.split("@")[0]}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatRelativeTime(message.createdAt)}
                                </span>
                              </div>
                            )}
                            <div className={cn(
                              "rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 hover:shadow-md",
                              isOwnMessage
                                ? "bg-primary-500 text-white rounded-br-md"
                                : "bg-white text-gray-900 rounded-bl-md border border-gray-200",
                              isOptimistic && "animate-pulse"
                            )}>
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              {isOptimistic && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Loader2 className="h-3 w-3 animate-spin opacity-50" />
                                  <span className="text-xs opacity-50">Sending...</span>
                                </div>
                              )}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((att) => (
                                    <div key={att.id} className={cn(
                                      "p-2 rounded-lg flex items-center gap-2",
                                      isOwnMessage ? "bg-white/20" : "bg-gray-100"
                                    )}>
                                      <Paperclip className="h-4 w-4" />
                                      <span className="text-xs truncate">{att.fileName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {typingUsers.size > 0 && (
                      <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {getInitials(otherParticipant?.user.email || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2 border border-gray-200 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
                {/* Pending Attachments Preview */}
                {pendingAttachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm"
                      >
                        <Paperclip className="h-4 w-4 text-gray-600" />
                        <span className="truncate max-w-[200px]">{att.fileName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-gray-200"
                          onClick={() => {
                            setPendingAttachments((prev) =>
                              prev.filter((a) => a.id !== att.id)
                            );
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-gray-100 transition-colors"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-gray-100 transition-colors"
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                        // Reset input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      accept="image/*,application/pdf,.doc,.docx,.txt,audio/*"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-gray-100 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 transition-colors",
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "hover:bg-gray-100"
                      )}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] max-h-[200px] resize-none bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if ((messageContent.trim() || pendingAttachments.length > 0) && !sendMessageMutation.isPending) {
                          sendMessageMutation.mutate(messageContent);
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if ((messageContent.trim() || pendingAttachments.length > 0) && !sendMessageMutation.isPending) {
                        sendMessageMutation.mutate(messageContent);
                      }
                    }}
                    disabled={(!messageContent.trim() && pendingAttachments.length === 0) || sendMessageMutation.isPending}
                    className={cn(
                      "h-10 w-10 p-0 transition-all duration-200",
                      (messageContent.trim() || pendingAttachments.length > 0)
                        ? "bg-green-600 hover:bg-green-700 text-white hover:scale-105"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
            </div>
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center animate-in fade-in duration-300">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Participant Details */}
        {selectedConversation && otherParticipant && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto scrollbar-thin shadow-sm">
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-primary-100">
                  <AvatarImage src={otherParticipant.user.avatar || undefined} />
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xl font-semibold">
                    {getInitials(otherParticipant.user.email)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {otherParticipant.user.email.split("@")[0]}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{otherParticipant.user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={newConversationDialogOpen}
        onOpenChange={setNewConversationDialogOpen}
        onSuccess={(conversationId) => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          setSelectedConversationId(conversationId);
          setNewConversationDialogOpen(false);
        }}
      />
    </div>
  );
}
