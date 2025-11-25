"use client";

import { useState } from "react";
import { MoreVertical, Edit, Trash2, Copy, Smile, Pin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type MessageActionsProps = {
  messageId: string;
  conversationId: string;
  content: string;
  isOwn: boolean;
  isPinned?: boolean;
  onEdit?: () => void;
  onReaction?: () => void;
};

export function MessageActions({
  messageId,
  conversationId,
  content,
  isOwn,
  isPinned = false,
  onEdit,
  onReaction,
}: MessageActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès.",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copié",
      description: "Le message a été copié dans le presse-papiers.",
    });
  };

  const pinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: isPinned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to pin/unpin message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast({
        title: isPinned ? "Message déépinglé" : "Message épinglé",
        description: isPinned
          ? "Le message a été déépinglé avec succès."
          : "Le message a été épinglé avec succès.",
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

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handlePin = () => {
    pinMutation.mutate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </DropdownMenuItem>
          {onReaction && (
            <DropdownMenuItem onClick={onReaction}>
              <Smile className="h-4 w-4 mr-2" />
              Réagir
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handlePin}>
            <Pin className="h-4 w-4 mr-2" />
            {isPinned ? "Déépingler" : "Épingler"}
          </DropdownMenuItem>
          {isOwn && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
          )}
          {isOwn && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le message</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

