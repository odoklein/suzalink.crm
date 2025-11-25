"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TASK_TYPES } from "@/lib/tasks";
import type { Task } from "@/lib/tasks";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["call", "email", "meeting", "follow_up", "demo", "proposal", "custom"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().min(1, "Due date is required"),
  projectId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  projectId?: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  taskId,
  projectId,
}: TaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projects = projectsData?.projects || [];

  const { data: task } = useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!taskId && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "medium",
      type: "call",
      projectId: projectId || "",
    },
  });

  const type = watch("type");

  useEffect(() => {
    if (open) {
      if (task) {
        setValue("title", task.title);
        setValue("description", task.description || "");
        setValue("type", task.type);
        setValue("priority", task.priority);
        setValue("dueDate", new Date(task.dueDate).toISOString().slice(0, 16));
        setValue("projectId", task.projectId || undefined);
      } else {
        reset({
          title: "",
          description: "",
          type: "call",
          priority: "medium",
          dueDate: "",
          projectId: projectId || undefined,
        });
      }
    }
  }, [open, task, projectId, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const url = taskId ? `/api/tasks/${taskId}` : "/api/tasks";
      const method = taskId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueDate: new Date(data.dueDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-counts"] });
      toast({
        title: "Success",
        description: taskId ? "Task updated successfully" : "Task created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-main">
            {taskId ? "Edit Task" : "New Task"}
          </DialogTitle>
          <DialogDescription className="text-text-body">
            {taskId ? "Update task information" : "Create a new task"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-text-body">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Call prospect"
              className="text-text-main"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-text-body">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Task details..."
              rows={3}
              className="text-text-main"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-text-body">Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.icon} {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-text-body">Priority *</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-text-body">Due Date *</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register("dueDate")}
              className="text-text-main"
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-text-body">Link to Project (Optional)</Label>
            <Select
              value={watch("projectId") || undefined}
              onValueChange={(value) => setValue("projectId", value)}
            >
              <SelectTrigger id="projectId">
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                {projects.length > 0 ? (
                  projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {watch("projectId") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue("projectId", undefined)}
                className="h-6 text-xs"
              >
                Clear selection
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : taskId ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

