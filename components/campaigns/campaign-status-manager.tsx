"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  CheckCircle,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadStatusConfig {
  id: string;
  campaignId: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isFinal: boolean;
  _count?: {
    leads: number;
  };
}

interface CampaignStatusManagerProps {
  campaignId: string;
}

const PRESET_COLORS = [
  "#6B7280", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
];

function SortableStatusItem({
  status,
  onEdit,
  onDelete,
}: {
  status: LeadStatusConfig;
  onEdit: (status: LeadStatusConfig) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white rounded-lg border border-border",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        className="cursor-grab text-text-muted hover:text-text-body touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: status.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-heading truncate">
            {status.name}
          </span>
          {status.isDefault && (
            <Badge variant="outline" className="text-xs bg-primary-50 text-primary-700 border-primary-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Défaut
            </Badge>
          )}
          {status.isFinal && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              <Flag className="h-3 w-3 mr-1" />
              Final
            </Badge>
          )}
        </div>
        {status._count && (
          <span className="text-xs text-text-muted">
            {status._count.leads} lead{status._count.leads !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(status)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => onDelete(status.id)}
          disabled={status._count && status._count.leads > 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CampaignStatusManager({ campaignId }: CampaignStatusManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatusConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#6B7280",
    isDefault: false,
    isFinal: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: statuses = [], isLoading } = useQuery<LeadStatusConfig[]>({
    queryKey: ["campaign-statuses", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses`);
      if (!res.ok) throw new Error("Failed to fetch statuses");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-statuses", campaignId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Statut créé", description: "Le statut a été créé avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-statuses", campaignId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Statut mis à jour", description: "Le statut a été modifié" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-statuses", campaignId] });
      toast({ title: "Statut supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedStatuses: { id: string; order: number }[]) => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses: reorderedStatuses }),
      });
      if (!res.ok) throw new Error("Failed to reorder statuses");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-statuses", campaignId] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", color: "#6B7280", isDefault: false, isFinal: false });
    setEditingStatus(null);
  };

  const handleEdit = (status: LeadStatusConfig) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      isDefault: status.isDefault,
      isFinal: status.isFinal,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
      return;
    }

    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(statuses, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      queryClient.setQueryData(["campaign-statuses", campaignId], reordered);
      
      // Send reorder request
      reorderMutation.mutate(
        reordered.map((s, index) => ({ id: s.id, order: index }))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-heading">Statuts des leads</h3>
          <p className="text-sm text-text-muted">
            Glissez-déposez pour réorganiser les statuts
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-text-muted">Aucun statut configuré</p>
          <Button
            variant="link"
            onClick={() => setDialogOpen(true)}
            className="mt-2"
          >
            Créer le premier statut
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={statuses.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {statuses.map((status) => (
                <SortableStatusItem
                  key={status.id}
                  status={status}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Modifier le statut" : "Nouveau statut"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? "Modifiez les propriétés du statut"
                : "Créez un nouveau statut pour cette campagne"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du statut</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Contacté, RDV Placé, Qualifié..."
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      formData.color === color
                        ? "border-slate-900 scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Statut par défaut</Label>
                <p className="text-xs text-text-muted">
                  Appliqué aux nouveaux leads
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFinal">Statut final</Label>
                <p className="text-xs text-text-muted">
                  État terminal (Gagné, Perdu...)
                </p>
              </div>
              <Switch
                id="isFinal"
                checked={formData.isFinal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isFinal: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingStatus ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

