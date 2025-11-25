"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Megaphone,
  TrendingUp,
  CheckCircle,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  totalLeads: number;
  activeCampaigns: number;
  contactRate: number;
  conversionRate: number;
  recentActivityCount: number;
  averageResponseTime: number;
  trends: {
    leads: {
      current: number;
      previous: number;
      change: number;
      isPositive: boolean;
    };
    activities: {
      current: number;
      previous: number;
      change: number;
      isPositive: boolean;
    };
  };
}

interface AccountKPIWidgetsProps {
  accountId: string;
  data?: KPIData;
  isLoading?: boolean;
}

// Count-up animation hook
function useCountUp(end: number, duration: number = 1000, enabled: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || end === 0) {
      setCount(end);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, enabled]);

  return count;
}

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
  isLoading = false,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    change: number;
    isPositive: boolean;
  };
  delay?: number;
  isLoading?: boolean;
}) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  const countUpValue = typeof value === "number" ? value : 0;
  const animatedValue = useCountUp(countUpValue, 800, !isLoading && typeof value === "number");

  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        "animate-in fade-in slide-in-from-bottom-4",
        isLoading && "pointer-events-none"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-semibold text-text-main">
                {typeof value === "number" ? animatedValue.toLocaleString() : displayValue}
              </p>
            )}
            {trend && !isLoading && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-[#E6F7F1] flex items-center justify-center group-hover:bg-[#D1FAE5] transition-colors">
            <Icon className="h-6 w-6 text-primary-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountKPIWidgets({
  accountId,
  data,
  isLoading = false,
}: AccountKPIWidgetsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const widgets = [
    {
      title: "Total Prospects",
      value: data.totalLeads,
      icon: Users,
      trend: data.trends.leads,
      delay: 0,
    },
    {
      title: "Campagnes Actives",
      value: data.activeCampaigns,
      icon: Megaphone,
      delay: 100,
    },
    {
      title: "Taux de Contact",
      value: `${data.contactRate}%`,
      icon: TrendingUp,
      delay: 200,
    },
    {
      title: "Taux de Conversion",
      value: `${data.conversionRate}%`,
      icon: CheckCircle,
      delay: 300,
    },
    {
      title: "Activité Récente",
      value: data.recentActivityCount,
      icon: Activity,
      trend: data.trends.activities,
      delay: 400,
    },
    {
      title: "Temps de Réponse Moyen",
      value: `${data.averageResponseTime}h`,
      icon: Clock,
      delay: 500,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {widgets.map((widget) => (
        <KPICard
          key={widget.title}
          title={widget.title}
          value={widget.value}
          icon={widget.icon}
          trend={widget.trend}
          delay={widget.delay}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}



