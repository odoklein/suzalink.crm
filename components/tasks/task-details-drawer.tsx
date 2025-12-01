"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Building2,
  Edit,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Phone,
  Mail,
  Users,
  RefreshCw,
  Target,
  FileText,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Task } from "@/lib/tasks";
import { getTaskStatus, getTaskPriorityColor } from "@/lib/tasks";
import { TaskDialog } from "./task-dialog";

// Map task types to Lucide icons
const TASK_TYPE_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Users,
  follow_up: RefreshCw,
  demo: Target,
  proposal: FileText,
  custom: Zap,
} as const;

type TaskDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
};

export function TaskDetailsDrawer({
  open,
  onOpenChange,
  taskId,
}: TaskDetailsDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!taskId && open,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: Task["status"]) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update task status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-counts"] });
      toast({
        title: "Succès",
        description: "Statut de la tâche mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut de la tâche",
        variant: "destructive",
      });
    },
  });

  if (!taskId) return null;

  const TaskTypeIcon = task ? TASK_TYPE_ICONS[task.type] || Zap : null;
  const statusInfo = task ? getTaskStatus(task) : null;
  const priorityColor = task ? getTaskPriorityColor(task.priority) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {isLoading ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                  Chargement...
                </SheetTitle>
                <SheetDescription className="text-body text-text-body mt-2">
                  Chargement des détails de la tâche
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </>
          ) : task ? (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                      {task.title}
                    </SheetTitle>
                    <SheetDescription className="text-body text-text-body mt-2">
                      Détails et informations de la tâche
                    </SheetDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge
                      variant="outline"
                      className={priorityColor || ""}
                    >
                      {task.priority}
                    </Badge>
                    {statusInfo && (
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Task Information */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {task.description && (
                      <div>
                        <Label className="text-sm font-medium text-text-body mb-1 block">
                          Description
                        </Label>
                        <p className="text-body text-text-main">
                          {task.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-text-body mb-1 block">
                          Type
                        </Label>
                        <div className="flex items-center gap-2">
                          {TaskTypeIcon && (
                            <TaskTypeIcon className="h-4 w-4 text-text-body" />
                          )}
                          <span className="text-body text-text-main capitalize">
                            {task.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-text-body mb-1 block">
                          Date d'échéance
                        </Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-text-body" />
                          <span className="text-body text-text-main">
                            {format(new Date(task.dueDate), "PPP")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {task.completedAt && (
                      <div>
                        <Label className="text-sm font-medium text-text-body mb-1 block">
                          Terminé le
                        </Label>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success-500" />
                          <span className="text-body text-text-main">
                            {format(new Date(task.completedAt), "PPP p")}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Update */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-text-main">
                        Mettre à jour le statut
                      </Label>
                      <Select
                        value={task.status}
                        onValueChange={(value: Task["status"]) =>
                          updateStatusMutation.mutate(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier la tâche
                  </Button>
                  {task.projectId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push(`/projects/${task.projectId}`);
                        onOpenChange(false);
                      }}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Voir le projet
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                  Tâche introuvable
                </SheetTitle>
                <SheetDescription className="text-body text-text-body mt-2">
                  Impossible de charger les détails de la tâche
                </SheetDescription>
              </SheetHeader>
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
                <p className="text-body text-text-body">Tâche introuvable</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <TaskDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open && task) {
            queryClient.invalidateQueries({ queryKey: ["task", task.id] });
          }
        }}
        taskId={task?.id}
      />
    </>
  );
}

