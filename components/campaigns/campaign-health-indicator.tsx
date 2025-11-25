"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

type CampaignHealthProps = {
  health: "excellent" | "good" | "warning" | "critical";
  engagementRate?: number;
  activityFrequency?: "high" | "medium" | "low";
  trend?: "up" | "down" | "stable";
  conversionTrend?: number; // percentage change
  bdCoverage?: number; // percentage of leads with assigned BD
};

const HEALTH_COLORS = {
  excellent: "bg-success-100 text-success-text border-success-200",
  good: "bg-primary-100 text-primary-500 border-primary-200",
  warning: "bg-warning-100 text-warning-500 border-warning-200",
  critical: "bg-destructive-100 text-destructive-text border-destructive-200",
};

const HEALTH_ICONS = {
  excellent: CheckCircle2,
  good: CheckCircle2,
  warning: AlertCircle,
  critical: XCircle,
};

export function CampaignHealthIndicator({
  health,
  engagementRate,
  activityFrequency,
  trend,
  conversionTrend,
  bdCoverage,
}: CampaignHealthProps) {
  const Icon = HEALTH_ICONS[health];

  const getHealthLabel = () => {
    switch (health) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "warning":
        return "Warning";
      case "critical":
        return "Critical";
      default:
        return "Unknown";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      case "stable":
        return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`${HEALTH_COLORS[health]} border flex items-center gap-1.5 px-2.5 py-1`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{getHealthLabel()}</span>
        {trend && (
          <span className="ml-1 flex items-center">
            {getTrendIcon()}
          </span>
        )}
      </Badge>
      
      {/* Additional indicators as tooltips/tags */}
      {engagementRate !== undefined && (
        <span className="text-xs text-text-body">
          {engagementRate.toFixed(0)}% engaged
        </span>
      )}
      {bdCoverage !== undefined && bdCoverage < 100 && (
        <span className="text-xs text-warning-500">
          {bdCoverage.toFixed(0)}% assigned
        </span>
      )}
    </div>
  );
}

/**
 * Calculate campaign health based on metrics
 */
export function calculateCampaignHealth(
  metrics: {
    contactRate?: number;
    conversionRate?: number;
    activityFrequency?: number; // activities per week
    bdCoverage?: number; // percentage
    leadCount?: number;
    daysSinceStart?: number;
  }
): "excellent" | "good" | "warning" | "critical" {
  const { contactRate = 0, conversionRate = 0, activityFrequency = 0, bdCoverage = 0 } = metrics;

  // Health scoring logic
  let score = 0;

  // Contact rate (0-30 points)
  if (contactRate >= 70) score += 30;
  else if (contactRate >= 50) score += 20;
  else if (contactRate >= 30) score += 10;

  // Conversion rate (0-30 points)
  if (conversionRate >= 20) score += 30;
  else if (conversionRate >= 10) score += 20;
  else if (conversionRate >= 5) score += 10;

  // Activity frequency (0-20 points)
  if (activityFrequency >= 10) score += 20;
  else if (activityFrequency >= 5) score += 10;
  else if (activityFrequency >= 2) score += 5;

  // BD coverage (0-20 points)
  if (bdCoverage >= 90) score += 20;
  else if (bdCoverage >= 70) score += 15;
  else if (bdCoverage >= 50) score += 10;

  // Determine health level
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

