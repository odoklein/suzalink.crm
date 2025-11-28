"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { ProgressRing } from "@/components/dashboard/shared/progress-ring";
import { AnimatedCounter } from "@/components/dashboard/shared/animated-counter";
import { cn } from "@/lib/utils";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface HealthMetric {
  label: string;
  value: number;
  target: number;
  status: "good" | "warning" | "critical";
}

interface HealthScoreProps {
  score: number;
  previousScore: number;
  metrics: {
    conversionRate: HealthMetric;
    activityRate: HealthMetric;
    responseTime: HealthMetric;
    qualifiedLeads: HealthMetric;
  };
}

const statusConfig = {
  good: { color: "text-emerald-600", bg: "bg-emerald-100", ring: "success" as const },
  warning: { color: "text-amber-600", bg: "bg-amber-100", ring: "warning" as const },
  critical: { color: "text-red-600", bg: "bg-red-100", ring: "danger" as const },
};

function getScoreColor(score: number) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export function HealthScore({ score, previousScore, metrics }: HealthScoreProps) {
  const change = score - previousScore;
  const isPositive = change >= 0;
  const scoreColor = getScoreColor(score);

  const metricItems = [
    {
      key: "conversionRate",
      label: "Taux de conversion",
      icon: Target,
      metric: metrics.conversionRate,
    },
    {
      key: "activityRate",
      label: "Taux d'activité",
      icon: Activity,
      metric: metrics.activityRate,
    },
    {
      key: "responseTime",
      label: "Temps de réponse",
      icon: Zap,
      metric: metrics.responseTime,
    },
    {
      key: "qualifiedLeads",
      label: "Leads qualifiés",
      icon: Users,
      metric: metrics.qualifiedLeads,
    },
  ];

  return (
    <BentoCard size="lg" gradient="blue" glass delay={0}>
      <BentoCardHeader
        icon={<Activity className="h-5 w-5 text-blue-600" />}
        title="Santé de l'organisation"
        subtitle="Score global de performance"
        iconBg="bg-blue-100"
      />

      <div className="flex items-center gap-8">
        {/* Main Score Ring */}
        <div className="shrink-0">
          <ProgressRing
            value={score}
            size={160}
            strokeWidth={14}
            color={scoreColor}
            label="Score"
            animated
          />
          
          {/* Trend below ring */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "text-sm font-semibold",
                isPositive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}
              {change}%
            </span>
            <span className="text-xs text-gray-500">vs mois dernier</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {metricItems.map((item) => {
            const status = statusConfig[item.metric.status];
            const Icon = item.icon;
            const progress = (item.metric.value / item.metric.target) * 100;

            return (
              <div
                key={item.key}
                className={cn(
                  "p-3 rounded-xl border transition-colors",
                  item.metric.status === "critical"
                    ? "border-red-200 bg-red-50/50"
                    : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center",
                      status.bg
                    )}
                  >
                    <Icon className={cn("h-3 w-3", status.color)} />
                  </div>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 tabular-nums">
                    <AnimatedCounter value={item.metric.value} />
                  </span>
                  <span className="text-xs text-gray-400">
                    / {item.metric.target}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      item.metric.status === "good"
                        ? "bg-emerald-500"
                        : item.metric.status === "warning"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BentoCard>
  );
}

