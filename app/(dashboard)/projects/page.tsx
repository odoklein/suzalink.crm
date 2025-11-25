"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  FolderKanban, 
  Search, 
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ProjectStatus = "Planning" | "InProgress" | "OnHold" | "Completed" | "Cancelled";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  organizationId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    avatar: string | null;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      avatar: string | null;
    };
  }>;
  taskCount: number;
  memberCount: number;
};

// Progress Ring Component
function ProgressRing({ 
  progress, 
  size = 60, 
  strokeWidth = 6,
  className 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary-500 transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  delay 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  gradient: string;
  delay: number;
}) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 text-white",
        "transform hover:scale-105 transition-all duration-300",
        gradient
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <Icon className="h-8 w-8 mb-3 opacity-80" />
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

// Modern Project Card
function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: Project; 
  onEdit: (id: string) => void;
  onDelete: (project: { id: string; name: string }) => void;
}) {
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const statusConfig: Record<ProjectStatus, { color: string; bg: string; label: string; icon: any }> = {
    Planning: { 
      color: "text-slate-700", 
      bg: "bg-slate-100", 
      label: "Planification",
      icon: Clock
    },
    InProgress: { 
      color: "text-blue-700", 
      bg: "bg-blue-100", 
      label: "En cours",
      icon: TrendingUp
    },
    OnHold: { 
      color: "text-amber-700", 
      bg: "bg-amber-100", 
      label: "En attente",
      icon: Clock
    },
    Completed: { 
      color: "text-emerald-700", 
      bg: "bg-emerald-100", 
      label: "Terminé",
      icon: CheckCircle2
    },
    Cancelled: { 
      color: "text-rose-700", 
      bg: "bg-rose-100", 
      label: "Annulé",
      icon: Clock
    },
  };

  const config = statusConfig[project.status] || statusConfig.Planning;
  const StatusIcon = config.icon;

  // Calculate fake progress based on status
  const progressMap: Record<ProjectStatus, number> = {
    Planning: 15,
    InProgress: 60,
    OnHold: 40,
    Completed: 100,
    Cancelled: 0,
  };
  const progress = progressMap[project.status] || 0;

  // Calculate timeline
  const getTimelineProgress = () => {
    if (!project.startDate || !project.endDate) return null;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const timelineProgress = getTimelineProgress();

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden">
      {/* Status accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", config.bg.replace('100', '500'))} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <Link
              href={`/projects/${project.id}`}
              className="group/link flex items-center gap-2"
            >
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover/link:text-primary-600 transition-colors">
                {project.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 opacity-0 -translate-y-1 group-hover/link:opacity-100 group-hover/link:translate-y-0 transition-all text-primary-500" />
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs", config.bg, config.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>
          
          <ProgressRing progress={progress} size={52} strokeWidth={5} />
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}

        {/* Timeline */}
        {project.startDate && project.endDate && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
              <span>{new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${timelineProgress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Members Stack */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((member, i) => (
                  <Avatar key={member.id} className="h-7 w-7 border-2 border-white ring-0">
                    <AvatarImage src={member.user.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700">
                      {getInitials(member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.memberCount > 3 && (
                  <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                    <span className="text-[10px] font-medium text-gray-600">
                      +{project.memberCount - 3}
                    </span>
                  </div>
                )}
              </div>
              <span className="ml-2 text-xs text-gray-500">
                {project.memberCount} membre{project.memberCount > 1 ? 's' : ''}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {project.taskCount} tâche{project.taskCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project.id)}>
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete({ id: project.id, name: project.name })}
                className="text-rose-600"
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  // Build API query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    return params.toString();
  }, [statusFilter]);

  const { data: projectsData, isLoading } = useQuery<{ projects: Project[]; total: number }>({
    queryKey: ["projects", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/projects?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projects = projectsData?.projects || [];

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      inProgress: projects.filter(p => p.status === 'InProgress').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      totalMembers: projects.reduce((acc, p) => acc + p.memberCount, 0),
    };
  }, [projects]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.owner.email.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
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

  const handleDelete = (project: { id: string; name: string }) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (projectId: string) => {
    setEditingProjectId(projectId);
    setProjectDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProjectId(undefined);
    setProjectDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Projets</h1>
                  <p className="text-white/80">Gérez et suivez tous vos projets en un seul endroit</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleCreate}
              className="bg-white text-primary-600 hover:bg-white/90 shadow-xl rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">En cours</p>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Terminés</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Membres</p>
              <p className="text-3xl font-bold">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200 bg-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Planning">Planification</SelectItem>
              <SelectItem value="InProgress">En cours</SelectItem>
              <SelectItem value="OnHold">En attente</SelectItem>
              <SelectItem value="Completed">Terminé</SelectItem>
              <SelectItem value="Cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              className={cn("rounded-lg", view === "grid" && "shadow-md")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className={cn("rounded-lg", view === "list" && "shadow-md")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "Aucun projet trouvé" : "Aucun projet pour le moment"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? "Essayez de modifier vos critères de recherche"
                : "Créez votre premier projet pour commencer"
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleCreate}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-2xl shadow-primary-500/40 flex items-center justify-center hover:scale-110 transition-transform duration-200 z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create/Edit Dialog */}
      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) {
            setEditingProjectId(undefined);
          }
        }}
        projectId={editingProjectId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          setProjectDialogOpen(false);
          setEditingProjectId(undefined);
        }}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (projectToDelete) {
            deleteMutation.mutate(projectToDelete.id);
          }
        }}
        title="Supprimer le projet"
        description={`Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete?.name}" ? Cette action est irréversible.`}
      />
    </div>
  );
}
