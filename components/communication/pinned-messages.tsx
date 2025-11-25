"use client";

import { useQuery } from "@tanstack/react-query";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type PinnedMessagesProps = {
  conversationId: string;
};

export function PinnedMessages({ conversationId }: PinnedMessagesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
  });

  const { data: pinnedMessage } = useQuery({
    queryKey: ["message", conversation?.pinnedMessageId],
    queryFn: async () => {
      if (!conversation?.pinnedMessageId) return null;
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=1`
      );
      if (!res.ok) throw new Error("Failed to fetch pinned message");
      const data = await res.json();
      return data.messages.find(
        (m: any) => m.id === conversation.pinnedMessageId
      );
    },
    enabled: !!conversation?.pinnedMessageId,
  });

  const unpinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unpin message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast({
        title: "Message déépinglé",
        description: "Le message a été déépinglé avec succès.",
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

  if (!pinnedMessage) return null;

  return (
    <Card className="mb-4 border-primary-200 bg-primary-50">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Pin className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary-900 mb-1">
              Message épinglé
            </p>
            <p className="text-sm text-text-main line-clamp-2">
              {pinnedMessage.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => unpinMutation.mutate()}
            disabled={unpinMutation.isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

