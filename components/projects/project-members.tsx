"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, UserX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

type ProjectMembersProps = {
  projectId: string;
};

export function ProjectMembers({ projectId }: ProjectMembersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", "project-members"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const users = usersData?.users || [];
  const members = project?.members || [];
  const memberUserIds = members.map((m: any) => m.userId);
  const availableUsers = users.filter((u: any) => !memberUserIds.includes(u.id));

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setAddMemberDialogOpen(false);
      setSelectedUserId("");
      toast({
        title: "Membre ajouté",
        description: "Le membre a été ajouté au projet avec succès.",
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

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré du projet avec succès.",
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

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: "Propriétaire",
      member: "Membre",
      viewer: "Observateur",
    };
    return labels[role] || role;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Membres du projet</CardTitle>
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un membre</DialogTitle>
              <DialogDescription>
                Sélectionnez un utilisateur à ajouter au projet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (selectedUserId) {
                    addMemberMutation.mutate(selectedUserId);
                  }
                }}
                disabled={!selectedUserId || addMemberMutation.isPending}
              >
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-center py-8 text-text-body">Aucun membre</p>
        ) : (
          <div className="space-y-4">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.avatar || undefined} />
                    <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A]">
                      {getInitials(member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-text-main">
                      {member.user.email.split("@")[0]}
                    </p>
                    <p className="text-sm text-text-body">{member.user.email}</p>
                  </div>
                  <Badge variant="secondary">{getRoleLabel(member.role)}</Badge>
                </div>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMemberMutation.mutate(member.userId)}
                    disabled={removeMemberMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

