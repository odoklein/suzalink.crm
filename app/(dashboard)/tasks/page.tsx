"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  List,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskDetailsDrawer } from "@/components/tasks/task-details-drawer";
import { TaskCreateDrawer } from "@/components/tasks/task-create-drawer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Task, 
  getTaskStatus, 
  getTaskTypeIcon, 
  getTaskPriorityColor,
  formatTaskDuration 
} from "@/lib/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/ui/delete-dialog";

interface TasksResponse {
  tasks: Task[];
  total: number;
}

// Modern Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
  onClick,
  onDelete,
  isUpdating 
}: { 
  task: Task; 
  onComplete: (id: string, completed: boolean) => void;
  onClick: (id: string) => void;
  onDelete: (task: Task) => void;
  isUpdating: boolean;
}) {
  const status = getTaskStatus(task);
  const isCompleted = status === 'completed';
  const isOverdue = status === 'overdue';
  
  const priorityGradients: Record<string, string> = {
    urgent: "from-rose-500 via-orange-500 to-amber-500",
    high: "from-orange-500 to-amber-500",
    medium: "from-blue-500 to-cyan-500",
    low: "from-slate-400 to-slate-500",
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return `Demain, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5",
        isCompleted && "opacity-60",
        isOverdue && "border-rose-200 bg-rose-50/30"
      )}
    >
      {/* Priority gradient accent */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b",
          priorityGradients[task.priority] || priorityGradients.medium
        )}
      />
      
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onComplete(task.id, !!checked)}
              disabled={isUpdating}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-all",
                isCompleted && "bg-emerald-500 border-emerald-500"
              )}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(task.id)}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
              <h4 className={cn(
                "font-medium text-gray-900 group-hover:text-primary-600 transition-colors",
                isCompleted && "line-through text-gray-500"
              )}>
                {task.title}
              </h4>
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs">
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full",
                isOverdue 
                  ? "bg-rose-100 text-rose-700" 
                  : "bg-gray-100 text-gray-600"
              )}>
                <Clock className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
              </span>
              
              {task.metadata?.estimatedDuration && (
                <span className="flex items-center gap-1 text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  {formatTaskDuration(task.metadata.estimatedDuration)}
                </span>
              )}
            </div>
          </div>
          
          {/* Priority badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs capitalize shrink-0",
              getTaskPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ 
  title, 
  icon: Icon, 
  iconColor,
  tasks, 
  count,
  emptyMessage,
  emptyIllustration,
  onComplete,
  onClick,
  onDelete,
  isUpdating,
  accentColor,
  emptyBgGradient
}: {
  title: string;
  icon: any;
  iconColor: string;
  tasks: Task[];
  count: number;
  emptyMessage: string;
  emptyIllustration?: string;
  onComplete: (id: string, completed: boolean) => void;
  onClick: (id: string) => void;
  onDelete: (task: Task) => void;
  isUpdating: boolean;
  accentColor: string;
  emptyBgGradient?: string;
}) {
  return (
    <div className="flex-1 min-w-[320px] flex flex-col">
      {/* Column Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-t-2xl border-b-2",
        accentColor
      )}>
        <div className={cn("p-2.5 rounded-xl shadow-lg", iconColor)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{count} tâche{count !== 1 ? 's' : ''}</p>
        </div>
        <Badge variant="secondary" className="text-lg font-bold px-3 py-1 rounded-xl bg-gray-800 text-white">
          {count}
        </Badge>
      </div>
      
      {/* Column Content */}
      <div className={cn(
        "flex-1 p-3 space-y-3 rounded-b-2xl min-h-[400px] overflow-y-auto",
        tasks.length === 0 ? emptyBgGradient || "bg-gradient-to-b from-gray-50/80 to-white" : "bg-gray-50/50"
      )}>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
            {emptyIllustration ? (
              <img 
                src={emptyIllustration} 
                alt="" 
                className="w-24 h-24 mb-4 opacity-90"
              />
            ) : (
              <Icon className="h-10 w-10 mb-3 opacity-40" />
            )}
            <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onClick={onClick}
              onDelete={onDelete}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [taskCreateDrawerOpen, setTaskCreateDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all tasks for kanban view
  const { data: allTasksData, isLoading } = useQuery<TasksResponse>({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?limit=200');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const allTasks = allTasksData?.tasks || [];

  // Categorize tasks
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const filtered = searchQuery 
      ? allTasks.filter(t => 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allTasks;
    
    return {
      overdue: filtered.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate < now && t.status !== 'completed';
      }),
      today: filtered.filter(t => {
        const dueDate = new Date(t.dueDate);
        const taskDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return taskDay.getTime() === today.getTime() && t.status !== 'completed';
      }),
      upcoming: filtered.filter(t => {
        const dueDate = new Date(t.dueDate);
        const taskDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return taskDay > today && taskDay < nextWeek && t.status !== 'completed';
      }),
      completed: filtered.filter(t => t.status === 'completed').slice(0, 10),
    };
  }, [allTasks, searchQuery]);

  // Task counts for progress bar
  const taskCounts = useMemo(() => ({
    overdue: categorizedTasks.overdue.length,
    today: categorizedTasks.today.length,
    upcoming: categorizedTasks.upcoming.length,
    completed: categorizedTasks.completed.length,
    total: allTasks.length,
  }), [categorizedTasks, allTasks.length]);

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
    updateTaskMutation.mutate({ 
      taskId, 
      updates: {
        status: completed ? 'completed' : 'pending',
        ...(completed && { completedAt: new Date().toISOString() }),
      }
    });
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setDeleteDialogOpen(true);
  };

  // Calculate progress percentages
  const progressPercentages = useMemo(() => {
    const total = taskCounts.overdue + taskCounts.today + taskCounts.upcoming + taskCounts.completed;
    if (total === 0) return { overdue: 0, today: 0, upcoming: 0, completed: 0 };
    return {
      overdue: (taskCounts.overdue / total) * 100,
      today: (taskCounts.today / total) * 100,
      upcoming: (taskCounts.upcoming / total) * 100,
      completed: (taskCounts.completed / total) * 100,
    };
  }, [taskCounts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header with Strong Contrast */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/30 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-cyan-500/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl -ml-24 -mb-24" />
          
          <div className="relative flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/40 ring-2 ring-primary-400/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Gestion des tâches
                </h1>
              </div>
              <p className="text-slate-300 ml-14">
                Organisez et suivez vos activités commerciales
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "rounded-lg text-white/70 hover:text-white hover:bg-white/10",
                    viewMode === "kanban" && "bg-white/20 text-white shadow-md"
                  )}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg text-white/70 hover:text-white hover:bg-white/10",
                    viewMode === "list" && "bg-white/20 text-white shadow-md"
                  )}
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
              </div>
              
              <Button 
                onClick={() => setTaskCreateDrawerOpen(true)}
                className="bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 shadow-lg shadow-primary-500/40 rounded-xl text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">Distribution des tâches</span>
              <span className="text-slate-400">{taskCounts.total} tâches au total</span>
            </div>
            
            <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden flex backdrop-blur-sm">
              {progressPercentages.completed > 0 && (
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercentages.completed}%` }}
                />
              )}
              {progressPercentages.today > 0 && (
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progressPercentages.today}%` }}
                />
              )}
              {progressPercentages.upcoming > 0 && (
                <div 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                  style={{ width: `${progressPercentages.upcoming}%` }}
                />
              )}
              {progressPercentages.overdue > 0 && (
                <div 
                  className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
                  style={{ width: `${progressPercentages.overdue}%` }}
                />
              )}
            </div>
            
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/30" />
                <span className="text-slate-300">Terminées ({taskCounts.completed})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-400 shadow-lg shadow-blue-500/30" />
                <span className="text-slate-300">Aujourd'hui ({taskCounts.today})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400 shadow-lg shadow-amber-500/30" />
                <span className="text-slate-300">À venir ({taskCounts.upcoming})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400 shadow-lg shadow-rose-500/30" />
                <span className="text-slate-300">En retard ({taskCounts.overdue})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des tâches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl border-gray-200">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Kanban Board */}
        {viewMode === "kanban" && (
          <div className="flex gap-6 overflow-x-auto pb-6">
            <KanbanColumn
              title="En retard"
              icon={AlertTriangle}
              iconColor="bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30"
              accentColor="bg-gradient-to-r from-rose-50 to-rose-100/50 border-rose-200"
              emptyBgGradient="bg-gradient-to-b from-rose-50/50 via-rose-50/30 to-white"
              emptyIllustration="/illustrations/empty-overdue.svg"
              tasks={categorizedTasks.overdue}
              count={taskCounts.overdue}
              emptyMessage="Aucune tâche en retard"
              onComplete={handleTaskComplete}
              onClick={setSelectedTaskId}
              onDelete={handleDeleteTask}
              isUpdating={updateTaskMutation.isPending}
            />
            
            <KanbanColumn
              title="Aujourd'hui"
              icon={Calendar}
              iconColor="bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
              accentColor="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200"
              emptyBgGradient="bg-gradient-to-b from-blue-50/50 via-blue-50/30 to-white"
              emptyIllustration="/illustrations/empty-today.svg"
              tasks={categorizedTasks.today}
              count={taskCounts.today}
              emptyMessage="Aucune tâche pour aujourd'hui"
              onComplete={handleTaskComplete}
              onClick={setSelectedTaskId}
              onDelete={handleDeleteTask}
              isUpdating={updateTaskMutation.isPending}
            />
            
            <KanbanColumn
              title="À venir"
              icon={Clock}
              iconColor="bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30"
              accentColor="bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200"
              emptyBgGradient="bg-gradient-to-b from-amber-50/50 via-amber-50/30 to-white"
              emptyIllustration="/illustrations/empty-upcoming.svg"
              tasks={categorizedTasks.upcoming}
              count={taskCounts.upcoming}
              emptyMessage="Aucune tâche à venir"
              onComplete={handleTaskComplete}
              onClick={setSelectedTaskId}
              onDelete={handleDeleteTask}
              isUpdating={updateTaskMutation.isPending}
            />
            
            <KanbanColumn
              title="Terminées"
              icon={CheckCircle2}
              iconColor="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30"
              accentColor="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200"
              emptyBgGradient="bg-gradient-to-b from-emerald-50/50 via-emerald-50/30 to-white"
              emptyIllustration="/illustrations/empty-completed.svg"
              tasks={categorizedTasks.completed}
              count={taskCounts.completed}
              emptyMessage="Aucune tâche terminée"
              onComplete={handleTaskComplete}
              onClick={setSelectedTaskId}
              onDelete={handleDeleteTask}
              isUpdating={updateTaskMutation.isPending}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-2xl border-0 shadow-md p-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Chargement des tâches...</div>
            ) : allTasks.length === 0 ? (
              <div className="text-center py-16">
                <img 
                  src="/illustrations/empty-tasks.svg" 
                  alt="" 
                  className="w-40 h-40 mx-auto mb-6 opacity-90"
                />
                <p className="text-lg font-medium text-gray-700 mb-2">Aucune tâche créée</p>
                <p className="text-sm text-gray-500 mb-6">Créez votre première tâche pour organiser vos activités</p>
                <Button 
                  onClick={() => setTaskCreateDrawerOpen(true)}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une tâche
                </Button>
              </div>
            ) : (
              allTasks
                .filter(t => !searchQuery || 
                  t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleTaskComplete}
                    onClick={setSelectedTaskId}
                    onDelete={handleDeleteTask}
                    isUpdating={updateTaskMutation.isPending}
                  />
                ))
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setTaskCreateDrawerOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-2xl shadow-primary-500/40 flex items-center justify-center hover:scale-110 transition-transform duration-200 z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TaskCreateDrawer 
        open={taskCreateDrawerOpen} 
        onOpenChange={setTaskCreateDrawerOpen}
      />

      <TaskDetailsDrawer
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete.id)}
        title="Supprimer la tâche"
        description="Êtes-vous sûr de vouloir supprimer"
        itemName={taskToDelete?.title}
      />
    </div>
  );
}
