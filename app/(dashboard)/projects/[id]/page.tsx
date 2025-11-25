"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Users, CheckSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetails } from "@/components/projects/project-details";
import { ProjectMembers } from "@/components/projects/project-members";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Project not found");
        }
        throw new Error("Failed to fetch project");
      }
      return res.json();
    },
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-text-body">Chargement...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-text-body mb-4">Projet non trouvé</p>
          <Button onClick={() => router.push("/projects")}>Retour aux projets</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-text-body">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.memberCount} membre{project.memberCount > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-4 w-4" />
                  <span>{project.taskCount} tâche{project.taskCount > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectDetails project={project} />
        </TabsContent>

        <TabsContent value="tasks">
          <ProjectTasks projectId={projectId} />
        </TabsContent>

        <TabsContent value="members">
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

