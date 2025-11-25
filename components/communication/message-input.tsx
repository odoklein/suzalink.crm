"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/lib/socket-client";
import { useSession } from "next-auth/react";
import { AttachmentPreview } from "./attachment-preview";
import { FileAttachment } from "./file-attachment";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string | null;
};

type MessageInputProps = {
  conversationId: string;
  onMessageSent: () => void;
};

export function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { emit, socket } = useSocket();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  useEffect(() => {
    if (socket?.connected) {
      socket.emit("conversation:join", conversationId);
    }

    return () => {
      if (socket?.connected) {
        socket.emit("conversation:leave", conversationId);
        emit("typing:stop", { conversationId });
      }
    };
  }, [socket, conversationId, emit]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 300) {
      return;
    }

    if (socket?.connected) {
      emit("typing:start", { conversationId });
      lastTypingEmitRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket?.connected) {
        emit("typing:stop", { conversationId });
      }
    }, 2000);
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/conversations/${conversationId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return res.json();
    },
    onSuccess: (attachment) => {
      setAttachments((prev) => [...prev, attachment]);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; attachmentIds?: string[] }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          attachmentIds: data.attachmentIds,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setAttachments([]);
      if (socket?.connected) {
        emit("typing:stop", { conversationId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onMessageSent();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      uploadFileMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;
    
    sendMutation.mutate({
      content: content.trim(),
      attachmentIds: attachments.map((a) => a.id),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else {
      handleTyping();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      if (socket?.connected) {
        emit("typing:stop", { conversationId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  useKeyboardShortcuts([
    {
      key: "/",
      handler: () => {
        // Focus message input
      },
    },
  ]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex-shrink-0">
              {attachment.fileType === "image" ? (
                <AttachmentPreview
                  fileUrl={attachment.fileUrl}
                  fileName={attachment.fileName}
                  fileType={attachment.fileType}
                  thumbnailUrl={attachment.thumbnailUrl}
                  onRemove={() => handleRemoveAttachment(attachment.id)}
                  showRemove
                />
              ) : (
                <FileAttachment
                  fileUrl={attachment.fileUrl}
                  fileName={attachment.fileName}
                  fileType={attachment.fileType}
                  fileSize={attachment.fileSize}
                  onRemove={() => handleRemoveAttachment(attachment.id)}
                  showRemove
                />
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || sendMutation.isPending}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message..."
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={2}
        />
        <Button
          type="submit"
          size="sm"
          disabled={(!content.trim() && attachments.length === 0) || sendMutation.isPending || isUploading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

