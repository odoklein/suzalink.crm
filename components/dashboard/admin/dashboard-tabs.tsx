"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  LayoutDashboard, BarChart3, Users, Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardTab = "overview" | "performance" | "team" | "campaigns";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: {
    overview: React.ReactNode;
    performance: React.ReactNode;
    team: React.ReactNode;
    campaigns: React.ReactNode;
  };
}

const tabConfig: Record<DashboardTab, { icon: typeof LayoutDashboard; label: string }> = {
  overview: { icon: LayoutDashboard, label: "Vue d'ensemble" },
  performance: { icon: BarChart3, label: "Performance" },
  team: { icon: Users, label: "Équipe" },
  campaigns: { icon: Megaphone, label: "Campagnes" },
};

export function DashboardTabs({ activeTab, onTabChange, children }: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as DashboardTab)} className="w-full">
      <TabsList className="w-full justify-start h-10 bg-white border border-gray-200 rounded-xl p-1 gap-1">
        {(Object.keys(tabConfig) as DashboardTab[]).map((tab) => {
          const { icon: Icon, label } = tabConfig[tab];
          const isActive = activeTab === tab;
          
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                "data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600 data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="overview" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
        {children.overview}
      </TabsContent>

      <TabsContent value="performance" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
        {children.performance}
      </TabsContent>

      <TabsContent value="team" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
        {children.team}
      </TabsContent>

      <TabsContent value="campaigns" className="mt-4 focus-visible:outline-none focus-visible:ring-0">
        {children.campaigns}
      </TabsContent>
    </Tabs>
  );
}
