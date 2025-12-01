"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: "primary" | "success" | "warning" | "danger" | "gray";
  showArea?: boolean;
  className?: string;
  animated?: boolean;
}

const colorMap = {
  primary: { stroke: "#1A6BFF", fill: "#1A6BFF" },
  success: { stroke: "#10B981", fill: "#10B981" },
  warning: { stroke: "#F59E0B", fill: "#F59E0B" },
  danger: { stroke: "#EF4444", fill: "#EF4444" },
  gray: { stroke: "#6B7280", fill: "#6B7280" },
};

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "primary",
  showArea = true,
  className,
  animated = true,
}: SparklineProps) {
  const { path, areaPath } = useMemo(() => {
    if (data.length < 2) return { path: "", areaPath: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: padding + ((max - value) / range) * (height - padding * 2),
    }));

    // Create smooth curve using bezier
    let pathD = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` Q ${prev.x + (cpx - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      pathD += ` Q ${cpx + (curr.x - cpx) * 0.5} ${curr.y} ${curr.x} ${curr.y}`;
    }

    // Area path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { path: pathD, areaPath: areaD };
  }, [data, width, height]);

  const colors = colorMap[color];
  const isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
  const trendColor = isPositive ? colorMap.success : colorMap.danger;

  return (
    <svg
      width={width}
      height={height}
      className={cn(
        "overflow-visible",
        animated && "animate-in fade-in-0 duration-500",
        className
      )}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.fill} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${color})`}
          className={animated ? "animate-in fade-in-0 duration-700" : ""}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "animate-in fade-in-0 duration-500" : ""}
      />

      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={width - 2}
          cy={
            2 +
            ((Math.max(...data) - data[data.length - 1]) /
              (Math.max(...data) - Math.min(...data) || 1)) *
              (height - 4)
          }
          r={3}
          fill={trendColor.fill}
          className={animated ? "animate-in zoom-in-0 duration-300 delay-500" : ""}
        />
      )}
    </svg>
  );
}

// Trend indicator with sparkline
interface TrendSparklineProps {
  data: number[];
  value: string | number;
  change: number;
  label?: string;
}

export function TrendSparkline({ data, value, change, label }: TrendSparklineProps) {
  const isPositive = change >= 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
        {label && <div className="text-xs text-gray-500 mt-0.5">{label}</div>}
        <div
          className={cn(
            "text-xs font-medium mt-1",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </div>
      </div>
      <Sparkline
        data={data}
        width={80}
        height={40}
        color={isPositive ? "success" : "danger"}
      />
    </div>
  );
}




