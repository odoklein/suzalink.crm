"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPIWidgets } from "@/components/dashboard/kpi-widgets";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { TaskList } from "@/components/tasks/task-list";
import { TaskSuggestions } from "@/components/tasks/task-suggestions";
import { QuickActionsDrawer } from "@/components/dashboard/quick-actions-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Users, Megaphone, Mail, ListTodo, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  overview: {
    totalAccounts: number;
    activeCampaigns: number;
    totalLeads: number;
    conversionRate: string;
    trends: {
      leads: {
        current: number;
        previous: number;
        change: string;
        isPositive: boolean;
      };
      activities: {
        current: number;
        previous: number;
        change: string;
        isPositive: boolean;
      };
    };
  };
  recentDeals: Array<{
    id: string;
    name: string;
    company: string;
    campaign: string;
    status: string;
    createdAt: string;
  }>;
}

export function DashboardContent() {
  const [quickActionsDrawerOpen, setQuickActionsDrawerOpen] = useState(false);

  // Initialize email sync scheduler on mount
  useEffect(() => {
    fetch("/api/init").catch(() => {
      // Silently fail if init endpoint is not available
    });
  }, []);

  const { data, isLoading, error, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Tableau de bord</h1>
          <p className="text-body text-text-body mt-2">
            Bienvenue sur Facturix CRM
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-body text-muted-foreground">
              Chargement des données du tableau de bord...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Tableau de bord</h1>
          <p className="text-body text-text-body mt-2">
            Bienvenue sur Facturix CRM
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-body text-danger-500 mb-4">
              Erreur lors du chargement des données
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Tableau de bord</h1>
          <p className="text-body text-text-body mt-2">
            Bienvenue sur Facturix CRM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickActionsDrawerOpen(true)}
            title="Actions rapides"
          >
            <PanelRight className="h-4 w-4 mr-2" />
            Actions rapides
          </Button>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Quick Actions - Primary Focus */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-transparent pointer-events-none" />
        <CardContent className="p-8 relative">
          <h2 className="text-h2 font-semibold text-text-main mb-6">Actions rapides</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              className="h-16 text-base font-medium justify-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-md" 
              asChild
            >
              <a href="/campaigns">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                Commencer une session de prospection
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 text-base font-medium justify-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-sm hover:border-primary-200 hover:bg-primary-50/30" 
              asChild
            >
              <a href="/campaigns/new">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-purple-600" />
                </div>
                Créer une nouvelle campagne
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 text-base font-medium justify-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-sm hover:border-primary-200 hover:bg-primary-50/30" 
              asChild
            >
              <a href="/inbox/compose">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                Composer un email
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 text-base font-medium justify-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-sm hover:border-primary-200 hover:bg-primary-50/30" 
              asChild
            >
              <a href="/campaigns">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                Voir les leads
              </a>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 text-base font-medium justify-start gap-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-sm hover:border-primary-200 hover:bg-primary-50/30" 
              asChild
            >
              <a href="/tasks">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ListTodo className="h-5 w-5 text-orange-600" />
                </div>
                Voir les tâches
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Minimal Stats */}
      <KPIWidgets overview={data.overview} />

      {/* Smart Suggestions */}
      <TaskSuggestions />

      {/* Recent Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentDeals deals={data.recentDeals} />
        <TaskList filter="today" limit={5} />
      </div>

      <QuickActionsDrawer
        open={quickActionsDrawerOpen}
        onOpenChange={setQuickActionsDrawerOpen}
      />
    </div>
  );
}

