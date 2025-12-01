"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { AnimatedCounter } from "@/components/dashboard/shared/animated-counter";
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, ArrowRight } from "lucide-react";

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  value: number;
  conversionFromPrevious: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
  totalValue: number;
  predictedRevenue: number;
}

export function PipelineFunnel({
  stages,
  totalValue,
  predictedRevenue,
}: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <BentoCard size="lg" gradient="green" delay={50}>
      <BentoCardHeader
        icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        title="Pipeline commercial"
        subtitle="Valeur des opportunités"
        iconBg="bg-emerald-100"
      />

      {/* Summary Stats */}
      <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50">
        <div>
          <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
          <div className="flex items-center gap-1">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              <AnimatedCounter
                value={totalValue}
                separator=" "
                suffix="€"
              />
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500 mb-1">Revenue prévu</p>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">
              <AnimatedCounter
                value={predictedRevenue}
                separator=" "
                suffix="€"
              />
            </span>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="space-y-1">
              {/* Label Row */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{stage.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 tabular-nums">
                    {stage.count} leads
                  </span>
                  {!isLast && stage.conversionFromPrevious > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      {stage.conversionFromPrevious}%
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out",
                    "flex items-center justify-end pr-3"
                  )}
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="text-sm font-semibold text-white tabular-nums drop-shadow">
                    {stage.value.toLocaleString("fr-FR")}€
                  </span>
                </div>
              </div>

              {/* Conversion Arrow */}
              {!isLast && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <div className="h-4 w-px bg-gray-300" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}


