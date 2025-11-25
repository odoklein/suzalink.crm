"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Mail, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

const NOTIFICATION_TYPES: NotificationPreference[] = [
  {
    type: "tasks",
    label: "Tâches",
    description: "Notifications pour les nouvelles tâches et les rappels",
    inApp: true,
    email: false,
  },
  {
    type: "assignments",
    label: "Assignations",
    description: "Notifications lorsque vous êtes assigné à un lead ou une campagne",
    inApp: true,
    email: true,
  },
  {
    type: "activities",
    label: "Activités",
    description: "Notifications pour les nouvelles activités sur vos leads",
    inApp: true,
    email: false,
  },
  {
    type: "meetings",
    label: "Réunions",
    description: "Notifications pour les réunions planifiées et les rappels",
    inApp: true,
    email: true,
  },
  {
    type: "lead_updates",
    label: "Mises à jour de leads",
    description: "Notifications lorsque les leads que vous suivez sont mis à jour",
    inApp: true,
    email: false,
  },
];

export function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<Record<string, { inApp: boolean; email: boolean }>>(
    {}
  );

  const { data: userPreferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/users/notification-preferences");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json();
    },
  });

  // Initialize preferences from API or defaults
  useState(() => {
    if (userPreferences) {
      setPreferences(userPreferences);
    } else {
      const defaults: Record<string, { inApp: boolean; email: boolean }> = {};
      NOTIFICATION_TYPES.forEach((type) => {
        defaults[type.type] = { inApp: type.inApp, email: type.email };
      });
      setPreferences(defaults);
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Record<string, { inApp: boolean; email: boolean }>) => {
      const res = await fetch("/api/users/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences de notification ont été enregistrées.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (
    type: string,
    channel: "inApp" | "email",
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Préférences de notification
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Choisissez comment et quand vous souhaitez recevoir des notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {NOTIFICATION_TYPES.map((notificationType, index) => (
            <div key={notificationType.type}>
              <div className="flex items-start justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-base font-medium text-[#1B1F24]">
                      {notificationType.label}
                    </Label>
                  </div>
                  <p className="text-sm text-[#6B7280]">
                    {notificationType.description}
                  </p>
                </div>
                <div className="flex items-center gap-6 ml-6">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#6B7280]" />
                    <Switch
                      checked={preferences[notificationType.type]?.inApp ?? notificationType.inApp}
                      onCheckedChange={(checked) =>
                        handleToggle(notificationType.type, "inApp", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#6B7280]" />
                    <Switch
                      checked={preferences[notificationType.type]?.email ?? notificationType.email}
                      onCheckedChange={(checked) =>
                        handleToggle(notificationType.type, "email", checked)
                      }
                    />
                  </div>
                </div>
              </div>
              {index < NOTIFICATION_TYPES.length - 1 && (
                <Separator className="bg-[#E6E8EB]" />
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="rounded-[12px]"
            >
              {updatePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enregistrer les préférences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



