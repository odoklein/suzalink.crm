"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Users, CheckSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string;
  startDate: string | null;
  endDate: string | null;
  owner: {
    id: string;
    email: string;
    avatar: string | null;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      avatar: string | null;
    };
  }>;
  taskCount: number;
  memberCount: number;
};

type ProjectListProps = {
  projects: Project[];
  onEdit: (id: string) => void;
  onDelete: (project: { id: string; name: string }) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
};

export function ProjectList({
  projects,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusLabel,
}: ProjectListProps) {
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-semibold text-text-main hover:text-[#3BBF7A] transition-colors"
                  >
                    {project.name}
                  </Link>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-body text-text-body mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-6 text-sm text-text-body">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.owner.avatar || undefined} />
                      <AvatarFallback className="text-xs bg-[#3BBF7A]/10 text-[#3BBF7A]">
                        {getInitials(project.owner.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{project.owner.email.split("@")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{project.memberCount} membre{project.memberCount > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>{project.taskCount} tâche{project.taskCount > 1 ? "s" : ""}</span>
                  </div>
                  {project.startDate && (
                    <span className="text-xs">
                      Début: {new Date(project.startDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {project.endDate && (
                    <span className="text-xs">
                      Fin: {new Date(project.endDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(project.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete({ id: project.id, name: project.name })}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

