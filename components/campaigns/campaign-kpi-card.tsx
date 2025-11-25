"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

type CampaignKpiCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  colorClass?: string;
  iconBgColor?: string;
  iconGradient?: string;
};

export function CampaignKpiCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  colorClass = "text-primary-500",
  iconBgColor = "bg-gradient-to-br from-primary-100 to-primary-50",
  iconGradient,
}: CampaignKpiCardProps) {
  const showTrend = typeof trend === "number";
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const gradientStyle = iconGradient 
    ? { background: iconGradient }
    : {};

  return (
    <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-primary-200 transition-all duration-200 border-2 border-transparent group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div 
            className={`rounded-2xl p-3.5 ${iconBgColor} ${colorClass} shadow-sm group-hover:scale-110 transition-transform duration-200`}
            style={gradientStyle}
          >
            <Icon className="h-5 w-5" />
          </div>
          {showTrend && (
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold px-2 py-1 rounded-lg ${
                isPositive
                  ? "text-success-text bg-[#D1FAE5]"
                  : isNegative
                  ? "text-destructive-text bg-[#FEE2E2]"
                  : "text-text-body bg-muted"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              {trend !== 0 && <span>{Math.abs(trend).toFixed(1)}%</span>}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-body">{title}</p>
          <p className="text-[32px] font-bold text-text-main tracking-[-0.75px] leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-body mt-2 font-medium">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


