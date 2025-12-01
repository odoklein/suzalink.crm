"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  UserX,
  Megaphone,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";

type AlertType = "stale_leads" | "inactive_bd" | "campaign_attention" | "low_conversion";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  actionUrl: string;
  actionLabel: string;
  createdAt: string;
}

interface AlertCenterProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

const alertConfig: Record<
  AlertType,
  { icon: typeof AlertTriangle; color: string; bgColor: string }
> = {
  stale_leads: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  inactive_bd: {
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  campaign_attention: {
    icon: Megaphone,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  low_conversion: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
};

const severityConfig = {
  high: { border: "border-l-red-500", bg: "bg-red-50/50" },
  medium: { border: "border-l-amber-500", bg: "bg-amber-50/50" },
  low: { border: "border-l-blue-500", bg: "bg-blue-50/50" },
};

export function AlertCenter({ alerts, onDismiss }: AlertCenterProps) {
  const highPriorityAlerts = alerts.filter((a) => a.severity === "high");
  const otherAlerts = alerts.filter((a) => a.severity !== "high");
  const sortedAlerts = [...highPriorityAlerts, ...otherAlerts];

  return (
    <BentoCard size="md" gradient="rose" delay={200}>
      <BentoCardHeader
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        title="Centre d'alertes"
        subtitle={
          alerts.length > 0 ? (
            <span className={cn(highPriorityAlerts.length > 0 && "text-red-500")}>
              {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
              {highPriorityAlerts.length > 0 &&
                ` (${highPriorityAlerts.length} urgente${highPriorityAlerts.length > 1 ? "s" : ""})`}
            </span>
          ) : (
            "Aucune alerte"
          )
        }
        iconBg="bg-red-100"
      />

      {sortedAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm font-medium text-emerald-600">Tout est en ordre !</p>
          <p className="text-xs text-gray-500 mt-1">
            Aucun problème détecté
          </p>
        </div>
      ) : (
        <div className="space-y-2 -mx-1">
          {sortedAlerts.slice(0, 4).map((alert) => {
            const config = alertConfig[alert.type];
            const severity = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  "relative p-3 rounded-lg border-l-4 transition-colors",
                  severity.border,
                  severity.bg,
                  "hover:bg-gray-50"
                )}
              >
                {/* Dismiss button */}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                )}

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {alert.description}
                    </p>

                    {/* Action */}
                    <Link
                      href={alert.actionUrl}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      {alert.actionLabel}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {alerts.length > 4 && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <Link
            href="/alerts"
            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            Voir les {alerts.length - 4} autres alertes
          </Link>
        </div>
      )}
    </BentoCard>
  );
}


