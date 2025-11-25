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
import { Loader2, Key, UserCog } from "lucide-react";

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
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Informations de base
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Gérer les informations principales de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="bg-[#F9FAFB] rounded-[12px]" />
            <p className="text-sm text-[#6B7280]">L'adresse email ne peut pas être modifiée</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" className="rounded-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="MANAGER">Gestionnaire</SelectItem>
                <SelectItem value="BD">Business Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone" className="rounded-[12px]">
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

          <div className="flex items-center space-x-2">
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Utilisateur actif
            </Label>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="rounded-[12px]"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">Actions rapides</CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Actions administratives pour cet utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => resetPasswordMutation.mutate()}
            disabled={resetPasswordMutation.isPending}
            className="w-full justify-start rounded-[12px]"
          >
            <Key className="h-4 w-4 mr-2" />
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
          <p className="text-xs text-[#6B7280]">
            Un nouveau mot de passe temporaire sera généré et affiché, ou envoyé par email selon
            la configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



