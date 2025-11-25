"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPIMetric {
  label: string;
  value: number | string;
  previousValue?: number | string;
  format?: "number" | "percentage" | "currency" | "duration";
}

export function CampaignKPIRow({ metrics }: { metrics: KPIMetric[] }) {
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === "string") return value;

    switch (format) {
      case "percentage":
        return `${(value * 100).toFixed(1)}%`;
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(value);
      case "duration":
        return `${Math.round(value)} jours`;
      default:
        return value.toLocaleString("fr-FR");
    }
  };

  const getTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return null;
    return change > 0 ? "up" : "down";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const trend = getTrend(
          typeof metric.value === "number" ? metric.value : 0,
          typeof metric.previousValue === "number" ? metric.previousValue : undefined
        );

        return (
          <Card key={index} className="border-[#E6E8EB]">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#6B7280]">{metric.label}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-[28px] font-semibold text-[#1B1F24]">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  {trend && (
                    <div
                      className={`flex items-center gap-1 ${
                        trend === "up" ? "text-[#3BBF7A]" : "text-[#EF4444]"
                      }`}
                    >
                      {trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>
                {metric.previousValue !== undefined && trend && (
                  <p className="text-xs text-[#6B7280]">
                    vs période précédente: {formatValue(metric.previousValue, metric.format)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}






