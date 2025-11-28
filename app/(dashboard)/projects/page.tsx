"use client";

import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  FolderKanban, 
  Search, 
  LayoutGrid,
  List,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
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
import { Skeleton } from "@/components/ui/skeleton";
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

// Lightweight Progress Badge - CSS only, no SVG
const ProgressBadge = memo(function ProgressBadge({ progress }: { progress: number }) {
  const color = progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-primary-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{progress}%</span>
    </div>
  );
});

// Skeleton for project cards
function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex -space-x-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Status config - defined once outside component
const statusConfig: Record<ProjectStatus, { color: string; bg: string; accent: string; label: string }> = {
  Planning: { color: "text-slate-700", bg: "bg-slate-100", accent: "bg-slate-400", label: "Planification" },
  InProgress: { color: "text-blue-700", bg: "bg-blue-100", accent: "bg-blue-500", label: "En cours" },
  OnHold: { color: "text-amber-700", bg: "bg-amber-100", accent: "bg-amber-500", label: "En attente" },
  Completed: { color: "text-emerald-700", bg: "bg-emerald-100", accent: "bg-emerald-500", label: "Terminé" },
  Cancelled: { color: "text-rose-700", bg: "bg-rose-100", accent: "bg-rose-400", label: "Annulé" },
};

const progressMap: Record<ProjectStatus, number> = {
  Planning: 15, InProgress: 60, OnHold: 40, Completed: 100, Cancelled: 0,
};

// Memoized Project Card for better performance
const ProjectCard = memo(function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: Project; 
  onEdit: (id: string) => void;
  onDelete: (project: { id: string; name: string }) => void;
}) {
  const config = statusConfig[project.status] || statusConfig.Planning;
  const progress = progressMap[project.status] || 0;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Status accent */}
      <div className={cn("h-1", config.accent)} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <Link href={`/projects/${project.id}`} className="group/link">
              <h3 className="font-semibold text-gray-900 truncate group-hover/link:text-primary-600 transition-colors">
                {project.name}
              </h3>
            </Link>
            <Badge className={cn("text-xs mt-1.5", config.bg, config.color)}>
              {config.label}
            </Badge>
          </div>
          <ProgressBadge progress={progress} />
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {project.taskCount}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project.id)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete({ id: project.id, name: project.name })} className="text-rose-600">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

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
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
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
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 max-w-[1600px] mx-auto space-y-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
            <p className="text-sm text-gray-500">Gérez et suivez vos projets</p>
          </div>
          <Button onClick={handleCreate} className="rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Terminés</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            <p className="text-xs text-gray-500">Membres</p>
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
          <div className={cn(
            view === "grid" 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-900 mb-1">
              {searchQuery ? "Aucun projet trouvé" : "Aucun projet"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? "Modifiez vos critères de recherche" : "Créez votre premier projet"}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            view === "grid" 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
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
