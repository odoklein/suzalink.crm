"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  User,
  Shield,
  Activity,
  MessageSquare,
  Loader2,
  BarChart3,
  Lock,
  MoreVertical,
  Key,
  Mail,
  Download,
  Target,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { UserProfileTab } from "@/components/admin/user-profile-tab";
import { UserAuthorizationsTab } from "@/components/admin/user-authorizations-tab";
import { UserActivityTab } from "@/components/admin/user-activity-tab";
import { UserCommunicationTab } from "@/components/admin/user-communication-tab";
import { UserPerformanceTab } from "@/components/admin/user-performance-tab";
import { UserSecurityTab } from "@/components/admin/user-security-tab";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
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

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Administrateur",
      MANAGER: "Gestionnaire",
      BD: "Business Developer",
      DEVELOPER: "Développeur",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
      case "MANAGER":
        return "bg-[#1A6BFF]/10 text-[#1A6BFF] border-[#1A6BFF]/20";
      case "BD":
        return "bg-[#00D985]/10 text-[#00D985] border-[#00D985]/20";
      case "DEVELOPER":
        return "bg-[#A46CFF]/10 text-[#A46CFF] border-[#A46CFF]/20";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
    }
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A6BFF]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <Card className="border-[#E6E8EB]">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F1F3F5] flex items-center justify-center">
              <User className="h-7 w-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[15px] text-[#6B7280] font-medium">Utilisateur non trouvé</p>
            <Button
              onClick={() => router.push("/admin/users")}
              variant="outline"
              className="mt-4 rounded-[12px]"
            >
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/users")}
        className="rounded-[12px] text-[#6B7280] hover:text-[#1B1F24] -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la liste
      </Button>

      {/* Enhanced Header Card */}
      <Card className="border-[#E6E8EB] overflow-hidden">
        {/* Gradient Header Background */}
        <div className="h-24 bg-gradient-to-r from-[#1A6BFF] via-[#4C85FF] to-[#A46CFF]" />

        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* User Info */}
            <div className="flex items-end gap-5">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1A6BFF] to-[#0F4FCC] text-white font-bold text-2xl">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-white ${
                    user.isActive ? "bg-[#00D985]" : "bg-[#9CA3AF]"
                  }`}
                />
              </div>
              <div className="pb-1">
                <h1 className="text-[28px] font-bold text-[#1B1F24] tracking-[-0.5px]">
                  {user.email.split("@")[0]}
                </h1>
                <p className="text-[15px] text-[#6B7280] mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getRoleColor(user.role)} border font-medium`}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge
                    className={`border font-medium ${
                      user.isActive
                        ? "bg-[#00D985]/10 text-[#00D985] border-[#00D985]/20"
                        : "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20"
                    }`}
                  >
                    {user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
                className="rounded-[12px] border-[#DEE2E6]"
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Réinitialiser MDP
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-[12px] border-[#DEE2E6]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer un email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter les données
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[#EF4444]">
                    <Lock className="h-4 w-4 mr-2" />
                    Verrouiller le compte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E6E8EB]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1A6BFF]/10">
                <Target className="h-5 w-5 text-[#1A6BFF]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Leads assignés</p>
                <p className="text-lg font-semibold text-[#1B1F24]">
                  {user._count?.assignedLeads || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00D985]/10">
                <CheckCircle className="h-5 w-5 text-[#00D985]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Activités</p>
                <p className="text-lg font-semibold text-[#1B1F24]">
                  {user._count?.activities || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#F59E0B]/10">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Dernière connexion</p>
                <p className="text-lg font-semibold text-[#1B1F24]">
                  {user.lastLoginAt
                    ? formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                        locale: fr,
                      })
                    : "Jamais"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#A46CFF]/10">
                <Calendar className="h-5 w-5 text-[#A46CFF]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Membre depuis</p>
                <p className="text-lg font-semibold text-[#1B1F24]">
                  {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="border-[#E6E8EB] overflow-hidden">
        <Tabs defaultValue="profile" className="w-full">
          <div className="border-b border-[#E6E8EB] px-6 bg-[#F8F9FA]">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="authorizations"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <Shield className="h-4 w-4 mr-2" />
                Autorisations
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activité
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1A6BFF] data-[state=active]:bg-transparent data-[state=active]:text-[#1A6BFF] rounded-none px-4 py-3.5 text-[#6B7280] font-medium transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Communication
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
              <UserProfileTab userId={userId} user={user} />
            </TabsContent>

            <TabsContent value="performance" className="mt-0 focus-visible:outline-none">
              <UserPerformanceTab userId={userId} />
            </TabsContent>

            <TabsContent value="authorizations" className="mt-0 focus-visible:outline-none">
              <UserAuthorizationsTab userId={userId} user={user} />
            </TabsContent>

            <TabsContent value="security" className="mt-0 focus-visible:outline-none">
              <UserSecurityTab userId={userId} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 focus-visible:outline-none">
              <UserActivityTab userId={userId} />
            </TabsContent>

            <TabsContent value="communication" className="mt-0 focus-visible:outline-none">
              <UserCommunicationTab userId={userId} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
