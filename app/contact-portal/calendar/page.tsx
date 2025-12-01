"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarIntegration {
  id: string;
  provider: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

const PROVIDERS = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "📅",
    color: "from-red-500 to-yellow-500",
    description: "Connectez votre agenda Google pour synchroniser vos disponibilités",
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    icon: "📆",
    color: "from-blue-500 to-cyan-500",
    description: "Connectez votre agenda Outlook pour synchroniser vos disponibilités",
  },
];

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery<CalendarIntegration[]>({
    queryKey: ["contact-calendar-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/calendar");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/contact-portal/calendar/${provider}/connect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start connection");
      return res.json();
    },
    onSuccess: (data) => {
      // Redirect to OAuth consent screen
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la connexion",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/contact-portal/calendar/${integrationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-calendar-integrations"] });
      toast({
        title: "Déconnecté",
        description: "Le calendrier a été déconnecté avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de déconnecter le calendrier",
        variant: "destructive",
      });
    },
  });

  const getConnectedProvider = (providerId: string) => {
    return integrations.find(i => i.provider === providerId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon calendrier</h1>
        <p className="text-slate-500 mt-1">
          Connectez votre calendrier pour synchroniser automatiquement vos disponibilités
        </p>
      </div>

      {/* Connection Status */}
      {integrations.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Calendrier connecté</p>
                <p className="text-sm text-emerald-700">
                  Vos disponibilités sont synchronisées automatiquement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const connected = getConnectedProvider(provider.id);
          
          return (
            <Card 
              key={provider.id}
              className={cn(
                "relative overflow-hidden transition-all",
                connected && "border-primary-200 bg-primary-50/30"
              )}
            >
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                provider.color
              )} />
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{provider.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      {connected && (
                        <p className="text-sm text-slate-500 mt-1">
                          {connected.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {connected && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      Connecté
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  {provider.description}
                </p>
                
                {connected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(connected.id)}
                      disabled={disconnectMutation.isPending}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Déconnecter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resync
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => connectMutation.mutate(provider.id)}
                    disabled={connectMutation.isPending}
                    className={cn(
                      "w-full bg-gradient-to-r text-white",
                      provider.color
                    )}
                  >
                    {connectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connecter
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 mb-1">
                Comment ça marche ?
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Connectez votre calendrier pour que vos créneaux occupés soient automatiquement bloqués</li>
                <li>• Seuls vos créneaux "occupé/busy" sont synchronisés, pas les détails de vos événements</li>
                <li>• Vous pouvez déconnecter à tout moment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}












