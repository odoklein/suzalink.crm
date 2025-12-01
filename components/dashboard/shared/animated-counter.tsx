"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = " ",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals);
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join(",");
  };

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

// Percentage variant
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedPercentage({
  value,
  duration = 800,
  className,
  showSign = true,
}: AnimatedPercentageProps) {
  const isPositive = value >= 0;
  const sign = showSign && isPositive ? "+" : "";

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        isPositive ? "text-emerald-600" : "text-red-500",
        className
      )}
    >
      {sign}
      <AnimatedCounter value={value} duration={duration} decimals={1} suffix="%" />
    </span>
  );
}


