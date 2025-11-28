"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetails } from "@/components/projects/project-details";
import { ProjectMembers } from "@/components/projects/project-members";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useState, Suspense } from "react";

// Skeleton for loading state
function ProjectSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Project not found");
        throw new Error("Failed to fetch project");
      }
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Planning: "bg-gray-100 text-gray-800",
      InProgress: "bg-blue-100 text-blue-800",
      OnHold: "bg-yellow-100 text-yellow-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      Planning: "Planification",
      InProgress: "En cours",
      OnHold: "En attente",
      Completed: "Terminé",
      Cancelled: "Annulé",
    };
    return labels[status] || status;
  };

  if (isLoading) return <ProjectSkeleton />;

  if (!project) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-gray-500 mb-4">Projet non trouvé</p>
        <Button size="sm" onClick={() => router.push("/projects")}>Retour aux projets</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {project.memberCount}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <CheckSquare className="h-3.5 w-3.5" />
                {project.taskCount}
              </span>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-1" />
          Modifier
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ProjectDetails project={project} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks projectId={projectId} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <ProjectMembers projectId={projectId} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["project", projectId] });
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
}

