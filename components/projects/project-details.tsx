"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string;
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
    user: {
      id: string;
      email: string;
      avatar: string | null;
    };
  }>;
};

type ProjectDetailsProps = {
  project: Project;
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
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
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-text-body">
            {project.description || "Aucune description."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={project.owner.avatar || undefined} />
                <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A]">
                  {getInitials(project.owner.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-text-main">{project.owner.email.split("@")[0]}</p>
                <p className="text-sm text-text-body">{project.owner.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.startDate && (
              <div>
                <p className="text-sm text-text-body">Date de début</p>
                <p className="font-medium text-text-main">
                  {new Date(project.startDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {project.endDate && (
              <div>
                <p className="text-sm text-text-body">Date de fin</p>
                <p className="font-medium text-text-main">
                  {new Date(project.endDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {!project.startDate && !project.endDate && (
              <p className="text-sm text-text-body">Aucune date définie</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-body">Créé le</span>
            <span className="text-text-main">
              {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-body">Modifié le</span>
            <span className="text-text-main">
              {new Date(project.updatedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

