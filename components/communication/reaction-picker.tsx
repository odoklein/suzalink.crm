"use client";

import { useState } from "react";
import { Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];

type ReactionPickerProps = {
  messageId: string;
  conversationId: string;
  existingReactions?: Array<{
    emoji: string;
    userId: string;
    count: number;
  }>;
};

export function ReactionPicker({
  messageId,
  conversationId,
  existingReactions = [],
}: ReactionPickerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add reaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (reactionId: string) => {
      const res = await fetch(`/api/messages/${messageId}/reactions/${reactionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove reaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmojiClick = (emoji: string) => {
    // Check if user already reacted with this emoji
    const existing = existingReactions.find((r) => r.emoji === emoji);
    if (existing) {
      // Toggle: remove reaction if exists
      // Note: You'll need to pass reactionId from existingReactions
      // For now, we'll just add
      addReactionMutation.mutate(emoji);
    } else {
      addReactionMutation.mutate(emoji);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-4 gap-2">
          {EMOJI_LIST.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className="h-10 w-10 text-2xl hover:bg-gray-100"
              onClick={() => handleEmojiClick(emoji)}
              disabled={addReactionMutation.isPending}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

