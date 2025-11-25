"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Shield, Activity, MessageSquare, Loader2 } from "lucide-react";
import { UserProfileTab } from "@/components/admin/user-profile-tab";
import { UserAuthorizationsTab } from "@/components/admin/user-authorizations-tab";
import { UserActivityTab } from "@/components/admin/user-activity-tab";
import { UserCommunicationTab } from "@/components/admin/user-communication-tab";
import { formatDistanceToNow } from "date-fns";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Administrateur",
      MANAGER: "Gestionnaire",
      BD: "Business Developer",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#EF4444]/10 text-[#EF4444]";
      case "MANAGER":
        return "bg-[#4C85FF]/10 text-[#4C85FF]";
      case "BD":
        return "bg-[#3BBF7A]/10 text-[#3BBF7A]";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280]";
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
          <Loader2 className="h-8 w-8 animate-spin text-[#3BBF7A]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <Card className="border-[#E6E8EB]">
          <CardContent className="py-12 text-center">
            <p className="text-body text-[#6B7280]">Utilisateur non trouvé</p>
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
    <div className="p-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="mb-4 rounded-[12px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>

        <Card className="border-[#E6E8EB]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A] font-semibold text-lg">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-[28px] font-semibold text-[#1B1F24] tracking-[-0.5px]">
                    {user.email}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className={user.isActive ? "bg-[#3BBF7A] text-white" : ""}
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  {user.lastLoginAt && (
                    <p className="text-sm text-[#6B7280] mt-2">
                      Dernière connexion:{" "}
                      {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-[#E6E8EB]">
        <CardContent className="p-0">
          <Tabs defaultValue="profile" className="w-full">
            <div className="border-b border-[#E6E8EB] px-6">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger
                  value="authorizations"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Autorisations
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Activité
                </TabsTrigger>
                <TabsTrigger
                  value="communication"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Communication
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="profile" className="mt-0">
                <UserProfileTab userId={userId} user={user} />
              </TabsContent>

              <TabsContent value="authorizations" className="mt-0">
                <UserAuthorizationsTab userId={userId} user={user} />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <UserActivityTab userId={userId} />
              </TabsContent>

              <TabsContent value="communication" className="mt-0">
                <UserCommunicationTab userId={userId} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}




