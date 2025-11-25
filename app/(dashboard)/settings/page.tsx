"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, Lock, Mail, Bell, Users, ExternalLink } from "lucide-react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { EmailSignatureSettings } from "@/components/settings/email-signature-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1B1F24] tracking-[-0.5px]">
              Paramètres
            </h1>
            <p className="text-body text-[#6B7280] mt-2">
              Gérez vos préférences et configurations personnelles
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin/users">
              <Button variant="outline" className="rounded-[12px]">
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

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
                  value="security"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Sécurité
                </TabsTrigger>
                <TabsTrigger
                  value="email-signature"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email et signature
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3BBF7A] data-[state=active]:bg-transparent rounded-none px-6 py-4"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="profile" className="mt-0">
                <ProfileSettings />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecuritySettings />
              </TabsContent>

              <TabsContent value="email-signature" className="mt-0">
                <EmailSignatureSettings />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationSettings />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

