"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess: () => void;
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: ProjectFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  // Fetch project if editing
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!projectId && open,
  });

  // Fetch users for member selection
  const { data: usersData } = useQuery({
    queryKey: ["users", "projects"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: open,
  });

  const users = usersData?.users || [];

  // Populate form when project is loaded
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "Planning");
      setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
      setEndDate(project.endDate ? project.endDate.split("T")[0] : "");
      setMemberIds(project.members?.map((m: any) => m.userId) || []);
    } else if (!projectId) {
      // Reset form for new project
      setName("");
      setDescription("");
      setStatus("Planning");
      setStartDate("");
      setEndDate("");
      setMemberIds([]);
    }
  }, [project, projectId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Projet créé",
        description: "Le projet a été créé avec succès.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update project");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Projet mis à jour",
        description: "Le projet a été mis à jour avec succès.",
      });
      onSuccess();
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
    if (!name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du projet est requis.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      memberIds: projectId ? undefined : memberIds, // Only set members on create
    };

    if (projectId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projectId ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          <DialogDescription>
            {projectId
              ? "Modifiez les informations du projet."
              : "Créez un nouveau projet pour organiser vos tâches."}
          </DialogDescription>
        </DialogHeader>
        {loadingProject ? (
          <div className="py-8 text-center text-text-body">Chargement...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du projet"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du projet"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planification</SelectItem>
                    <SelectItem value="InProgress">En cours</SelectItem>
                    <SelectItem value="OnHold">En attente</SelectItem>
                    <SelectItem value="Completed">Terminé</SelectItem>
                    <SelectItem value="Cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {!projectId && (
              <div className="space-y-2">
                <Label>Membres</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${user.id}`}
                        checked={memberIds.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <Label
                        htmlFor={`member-${user.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {user.email}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {projectId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

