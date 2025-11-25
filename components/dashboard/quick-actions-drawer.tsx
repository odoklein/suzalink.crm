"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Megaphone,
  Mail,
  Search,
  ListTodo,
  Calendar,
  Plus,
} from "lucide-react";

type QuickActionsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickActionsDrawer({
  open,
  onOpenChange,
}: QuickActionsDrawerProps) {
  const router = useRouter();

  const actions = [
    {
      icon: Users,
      label: "Commencer une session de prospection",
      description: "Obtenir le prochain lead et commencer à travailler",
      href: "/leads/workspace",
      color: "text-primary-500",
      bgColor: "bg-primary-50",
    },
    {
      icon: Megaphone,
      label: "Créer une campagne",
      description: "Configurer une nouvelle campagne commerciale",
      href: "/campaigns/new",
      color: "text-info-500",
      bgColor: "bg-info-50",
    },
    {
      icon: Mail,
      label: "Composer un email",
      description: "Envoyer un email à un lead",
      href: "/inbox/compose",
      color: "text-success-500",
      bgColor: "bg-success-50",
    },
    {
      icon: ListTodo,
      label: "Créer une tâche",
      description: "Ajouter une nouvelle tâche à votre liste",
      href: "/tasks",
      color: "text-warning-500",
      bgColor: "bg-warning-50",
    },
    {
      icon: Calendar,
      label: "Planifier une réunion",
      description: "Réserver une réunion avec un lead",
      href: "/calendar",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Search,
      label: "Recherche avancée",
      description: "Rechercher dans toutes les données du CRM",
      href: "/search",
      color: "text-text-body",
      bgColor: "bg-muted",
    },
  ];

  const handleActionClick = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Actions rapides
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Accéder aux actions courantes et raccourcis
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary-200"
                onClick={() => handleActionClick(action.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-3 ${action.bgColor}`}>
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-main mb-1">
                        {action.label}
                      </h3>
                      <p className="text-sm text-text-body">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

