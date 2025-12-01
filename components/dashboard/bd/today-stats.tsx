"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { AnimatedCounter } from "@/components/dashboard/shared/animated-counter";
import { Sparkline } from "@/components/dashboard/shared/sparkline";
import { cn } from "@/lib/utils";
import {
  Phone,
  UserCheck,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface TodayStatsProps {
  callsMade: number;
  callsTarget: number;
  callsTrend: number[];
  leadsQualified: number;
  leadsTarget: number;
  avgCallDuration: string;
  conversionRate: number;
  conversionChange: number;
}

export function TodayStats({
  callsMade,
  callsTarget,
  callsTrend,
  leadsQualified,
  leadsTarget,
  avgCallDuration,
  conversionRate,
  conversionChange,
}: TodayStatsProps) {
  const stats = [
    {
      title: "Appels aujourd'hui",
      value: callsMade,
      target: callsTarget,
      icon: Phone,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: callsTrend,
      showSparkline: true,
    },
    {
      title: "Leads qualifiés",
      value: leadsQualified,
      target: leadsTarget,
      icon: UserCheck,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      showProgress: true,
    },
    {
      title: "Durée moyenne",
      value: avgCallDuration,
      icon: Clock,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      isTime: true,
    },
    {
      title: "Taux de conversion",
      value: conversionRate,
      change: conversionChange,
      icon: Target,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      isPercentage: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <BentoCard
          key={stat.title}
          size="sm"
          delay={index * 50}
          className="!min-h-[140px]"
          hover
        >
          <div className="h-full flex flex-col">
            {/* Icon and Title */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  stat.iconBg
                )}
              >
                <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{stat.title}</span>
            </div>

            {/* Value */}
            <div className="flex-1 flex items-end justify-between">
              <div>
                {stat.isTime ? (
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                ) : stat.isPercentage ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 tabular-nums">
                      <AnimatedCounter value={stat.value as number} suffix="%" />
                    </span>
                    {stat.change !== undefined && (
                      <span
                        className={cn(
                          "flex items-center text-xs font-medium",
                          stat.change >= 0 ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {stat.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(stat.change)}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 tabular-nums">
                      <AnimatedCounter value={stat.value as number} />
                    </span>
                    {stat.target && (
                      <span className="text-sm text-gray-400">/{stat.target}</span>
                    )}
                  </div>
                )}

                {/* Progress bar for targets */}
                {stat.showProgress && stat.target && (
                  <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(((stat.value as number) / stat.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Sparkline */}
              {stat.showSparkline && stat.trend && (
                <Sparkline
                  data={stat.trend}
                  width={60}
                  height={32}
                  color="primary"
                />
              )}
            </div>
          </div>
        </BentoCard>
      ))}
    </div>
  );
}




