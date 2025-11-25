"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket-client";
import { Loader2 } from "lucide-react";

type TypingIndicatorProps = {
  conversationId: string;
};

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { on, off } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      userName?: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    };

    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    on("typing:start", handleTypingStart);
    on("typing:stop", handleTypingStop);

    return () => {
      off("typing:start");
      off("typing:stop");
    };
  }, [conversationId, on, off]);

  if (typingUsers.size === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-text-body">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>
        {typingUsers.size === 1
          ? "Someone is typing..."
          : `${typingUsers.size} people are typing...`}
      </span>
    </div>
  );
}

