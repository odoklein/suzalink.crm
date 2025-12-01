"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { AnimatedCounter } from "@/components/dashboard/shared/animated-counter";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DayData {
  date: string;
  label: string;
  incoming: number;
  outgoing: number;
  net: number;
}

interface LeadFlowChartProps {
  data: DayData[];
  totalIncoming: number;
  totalOutgoing: number;
  trend: number;
}

export function LeadFlowChart({
  data,
  totalIncoming,
  totalOutgoing,
  trend,
}: LeadFlowChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.incoming, d.outgoing)));
  const netFlow = totalIncoming - totalOutgoing;
  const isPositiveNet = netFlow >= 0;

  return (
    <BentoCard size="md" gradient="blue" delay={250}>
      <BentoCardHeader
        icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
        title="Flux de leads"
        subtitle="Entrées vs sorties cette semaine"
        iconBg="bg-blue-100"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-emerald-50">
          <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
            <ArrowUpRight className="h-3 w-3" />
            <span className="text-xs font-medium">Entrées</span>
          </div>
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            <AnimatedCounter value={totalIncoming} />
          </span>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <ArrowDownRight className="h-3 w-3" />
            <span className="text-xs font-medium">Sorties</span>
          </div>
          <span className="text-lg font-bold text-red-700 tabular-nums">
            <AnimatedCounter value={totalOutgoing} />
          </span>
        </div>
        <div
          className={cn(
            "text-center p-2 rounded-lg",
            isPositiveNet ? "bg-blue-50" : "bg-amber-50"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center gap-1 mb-1",
              isPositiveNet ? "text-blue-600" : "text-amber-600"
            )}
          >
            {isPositiveNet ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-xs font-medium">Net</span>
          </div>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              isPositiveNet ? "text-blue-700" : "text-amber-700"
            )}
          >
            {isPositiveNet ? "+" : ""}
            <AnimatedCounter value={netFlow} />
          </span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((day, index) => {
          const incomingHeight = (day.incoming / maxValue) * 100;
          const outgoingHeight = (day.outgoing / maxValue) * 100;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Bars */}
              <div className="flex gap-0.5 items-end h-24 w-full">
                {/* Incoming bar */}
                <div
                  className="flex-1 bg-emerald-500 rounded-t transition-all duration-500 ease-out"
                  style={{ height: `${incomingHeight}%` }}
                  title={`Entrées: ${day.incoming}`}
                />
                {/* Outgoing bar */}
                <div
                  className="flex-1 bg-red-400 rounded-t transition-all duration-500 ease-out"
                  style={{ height: `${outgoingHeight}%` }}
                  title={`Sorties: ${day.outgoing}`}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] text-gray-500 font-medium">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span className="text-xs text-gray-500">Nouveaux</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          <span className="text-xs text-gray-500">Convertis/Perdus</span>
        </div>
      </div>
    </BentoCard>
  );
}


