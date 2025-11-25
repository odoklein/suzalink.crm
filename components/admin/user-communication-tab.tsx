"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, AlertCircle, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/help/empty-state";

interface UserCommunicationTabProps {
  userId: string;
}

export function UserCommunicationTab({ userId }: UserCommunicationTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: communications, isLoading } = useQuery({
    queryKey: ["user-communications", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/communications`);
      if (!res.ok) throw new Error("Failed to fetch communications");
      return res.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const res = await fetch(`/api/admin/users/${userId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "internal_note", content: note }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-communications", userId] });
      toast({
        title: "Note ajoutée",
        description: "La note interne a été enregistrée avec succès.",
      });
      setNewNote("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la note.",
        variant: "destructive",
      });
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une note.",
        variant: "destructive",
      });
      return;
    }
    addNoteMutation.mutate(newNote);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3BBF7A]" />
      </div>
    );
  }

  const internalNotes = communications?.filter((c: any) => c.type === "internal_note") || [];
  const systemMessages = communications?.filter((c: any) => c.type === "system_message") || [];

  return (
    <div className="space-y-6">
      {/* Add Internal Note */}
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Ajouter une note interne
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Ajoutez une note interne visible uniquement par les administrateurs et gestionnaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajoutez une note interne sur cet utilisateur..."
              rows={4}
              className="rounded-[12px]"
            />
          </div>
          <Button
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending}
            className="rounded-[12px]"
          >
            {addNoteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la note
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">Notes internes</CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Notes ajoutées par les administrateurs et gestionnaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {internalNotes.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aucune note interne"
              description="Aucune note interne n'a été ajoutée pour cet utilisateur."
            />
          ) : (
            <div className="space-y-4">
              {internalNotes.map((note: any) => (
                <div
                  key={note.id}
                  className="p-4 rounded-[12px] border border-[#E6E8EB] bg-[#F9FAFB]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Note interne
                      </Badge>
                      <span className="text-xs text-[#6B7280]">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {note.createdBy && (
                      <span className="text-xs text-[#6B7280]">
                        Par {note.createdBy.email?.split("@")[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#1B1F24] whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Messages */}
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">Messages système</CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Alertes et notifications système pour cet utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemMessages.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Aucun message système"
              description="Aucun message système n'a été généré pour cet utilisateur."
            />
          ) : (
            <div className="space-y-4">
              {systemMessages.map((message: any) => (
                <div
                  key={message.id}
                  className="p-4 rounded-[12px] border border-[#E6E8EB]"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            message.severity === "error"
                              ? "border-[#EF4444] text-[#EF4444]"
                              : message.severity === "warning"
                              ? "border-[#F59E0B] text-[#F59E0B]"
                              : ""
                          }`}
                        >
                          {message.severity === "error"
                            ? "Erreur"
                            : message.severity === "warning"
                            ? "Avertissement"
                            : "Information"}
                        </Badge>
                        <span className="text-xs text-[#6B7280]">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1B1F24] mb-1">{message.title}</p>
                      <p className="text-sm text-[#6B7280]">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



