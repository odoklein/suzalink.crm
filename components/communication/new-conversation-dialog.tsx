"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (conversationId: string) => void;
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewConversationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [name, setName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: session } = useSession();
  
  const { data: usersData } = useQuery({
    queryKey: ["users", "conversations"],
    queryFn: async () => {
      const res = await fetch("/api/users?excludeCurrent=true");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: open,
  });

  const users = usersData?.users || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create conversation");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onSuccess(data.id);
      // Reset form
      setType("DIRECT");
      setName("");
      setSelectedUserId("");
      toast({
        title: "Conversation créée",
        description: "La conversation a été créée avec succès.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "DIRECT" && !selectedUserId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur",
        variant: "destructive",
      });
      return;
    }
    if (type === "GROUP" && !name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est requis",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      type,
      name: type === "GROUP" ? name.trim() : undefined,
      participantIds: type === "DIRECT" ? [selectedUserId] : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Créez une conversation directe ou un groupe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type de conversation</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as "DIRECT" | "GROUP")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DIRECT" id="direct" />
                <Label htmlFor="direct" className="font-normal cursor-pointer">
                  Message direct
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="GROUP" id="group" />
                <Label htmlFor="group" className="font-normal cursor-pointer">
                  Groupe
                </Label>
              </div>
            </RadioGroup>
          </div>

          {type === "DIRECT" ? (
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="name">Nom du groupe</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du groupe"
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

