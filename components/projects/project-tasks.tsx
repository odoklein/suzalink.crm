"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/components/tasks/task-list";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCreateDrawer } from "@/components/tasks/task-create-drawer";
import { useState } from "react";

type ProjectTasksProps = {
  projectId: string;
};

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const [taskCreateDrawerOpen, setTaskCreateDrawerOpen] = useState(false);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch project tasks");
      return res.json();
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const tasks = tasksData?.tasks || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tâches du projet</CardTitle>
        <Button size="sm" onClick={() => setTaskCreateDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-text-body">Chargement...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-text-body">
            <p className="mb-4">Aucune tâche pour ce projet</p>
            <Button size="sm" onClick={() => setTaskCreateDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            showHeader={false}
            onTaskClick={() => {}}
            projectId={projectId}
          />
        )}
      </CardContent>
      <TaskCreateDrawer
        open={taskCreateDrawerOpen}
        onOpenChange={setTaskCreateDrawerOpen}
        projectId={projectId}
      />
    </Card>
  );
}

