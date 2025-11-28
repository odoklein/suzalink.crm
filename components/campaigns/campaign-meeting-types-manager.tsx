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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  MapPin,
  Video,
  Phone,
  Monitor,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignMeetingType {
  id: string;
  campaignId: string;
  name: string;
  icon?: string;
  color: string;
  duration: number;
  isPhysical: boolean;
  order: number;
  _count?: {
    bookings: number;
  };
}

interface CampaignMeetingTypesManagerProps {
  campaignId: string;
}

const ICON_OPTIONS = [
  { value: "MapPin", label: "Lieu", icon: MapPin },
  { value: "Video", label: "Vidéo", icon: Video },
  { value: "Phone", label: "Téléphone", icon: Phone },
  { value: "Monitor", label: "Démo", icon: Monitor },
  { value: "Users", label: "Réunion", icon: Users },
  { value: "Calendar", label: "Calendrier", icon: Calendar },
];

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#F59E0B", "#84CC16",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6", "#6366F1",
  "#8B5CF6", "#A855F7", "#EC4899", "#F43F5E",
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
];

function getIconComponent(iconName?: string) {
  const iconMap: Record<string, any> = {
    MapPin,
    Video,
    Phone,
    Monitor,
    Users,
    Calendar,
  };
  return iconMap[iconName || "Calendar"] || Calendar;
}

function SortableMeetingTypeItem({
  meetingType,
  onEdit,
  onDelete,
}: {
  meetingType: CampaignMeetingType;
  onEdit: (meetingType: CampaignMeetingType) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meetingType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = getIconComponent(meetingType.icon);

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
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${meetingType.color}20` }}
      >
        <IconComponent 
          className="h-5 w-5" 
          style={{ color: meetingType.color }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-heading truncate">
            {meetingType.name}
          </span>
          {meetingType.isPhysical && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <MapPin className="h-3 w-3 mr-1" />
              Physique
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          <span>{meetingType.duration} min</span>
          {meetingType._count && (
            <span className="ml-2">
              • {meetingType._count.bookings} RDV
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(meetingType)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => onDelete(meetingType.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CampaignMeetingTypesManager({ campaignId }: CampaignMeetingTypesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CampaignMeetingType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "Calendar",
    color: "#3B82F6",
    duration: 60,
    isPhysical: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: meetingTypes = [], isLoading } = useQuery<CampaignMeetingType[]>({
    queryKey: ["campaign-meeting-types", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/meeting-types`);
      if (!res.ok) throw new Error("Failed to fetch meeting types");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/campaigns/${campaignId}/meeting-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create meeting type");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-meeting-types", campaignId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Type de RDV créé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/meeting-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update meeting type");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-meeting-types", campaignId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Type de RDV mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/meeting-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete meeting type");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-meeting-types", campaignId] });
      toast({ title: "Type de RDV supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedTypes: { id: string; order: number }[]) => {
      const res = await fetch(`/api/campaigns/${campaignId}/meeting-types`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingTypes: reorderedTypes }),
      });
      if (!res.ok) throw new Error("Failed to reorder meeting types");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-meeting-types", campaignId] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", icon: "Calendar", color: "#3B82F6", duration: 60, isPhysical: false });
    setEditingType(null);
  };

  const handleEdit = (meetingType: CampaignMeetingType) => {
    setEditingType(meetingType);
    setFormData({
      name: meetingType.name,
      icon: meetingType.icon || "Calendar",
      color: meetingType.color,
      duration: meetingType.duration,
      isPhysical: meetingType.isPhysical,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
      return;
    }

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = meetingTypes.findIndex((mt) => mt.id === active.id);
      const newIndex = meetingTypes.findIndex((mt) => mt.id === over.id);
      const reordered = arrayMove(meetingTypes, oldIndex, newIndex);
      
      queryClient.setQueryData(["campaign-meeting-types", campaignId], reordered);
      
      reorderMutation.mutate(
        reordered.map((mt, index) => ({ id: mt.id, order: index }))
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
          <h3 className="font-semibold text-text-heading">Types de rendez-vous</h3>
          <p className="text-sm text-text-muted">
            Configurez les types de RDV disponibles
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

      {meetingTypes.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-text-muted">Aucun type de RDV configuré</p>
          <Button
            variant="link"
            onClick={() => setDialogOpen(true)}
            className="mt-2"
          >
            Créer le premier type
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={meetingTypes.map((mt) => mt.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {meetingTypes.map((meetingType) => (
                <SortableMeetingTypeItem
                  key={meetingType.id}
                  meetingType={meetingType}
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
              {editingType ? "Modifier le type de RDV" : "Nouveau type de RDV"}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres du type de rendez-vous
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Visite Physique, Démo, Appel..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durée par défaut</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="isPhysical">RDV physique</Label>
                <p className="text-xs text-text-muted">
                  Nécessite une adresse
                </p>
              </div>
              <Switch
                id="isPhysical"
                checked={formData.isPhysical}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPhysical: checked })
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
              {editingType ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

