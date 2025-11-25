"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttachmentPreview } from "./attachment-preview";
import { FileAttachment } from "./file-attachment";
import { MessageActions } from "./message-actions";
import { ReactionPicker } from "./reaction-picker";
import { useQueryClient } from "@tanstack/react-query";
import { UserStatus } from "./user-status";

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

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwn = message.userId === session?.user?.id;
  const isDeleted = !!message.deletedAt;

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn("flex gap-3 group", isOwn && "flex-row-reverse")}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.user.avatar || undefined} />
          <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A] text-xs">
            {getInitials(message.user.email)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
        {!isOwn && (
          <p className="text-xs text-text-body mb-1 px-2">
            {message.user.email.split("@")[0]}
          </p>
        )}
        <div className="relative">
          <div
            className={cn(
              "rounded-[12px] px-4 py-2 relative",
              isOwn
                ? "bg-[#3BBF7A] text-white"
                : "bg-[#F3F4F6] text-text-main"
            )}
          >
            {isDeleted ? (
              <p className="text-sm italic opacity-50">Message supprimé</p>
            ) : (
              <>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-transparent border-none outline-none resize-none text-sm"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          const res = await fetch(`/api/messages/${message.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ content: editContent }),
                          });
                          if (res.ok) {
                            setIsEditing(false);
                            queryClient.invalidateQueries({
                              queryKey: ["messages", message.conversationId],
                            });
                          }
                        }}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent(message.content);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    {message.attachments && message.attachments.length > 0 && (
                      <div
                        className={cn(
                          "mt-2 space-y-2",
                          message.content && "mt-2"
                        )}
                      >
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id}>
                            {attachment.fileType === "image" ? (
                              <AttachmentPreview
                                fileUrl={attachment.fileUrl}
                                fileName={attachment.fileName}
                                fileType={attachment.fileType}
                                thumbnailUrl={attachment.thumbnailUrl}
                              />
                            ) : (
                              <FileAttachment
                                fileUrl={attachment.fileUrl}
                                fileName={attachment.fileName}
                                fileType={attachment.fileType}
                                fileSize={attachment.fileSize}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.editedAt && (
                      <p className="text-xs opacity-70 mt-1">(modifié)</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          {!isDeleted && !isEditing && (
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageActions
                messageId={message.id}
                conversationId={message.conversationId}
                content={message.content}
                isOwn={isOwn}
                onEdit={() => setIsEditing(true)}
              />
            </div>
          )}
        </div>
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-2">
            {message.reactions.map((reaction, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 px-2">
          <p className="text-xs text-text-body">{formatTime(message.createdAt)}</p>
          {!isDeleted && (
            <ReactionPicker
              messageId={message.id}
              conversationId={message.conversationId}
              existingReactions={message.reactions}
            />
          )}
        </div>
      </div>
    </div>
  );
}

