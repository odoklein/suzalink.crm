"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, UserCog, Globe, Mail, Save } from "lucide-react";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
];

interface UserProfileTabProps {
  userId: string;
  user: any;
}

export function UserProfileTab({ userId, user }: UserProfileTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState(user.timezone || "UTC");
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { role?: string; isActive?: boolean; timezone?: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Profil mis à jour",
        description: "Les informations de l'utilisateur ont été mises à jour.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mot de passe réinitialisé",
        description: data.temporaryPassword
          ? `Nouveau mot de passe temporaire: ${data.temporaryPassword}`
          : "Un email a été envoyé à l'utilisateur avec les instructions.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser le mot de passe.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({ role, isActive, timezone });
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1A6BFF]/10">
              <UserCog className="h-5 w-5 text-[#1A6BFF]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">
                Informations de base
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Gérer les informations principales de l'utilisateur
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-[#1B1F24]">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#6B7280]" />
                Email
              </div>
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-[#F8F9FA] rounded-[12px] border-[#DEE2E6] text-[#6B7280]"
            />
            <p className="text-xs text-[#9CA3AF]">L'adresse email ne peut pas être modifiée</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-[#1B1F24]">Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" className="rounded-[12px] border-[#DEE2E6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="MANAGER">Gestionnaire</SelectItem>
                <SelectItem value="BD">Business Developer</SelectItem>
                <SelectItem value="DEVELOPER">Développeur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium text-[#1B1F24]">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-[#6B7280]" />
                Fuseau horaire
              </div>
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="rounded-[12px] border-[#DEE2E6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8F9FA] border border-[#E6E8EB]">
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium text-[#1B1F24] cursor-pointer">
                Utilisateur actif
              </Label>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Les utilisateurs inactifs ne peuvent pas se connecter
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-[#00D985]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="rounded-[12px] bg-[#1A6BFF] hover:bg-[#0F4FCC] shadow-sm hover:shadow-md transition-all duration-200"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F59E0B]/10">
              <Key className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">Actions rapides</CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Actions administratives pour cet utilisateur
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-[#E6E8EB] hover:border-[#DEE2E6] hover:bg-[#F8F9FA]/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F1F3F5]">
                  <Key className="h-4 w-4 text-[#6B7280]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1B1F24]">Réinitialiser le mot de passe</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Génère un nouveau mot de passe temporaire
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
                className="rounded-[10px] border-[#DEE2E6]"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Réinitialiser"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




