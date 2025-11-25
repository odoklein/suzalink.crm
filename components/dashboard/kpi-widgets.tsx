"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Megaphone, Building2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewData {
  totalAccounts: number;
  activeCampaigns: number;
  totalLeads: number;
  conversionRate: string;
  trends?: {
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
}

interface KPIWidgetsProps {
  overview: OverviewData;
}

interface WidgetConfig {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

export function KPIWidgets({ overview }: KPIWidgetsProps) {
  const widgets: WidgetConfig[] = [
    {
      title: "Total Leads",
      value: overview.totalLeads.toLocaleString(),
      icon: Users,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconColor: "text-white",
    },
    {
      title: "Campagnes actives",
      value: overview.activeCampaigns.toLocaleString(),
      icon: Megaphone,
      gradient: "from-purple-500/10 to-purple-500/5",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconColor: "text-white",
    },
    {
      title: "Comptes",
      value: overview.totalAccounts.toLocaleString(),
      icon: Building2,
      gradient: "from-green-500/10 to-green-500/5",
      iconBg: "bg-gradient-to-br from-green-500 to-green-600",
      iconColor: "text-white",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {widgets.map((widget, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative overflow-hidden border-0 shadow-sm transition-all duration-200",
            "hover:shadow-md hover:scale-[1.01]"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none",
            widget.gradient
          )} />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-body mb-1 font-medium">{widget.title}</p>
                <p className="text-3xl font-bold text-text-main tracking-tight">{widget.value}</p>
              </div>
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                widget.iconBg
              )}>
                <widget.icon className={cn("h-7 w-7", widget.iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
