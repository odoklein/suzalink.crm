"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus, Tag, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BDSelector } from "@/components/ui/bd-selector";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsProps {
  selectedLeadIds: string[];
  onSelectionChange: (ids: string[]) => void;
  statusOptions?: string[];
}

// Status labels in French
const STATUS_LABELS: Record<string, string> = {
  "New": "Nouveau",
  "Locked": "Verrouillé",
  "Contacted": "Contacté",
  "Qualified": "Qualifié",
  "Nurture": "En cours",
  "Lost": "Perdu",
};

export function BulkActions({
  selectedLeadIds,
  onSelectionChange,
  statusOptions = ["New", "Locked", "Contacted", "Qualified", "Nurture", "Lost"],
}: BulkActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedBDs, setSelectedBDs] = useState<string[]>([]);

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      data,
    }: {
      action: string;
      data?: any;
    }) => {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          action,
          data,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'action en masse");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onSelectionChange([]);
      setAssignDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedStatus("");
      setSelectedBDs([]);
      toast({
        title: "Succès",
        description: data.message || "Action en masse effectuée",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'action en masse",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    bulkMutation.mutate({
      action: "updateStatus",
      data: { status: selectedStatus },
    });
  };

  const handleAssign = () => {
    if (selectedBDs.length === 0) {
      bulkMutation.mutate({
        action: "unassign",
      });
    } else if (selectedBDs.length === 1) {
      bulkMutation.mutate({
        action: "assign",
        data: { assignedBdId: selectedBDs[0] },
      });
    } else {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un seul commercial",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    bulkMutation.mutate({
      action: "delete",
    });
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      leadIds: selectedLeadIds.join(","),
    });
    window.open(`/api/leads/export?${params}`, "_blank");
  };

  if (selectedLeadIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? "s" : ""} sélectionné{selectedLeadIds.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Changer le statut" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || bulkMutation.isPending}
          >
            <Tag className="mr-2 h-4 w-4" />
            Mettre à jour
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
            disabled={bulkMutation.isPending}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assigner
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={bulkMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Dialogue d'assignation */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner les leads</DialogTitle>
            <DialogDescription>
              Assigner {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? "s" : ""} sélectionné{selectedLeadIds.length !== 1 ? "s" : ""} à un commercial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <BDSelector
              value={selectedBDs}
              onChange={setSelectedBDs}
              placeholder="Sélectionner un commercial (laisser vide pour désassigner)"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={bulkMutation.isPending}>
              {selectedBDs.length === 0 ? "Désassigner" : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer les leads</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedLeadIds.length} lead{selectedLeadIds.length !== 1 ? "s" : ""} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={bulkMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
