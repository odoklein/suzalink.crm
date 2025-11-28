"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Lock,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState } from "@/components/help/empty-state";

interface LoginHistoryItem {
  id: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  status: "success" | "failed";
  device: string | null;
}

interface SessionItem {
  id: string;
  sessionToken: string;
  createdAt: string;
  expires: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
}

interface SecurityData {
  loginHistory: LoginHistoryItem[];
  sessions: SessionItem[];
  securityEvents: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    severity: "low" | "medium" | "high";
  }[];
  securityStatus: {
    lastPasswordChange: string | null;
    failedLoginAttempts: number;
    accountLocked: boolean;
    twoFactorEnabled: boolean;
  };
}

interface UserSecurityTabProps {
  userId: string;
}

export function UserSecurityTab({ userId }: UserSecurityTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  const { data: security, isLoading } = useQuery<SecurityData>({
    queryKey: ["user-security", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/login-history`);
      if (!res.ok) throw new Error("Failed to fetch security data");
      return res.json();
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-security", userId] });
      toast({
        title: "Session révoquée",
        description: "La session a été révoquée avec succès.",
      });
      setRevokeDialogOpen(false);
      setSessionToRevoke(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de révoquer la session.",
        variant: "destructive",
      });
    },
  });

  const handleRevokeSession = (sessionId: string) => {
    setSessionToRevoke(sessionId);
    setRevokeDialogOpen(true);
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Appareil inconnu";
    // Simple parsing - in production you'd use a proper UA parser
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Navigateur";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
      case "medium":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
    }
  };

  if (isLoading) {
    return <SecuritySkeleton />;
  }

  if (!security) {
    return (
      <EmptyState
        icon={Shield}
        title="Données non disponibles"
        description="Les données de sécurité ne sont pas disponibles pour cet utilisateur."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E6E8EB]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  security.securityStatus.accountLocked
                    ? "bg-[#EF4444]/10"
                    : "bg-[#00D985]/10"
                }`}
              >
                {security.securityStatus.accountLocked ? (
                  <Lock className="h-5 w-5 text-[#EF4444]" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-[#00D985]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Statut du compte</p>
                <p
                  className={`font-semibold ${
                    security.securityStatus.accountLocked
                      ? "text-[#EF4444]"
                      : "text-[#00D985]"
                  }`}
                >
                  {security.securityStatus.accountLocked ? "Verrouillé" : "Actif"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E6E8EB]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1A6BFF]/10">
                <Key className="h-5 w-5 text-[#1A6BFF]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Dernier changement MDP</p>
                <p className="font-semibold text-[#1B1F24]">
                  {security.securityStatus.lastPasswordChange
                    ? formatDistanceToNow(new Date(security.securityStatus.lastPasswordChange), {
                        addSuffix: true,
                        locale: fr,
                      })
                    : "Jamais"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E6E8EB]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  security.securityStatus.failedLoginAttempts > 3
                    ? "bg-[#EF4444]/10"
                    : "bg-[#F1F3F5]"
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    security.securityStatus.failedLoginAttempts > 3
                      ? "text-[#EF4444]"
                      : "text-[#6B7280]"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Tentatives échouées</p>
                <p
                  className={`font-semibold ${
                    security.securityStatus.failedLoginAttempts > 3
                      ? "text-[#EF4444]"
                      : "text-[#1B1F24]"
                  }`}
                >
                  {security.securityStatus.failedLoginAttempts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E6E8EB]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  security.securityStatus.twoFactorEnabled
                    ? "bg-[#00D985]/10"
                    : "bg-[#F59E0B]/10"
                }`}
              >
                <Shield
                  className={`h-5 w-5 ${
                    security.securityStatus.twoFactorEnabled
                      ? "text-[#00D985]"
                      : "text-[#F59E0B]"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Double authentification</p>
                <p
                  className={`font-semibold ${
                    security.securityStatus.twoFactorEnabled
                      ? "text-[#00D985]"
                      : "text-[#F59E0B]"
                  }`}
                >
                  {security.securityStatus.twoFactorEnabled ? "Activée" : "Non activée"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="border-[#E6E8EB]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#1B1F24]">
                Sessions actives
              </CardTitle>
              <CardDescription className="text-sm text-[#6B7280]">
                Gérez les sessions actives de cet utilisateur
              </CardDescription>
            </div>
            <Badge className="bg-[#1A6BFF]/10 text-[#1A6BFF] border-0">
              {security.sessions.length} session(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {security.sessions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <Monitor className="h-6 w-6 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#6B7280]">Aucune session active</p>
            </div>
          ) : (
            <div className="space-y-3">
              {security.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border ${
                    session.isCurrent
                      ? "border-[#00D985] bg-[#00D985]/5"
                      : "border-[#E6E8EB] hover:bg-[#F8F9FA]"
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#F1F3F5]">
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1B1F24]">
                            {parseUserAgent(session.userAgent)}
                          </p>
                          {session.isCurrent && (
                            <Badge className="bg-[#00D985] text-white border-0 text-xs">
                              Session actuelle
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#6B7280]">
                          {session.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ipAddress}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Créée{" "}
                            {formatDistanceToNow(new Date(session.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          Expire le {format(new Date(session.expires), "dd/MM/yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        className="rounded-lg border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                        Révoquer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="border-[#E6E8EB]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1B1F24]">
            Historique des connexions
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280]">
            Les 20 dernières tentatives de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {security.loginHistory.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <LogIn className="h-6 w-6 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#6B7280]">Aucun historique de connexion</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-[#1B1F24]">Date</TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">Statut</TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">Appareil</TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">Adresse IP</TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">Localisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {security.loginHistory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F8F9FA]/50">
                    <TableCell>
                      <div>
                        <p className="text-sm text-[#1B1F24]">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {format(new Date(item.createdAt), "HH:mm:ss", { locale: fr })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border ${
                          item.status === "success"
                            ? "bg-[#00D985]/10 text-[#00D985] border-[#00D985]/20"
                            : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
                        }`}
                      >
                        {item.status === "success" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {item.status === "success" ? "Succès" : "Échec"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(item.userAgent)}
                        <span className="text-sm text-[#6B7280]">
                          {parseUserAgent(item.userAgent)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#6B7280] font-mono">
                        {item.ipAddress || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#6B7280]">{item.location || "—"}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      {security.securityEvents.length > 0 && (
        <Card className="border-[#E6E8EB]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1B1F24]">
              Événements de sécurité
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280]">
              Changements de permissions, mots de passe et activités suspectes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {security.securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#E6E8EB]"
                >
                  <Badge className={`${getSeverityColor(event.severity)} border text-xs`}>
                    {event.severity === "high"
                      ? "Haute"
                      : event.severity === "medium"
                      ? "Moyenne"
                      : "Basse"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1B1F24]">{event.type}</p>
                    <p className="text-sm text-[#6B7280]">{event.description}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoke Session Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer la session</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir révoquer cette session ? L'utilisateur sera déconnecté de cet
              appareil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[12px]">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && revokeSessionMutation.mutate(sessionToRevoke)}
              className="bg-[#EF4444] hover:bg-[#DC2626] rounded-[12px]"
              disabled={revokeSessionMutation.isPending}
            >
              {revokeSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Révocation...
                </>
              ) : (
                "Révoquer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-[#E6E8EB]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-[#E6E8EB]">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#E6E8EB]">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








