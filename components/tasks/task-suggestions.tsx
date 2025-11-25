"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface TaskSuggestion {
  leadId: string;
  leadName: string;
  campaignName: string;
  priority: "urgent" | "high" | "medium" | "low";
  reason: string;
  suggestedAction: string;
  suggestedDueDate: string;
  type: string;
}

export function TaskSuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<TaskSuggestion[]>({
    queryKey: ["task-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/suggestions");
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const createTaskMutation = useMutation({
    mutationFn: async (suggestion: TaskSuggestion) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: suggestion.leadId,
          title: suggestion.suggestedAction,
          description: suggestion.reason,
          type: suggestion.type,
          priority: suggestion.priority,
          dueDate: suggestion.suggestedDueDate,
          status: "pending",
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-suggestions"] });
      toast({ title: "Succès", description: "Tâche créée à partir de la suggestion" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la création de la tâche",
        variant: "destructive",
      });
    },
  });

  const priorityColors = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const priorityIcons = {
    urgent: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🔵",
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 text-center">
          <div className="text-text-body">Chargement des suggestions...</div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
            </div>
            Suggestions de tâches intelligentes
          </CardTitle>
          <CardDescription>Recommandations de suivi alimentées par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <img
              src="/illustrations/empty-suggestions.svg"
              alt=""
              className="w-32 h-32 mb-4 opacity-90"
            />
            <p className="text-base font-medium text-text-main">Tout est à jour !</p>
            <p className="text-sm text-text-body mt-1">
              Aucun suivi urgent nécessaire pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
          </div>
          Suggestions de tâches intelligentes
        </CardTitle>
        <CardDescription>
          {suggestions.length} suivi{suggestions.length !== 1 ? "s" : ""} recommandé{suggestions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <div
              key={`${suggestion.leadId}-${index}`}
              className="border border-border rounded-lg p-4 hover:bg-surface transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={priorityColors[suggestion.priority]}>
                      {priorityIcons[suggestion.priority]} {suggestion.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-text-body">
                      {suggestion.campaignName}
                    </span>
                  </div>

                  <Link
                    href={`/leads/${suggestion.leadId}`}
                    className="font-semibold text-text-main hover:text-primary-500 block mb-1"
                  >
                    {suggestion.leadName}
                  </Link>

                  <div className="flex items-start gap-2 text-sm text-text-body mb-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{suggestion.reason}</span>
                  </div>

                  <div className="text-sm font-medium text-text-main mb-2">
                    💡 {suggestion.suggestedAction}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-body">
                    <Calendar className="h-3 w-3" />
                    Échéance suggérée : {new Date(suggestion.suggestedDueDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => createTaskMutation.mutate(suggestion)}
                  disabled={createTaskMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Créer une tâche
                </Button>
              </div>
            </div>
          ))}

          {suggestions.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">
                  Voir toutes les {suggestions.length} suggestions
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





