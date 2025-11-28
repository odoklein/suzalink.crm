"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger" | "amber";
  showValue?: boolean;
  label?: string;
  sublabel?: string;
  animated?: boolean;
}

const colorClasses = {
  primary: "stroke-primary-500",
  success: "stroke-emerald-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
  amber: "stroke-orange-500",
};

const bgColorClasses = {
  primary: "stroke-primary-100",
  success: "stroke-emerald-100",
  warning: "stroke-amber-100",
  danger: "stroke-red-100",
  amber: "stroke-orange-100",
};

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  color = "primary",
  showValue = true,
  label,
  sublabel,
  animated = true,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColorClasses[color]}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            colorClasses[color],
            animated && "transition-all duration-1000 ease-out"
          )}
        />
      </svg>
      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {Math.round(animatedValue)}%
          </span>
          {label && (
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          )}
          {sublabel && (
            <span className="text-[10px] text-gray-400">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Mini progress ring for inline use
interface MiniProgressRingProps {
  value: number;
  size?: number;
  color?: "primary" | "success" | "warning" | "danger" | "amber";
}

export function MiniProgressRing({
  value,
  size = 24,
  color = "primary",
}: MiniProgressRingProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className={bgColorClasses[color]}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn(colorClasses[color], "transition-all duration-500 ease-out")}
      />
    </svg>
  );
}

