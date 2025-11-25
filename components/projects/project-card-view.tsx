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

type ProjectCardViewProps = {
  projects: Project[];
  onEdit: (id: string) => void;
  onDelete: (project: { id: string; name: string }) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
};

export function ProjectCardView({
  projects,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusLabel,
}: ProjectCardViewProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-lg font-semibold text-text-main hover:text-[#3BBF7A] transition-colors block mb-2"
                >
                  {project.name}
                </Link>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
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
            {project.description && (
              <p className="text-body text-text-body mb-4 line-clamp-3">
                {project.description}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-text-body">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={project.owner.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-[#3BBF7A]/10 text-[#3BBF7A]">
                    {getInitials(project.owner.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{project.owner.email.split("@")[0]}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-body">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.memberCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-4 w-4" />
                  <span>{project.taskCount}</span>
                </div>
              </div>
              {(project.startDate || project.endDate) && (
                <div className="text-xs text-text-body pt-2 border-t">
                  {project.startDate && (
                    <div>Début: {new Date(project.startDate).toLocaleDateString("fr-FR")}</div>
                  )}
                  {project.endDate && (
                    <div>Fin: {new Date(project.endDate).toLocaleDateString("fr-FR")}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

