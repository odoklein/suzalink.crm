"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal,
  Plus,
  Filter,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { 
  Task, 
  getTaskStatus, 
  getTaskTypeIcon, 
  getTaskPriorityColor,
  formatTaskDuration 
} from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "./task-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";

interface TaskListProps {
  filter?: 'all' | 'today' | 'overdue' | 'upcoming' | 'completed';
  projectId?: string;
  showHeader?: boolean;
  limit?: number;
  onTaskClick?: (taskId: string) => void;
  tasks?: Task[];
}

interface TasksResponse {
  tasks: Task[];
  total: number;
}

export function TaskList({ 
  filter = 'all', 
  projectId,
  showHeader = true,
  limit = 50,
  onTaskClick,
  tasks: providedTasks,
}: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<TasksResponse>({
    queryKey: ['tasks', { filter, projectId, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(filter !== 'all' && { dueDate: filter }),
        ...(projectId && { projectId }),
      });
      
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: !providedTasks, // Don't fetch if tasks are provided
  });

  const tasks = providedTasks || data?.tasks || [];

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      toast({
        title: "Succès",
        description: "Tâche mise à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de la tâche",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la suppression de la tâche",
        variant: "destructive",
      });
    },
  });

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    const updates: Partial<Task> = {
      status: completed ? 'completed' : 'pending',
      ...(completed && { completedAt: new Date().toISOString() }),
    };
    
    updateTaskMutation.mutate({ taskId, updates });
  };

  const handleSelectTask = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const getStatusIcon = (task: Task) => {
    const status = getTaskStatus(task);
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-danger-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning-500" />;
      default:
        return <Clock className="h-4 w-4 text-text-body" />;
    }
  };

  const getStatusColor = (task: Task) => {
    const status = getTaskStatus(task);
    switch (status) {
      case 'completed':
        return 'text-success-500';
      case 'overdue':
        return 'text-danger-500';
      case 'in_progress':
        return 'text-warning-500';
      default:
        return 'text-text-body';
    }
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setDeleteDialogOpen(true);
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return `Demain à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-body text-text-body">Chargement des tâches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tâches
            {data?.total && (
              <Badge variant="secondary">{data.total}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Bientôt disponible",
                  description: "La fonctionnalité de filtrage sera bientôt disponible",
                });
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setEditingTaskId(undefined);
                setTaskDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showHeader ? "" : "p-0"}>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-text-body opacity-50" />
            <p className="text-body text-text-body mb-2">
              Aucune tâche trouvée
            </p>
            <p className="text-sm text-text-body">
              {filter === 'today' && "Aucune tâche prévue aujourd'hui"}
              {filter === 'overdue' && "Aucune tâche en retard"}
              {filter === 'upcoming' && "Aucune tâche à venir"}
              {filter === 'completed' && "Aucune tâche terminée"}
              {filter === 'all' && "Aucune tâche créée pour le moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const status = getTaskStatus(task);
              const isCompleted = status === 'completed';
              const isSelected = selectedTasks.includes(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected ? 'bg-primary-50 border-primary-200' : 'hover:bg-accent/50'
                  } ${isCompleted ? 'opacity-60' : ''}`}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleTaskComplete(task.id, !!checked)}
                    disabled={updateTaskMutation.isPending}
                  />
                  
                  <div className="text-lg flex-shrink-0">
                    {getTaskTypeIcon(task.type)}
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onTaskClick && onTaskClick(task.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${isCompleted ? 'line-through' : ''} hover:text-primary-500 transition-colors`}>
                        {task.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTaskPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-text-body mb-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-text-body">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task)}
                        <span className={getStatusColor(task)}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      </div>
                      
                      {task.metadata?.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTaskDuration(task.metadata.estimatedDuration)}</span>
                        </div>
                      )}
                      
                      {task.leadId && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <Link 
                            href={`/leads/${task.leadId}`}
                            className="hover:text-primary-500"
                          >
                            Voir le lead
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {task.completedAt && (
                      <span className="text-xs text-success-500">
                        ✓ {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
                      </span>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTask(task.id)}>
                          Modifier la tâche
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Bientôt disponible",
                              description: "La fonctionnalité de duplication sera bientôt disponible",
                            });
                          }}
                        >
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Bientôt disponible",
                              description: "La fonctionnalité de rappel sera bientôt disponible",
                            });
                          }}
                        >
                          Ajouter un rappel
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteTask(task)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <TaskDialog 
        open={taskDialogOpen} 
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) {
            setEditingTaskId(undefined);
          }
        }}
        taskId={editingTaskId}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete.id)}
        title="Supprimer la tâche"
        description="Êtes-vous sûr de vouloir supprimer"
        itemName={taskToDelete?.title}
      />
    </Card>
  );
}

