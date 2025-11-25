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
        <Loader2 className="h-8 w-8 animate-spin text-[#1A6BFF]" />
      </div>
    );
  }

  const internalNotes = communications?.filter((c: any) => c.type === "internal_note") || [];
  const systemMessages = communications?.filter((c: any) => c.type === "system_message") || [];

  return (
    <div className="space-y-6">
      {/* Add Internal Note */}
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1A6BFF]/10">
              <Plus className="h-5 w-5 text-[#1A6BFF]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">
                Ajouter une note interne
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Visible uniquement par les administrateurs et gestionnaires
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-[#1B1F24]">Note</Label>
            <Textarea
              id="note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajoutez une note interne sur cet utilisateur..."
              rows={4}
              className="rounded-[12px] border-[#DEE2E6] focus:border-[#1A6BFF] focus:ring-[#1A6BFF]/20"
            />
          </div>
          <Button
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending}
            className="rounded-[12px] bg-[#1A6BFF] hover:bg-[#0F4FCC] shadow-sm hover:shadow-md transition-all duration-200"
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
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00D985]/10">
              <MessageSquare className="h-5 w-5 text-[#00D985]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">Notes internes</CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Notes ajoutées par les administrateurs et gestionnaires
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {internalNotes.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#6B7280]">Aucune note interne</p>
            </div>
          ) : (
            <div className="space-y-3">
              {internalNotes.map((note: any) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border border-[#E6E8EB] bg-gradient-to-br from-[#F8F9FA] to-white hover:border-[#DEE2E6] transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-[#00D985]/10 text-[#00D985] border-[#00D985]/20"
                      >
                        Note interne
                      </Badge>
                      <span className="text-xs text-[#9CA3AF]">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {note.createdBy && (
                      <span className="text-xs text-[#6B7280] font-medium">
                        Par {note.createdBy.email?.split("@")[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#1B1F24] whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Messages */}
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F59E0B]/10">
              <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">Messages système</CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Alertes et notifications système pour cet utilisateur
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {systemMessages.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#6B7280]">Aucun message système</p>
            </div>
          ) : (
            <div className="space-y-3">
              {systemMessages.map((message: any) => (
                <div
                  key={message.id}
                  className="p-4 rounded-xl border border-[#E6E8EB] hover:border-[#DEE2E6] transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        message.severity === "error"
                          ? "bg-[#EF4444]/10"
                          : message.severity === "warning"
                          ? "bg-[#F59E0B]/10"
                          : "bg-[#1A6BFF]/10"
                      }`}
                    >
                      <AlertCircle
                        className={`h-4 w-4 ${
                          message.severity === "error"
                            ? "text-[#EF4444]"
                            : message.severity === "warning"
                            ? "text-[#F59E0B]"
                            : "text-[#1A6BFF]"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`text-xs border ${
                            message.severity === "error"
                              ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                              : message.severity === "warning"
                              ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
                              : "bg-[#1A6BFF]/10 border-[#1A6BFF]/20 text-[#1A6BFF]"
                          }`}
                        >
                          {message.severity === "error"
                            ? "Erreur"
                            : message.severity === "warning"
                            ? "Avertissement"
                            : "Information"}
                        </Badge>
                        <span className="text-xs text-[#9CA3AF]">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1B1F24] mb-0.5">{message.title}</p>
                      <p className="text-sm text-[#6B7280] leading-relaxed">{message.content}</p>
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




