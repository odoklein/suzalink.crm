"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { HelpIcon } from "@/components/help/help-icon";

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
  inheritedFromRole?: boolean;
}

const PERMISSIONS: Permission[] = [
  // Accounts
  {
    key: "canManageAccounts",
    label: "Gérer les comptes",
    description: "Créer, modifier et supprimer des comptes clients",
    category: "Accounts",
  },
  {
    key: "canViewAccounts",
    label: "Voir les comptes",
    description: "Accéder en lecture seule aux comptes",
    category: "Accounts",
  },
  // Campaigns
  {
    key: "canManageCampaigns",
    label: "Gérer les campagnes",
    description: "Créer, modifier et supprimer des campagnes",
    category: "Campaigns",
  },
  {
    key: "canViewCampaigns",
    label: "Voir les campagnes",
    description: "Accéder en lecture seule aux campagnes",
    category: "Campaigns",
  },
  // Leads
  {
    key: "canManageLeads",
    label: "Gérer les leads",
    description: "Modifier le statut et les informations des leads",
    category: "Leads",
  },
  {
    key: "canViewLeads",
    label: "Voir les leads",
    description: "Accéder en lecture seule aux leads",
    category: "Leads",
  },
  // Tasks
  {
    key: "canManageTasks",
    label: "Gérer les tâches",
    description: "Créer, modifier et supprimer des tâches",
    category: "Tasks",
  },
  {
    key: "canViewTasks",
    label: "Voir les tâches",
    description: "Accéder en lecture seule aux tâches",
    category: "Tasks",
  },
  // Reporting
  {
    key: "canViewReports",
    label: "Voir les rapports",
    description: "Accéder aux rapports et analyses",
    category: "Reporting",
  },
  {
    key: "canExportReports",
    label: "Exporter les rapports",
    description: "Télécharger les rapports en CSV/PDF",
    category: "Reporting",
  },
  // Admin
  {
    key: "canManageUsers",
    label: "Gérer les utilisateurs",
    description: "Créer, modifier et supprimer des utilisateurs",
    category: "Admin",
  },
  {
    key: "canAccessInbox",
    label: "Accéder à la boîte de réception",
    description: "Voir et gérer les emails",
    category: "Admin",
  },
  {
    key: "canUseEmailAutomation",
    label: "Utiliser l'automatisation email",
    description: "Créer et gérer les séquences et templates",
    category: "Admin",
  },
];

const ROLE_DEFAULTS: Record<string, Record<string, boolean>> = {
  ADMIN: {
    canManageAccounts: true,
    canViewAccounts: true,
    canManageCampaigns: true,
    canViewCampaigns: true,
    canManageLeads: true,
    canViewLeads: true,
    canManageTasks: true,
    canViewTasks: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: true,
    canAccessInbox: true,
    canUseEmailAutomation: true,
  },
  MANAGER: {
    canManageAccounts: true,
    canViewAccounts: true,
    canManageCampaigns: true,
    canViewCampaigns: true,
    canManageLeads: true,
    canViewLeads: true,
    canManageTasks: true,
    canViewTasks: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canAccessInbox: true,
    canUseEmailAutomation: true,
  },
  BD: {
    canManageAccounts: false,
    canViewAccounts: true,
    canManageCampaigns: false,
    canViewCampaigns: true,
    canManageLeads: true,
    canViewLeads: true,
    canManageTasks: true,
    canViewTasks: true,
    canViewReports: false,
    canExportReports: false,
    canManageUsers: false,
    canAccessInbox: true,
    canUseEmailAutomation: false,
  },
};

interface UserAuthorizationsTabProps {
  userId: string;
  user: any;
}

export function UserAuthorizationsTab({ userId, user }: UserAuthorizationsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/permissions`);
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });

  useEffect(() => {
    if (userPermissions) {
      setPermissions(userPermissions.customPermissions || {});
    } else {
      // Initialize with role defaults
      const defaults = ROLE_DEFAULTS[user.role] || {};
      setPermissions(defaults);
    }
  }, [userPermissions, user.role]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async (perms: Record<string, boolean>) => {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error("Failed to update permissions");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      toast({
        title: "Autorisations mises à jour",
        description: "Les permissions ont été enregistrées avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les autorisations.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(permissions);
  };

  const getInheritedValue = (key: string): boolean => {
    return ROLE_DEFAULTS[user.role]?.[key] || false;
  };

  const isOverridden = (key: string): boolean => {
    const inherited = getInheritedValue(key);
    return permissions[key] !== undefined && permissions[key] !== inherited;
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Autorisations personnalisées
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Définissez des permissions spécifiques pour cet utilisateur. Les permissions peuvent
            être héritées du rôle ou surchargées individuellement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, perms], categoryIndex) => (
            <div key={category}>
              <h3 className="text-base font-semibold text-[#1B1F24] mb-4">{category}</h3>
              <div className="space-y-4">
                {perms.map((perm, index) => {
                  const inheritedValue = getInheritedValue(perm.key);
                  const currentValue = permissions[perm.key] ?? inheritedValue;
                  const overridden = isOverridden(perm.key);

                  return (
                    <div key={perm.key}>
                      <div className="flex items-start justify-between p-4 rounded-[12px] border border-[#E6E8EB] hover:bg-[#F9FAFB] transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-base font-medium text-[#1B1F24] cursor-pointer">
                              {perm.label}
                            </Label>
                            {overridden && (
                              <Badge variant="outline" className="text-xs">
                                Surchargé
                              </Badge>
                            )}
                            {!overridden && (
                              <Badge variant="outline" className="text-xs text-[#6B7280]">
                                Hérité du rôle {user.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280]">{perm.description}</p>
                        </div>
                        <div className="ml-4">
                          <Switch
                            checked={currentValue}
                            onCheckedChange={(checked) => handleToggle(perm.key, checked)}
                          />
                        </div>
                      </div>
                      {index < perms.length - 1 && (
                        <Separator className="my-2 bg-[#E6E8EB]" />
                      )}
                    </div>
                  );
                })}
              </div>
              {categoryIndex < Object.keys(groupedPermissions).length - 1 && (
                <Separator className="my-6 bg-[#E6E8EB]" />
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updatePermissionsMutation.isPending}
              className="rounded-[12px]"
            >
              {updatePermissionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les autorisations"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E6E8EB] bg-[#F9FAFB]">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#3BBF7A] flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1B1F24]">À propos des autorisations</h3>
              <p className="text-sm text-[#6B7280]">
                Les permissions peuvent être héritées du rôle de l'utilisateur ou surchargées
                individuellement. Les permissions surchargées sont marquées et prévalent sur les
                valeurs par défaut du rôle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



