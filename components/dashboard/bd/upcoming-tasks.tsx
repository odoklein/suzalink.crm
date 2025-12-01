"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  leadName?: string;
  dueDate: string;
  priority: "urgent" | "high" | "medium" | "low";
  completed: boolean;
}

interface UpcomingTasksProps {
  tasks: Task[];
  overdueCount: number;
  onToggleComplete?: (taskId: string) => void;
}

const priorityConfig = {
  urgent: { color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
  high: { color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-500" },
  medium: { color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  low: { color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" },
};

function formatDueDate(dateStr: string): { text: string; isOverdue: boolean } {
  const date = new Date(dateStr);
  const isOverdue = isPast(date) && !isToday(date);

  if (isOverdue) {
    return { text: "En retard", isOverdue: true };
  }
  if (isToday(date)) {
    return { text: "Aujourd'hui", isOverdue: false };
  }
  if (isTomorrow(date)) {
    return { text: "Demain", isOverdue: false };
  }
  return { text: format(date, "d MMM", { locale: fr }), isOverdue: false };
}

export function UpcomingTasks({
  tasks,
  overdueCount,
  onToggleComplete,
}: UpcomingTasksProps) {
  const displayedTasks = tasks.slice(0, 4);

  return (
    <BentoCard size="sm" gradient="green" delay={300} className="!min-h-[200px]">
      <BentoCardHeader
        icon={<ListTodo className="h-5 w-5 text-emerald-600" />}
        title="Tâches à venir"
        subtitle={
          overdueCount > 0 ? (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount} en retard
            </span>
          ) : undefined
        }
        iconBg="bg-emerald-100"
        action={
          <Link
            href="/tasks"
            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />

      {displayedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="text-sm text-gray-500">Tout est à jour !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedTasks.map((task) => {
            const priority = priorityConfig[task.priority];
            const dueInfo = formatDueDate(task.dueDate);

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  "hover:bg-gray-50 transition-colors group",
                  task.completed && "opacity-50"
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => onToggleComplete?.(task.id)}
                  className="shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
                  )}
                </button>

                {/* Priority dot */}
                <div className={cn("h-2 w-2 rounded-full shrink-0", priority.dot)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm text-gray-900 truncate",
                      task.completed && "line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.leadName && (
                    <p className="text-xs text-gray-500 truncate">{task.leadName}</p>
                  )}
                </div>

                {/* Due date */}
                <span
                  className={cn(
                    "text-xs font-medium shrink-0",
                    dueInfo.isOverdue ? "text-red-500" : "text-gray-500"
                  )}
                >
                  {dueInfo.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
}




