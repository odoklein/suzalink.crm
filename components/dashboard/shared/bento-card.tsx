"use client";

import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

export type BentoSize = "sm" | "md" | "lg" | "xl" | "full";

interface BentoCardProps {
  children: ReactNode;
  size?: BentoSize;
  className?: string;
  gradient?: "blue" | "green" | "amber" | "purple" | "rose" | "cyan" | "none";
  glass?: boolean;
  hover?: boolean;
  delay?: number;
}

const sizeClasses: Record<BentoSize, string> = {
  sm: "col-span-1 row-span-1 min-h-[160px]",
  md: "col-span-1 row-span-1 min-h-[240px]",
  lg: "col-span-2 row-span-1 min-h-[280px]",
  xl: "col-span-2 row-span-2 min-h-[400px]",
  full: "col-span-full row-span-1 min-h-[200px]",
};

const gradientClasses: Record<string, string> = {
  blue: "bg-gradient-to-br from-blue-500/3 via-transparent to-indigo-500/2",
  green: "bg-gradient-to-br from-emerald-500/3 via-transparent to-teal-500/2",
  amber: "bg-gradient-to-br from-amber-500/3 via-transparent to-orange-500/2",
  purple: "bg-gradient-to-br from-purple-500/3 via-transparent to-pink-500/2",
  rose: "bg-gradient-to-br from-rose-500/3 via-transparent to-red-500/2",
  cyan: "bg-gradient-to-br from-cyan-500/3 via-transparent to-blue-500/2",
  none: "",
};

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      children,
      size = "md",
      className,
      gradient = "none",
      glass = false,
      hover = true,
      delay = 0,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative rounded-xl border border-gray-300/40 overflow-hidden",
          "transition-all duration-300 ease-out",
          // Size
          sizeClasses[size],
          // Gradient
          gradientClasses[gradient],
          // Background
          glass
            ? "bg-white/70 backdrop-blur-xl"
            : "bg-white",
          // Hover effects
          hover && "hover:shadow-sm hover:border-gray-400/50",
          // Animation
          "animate-in fade-in-0 slide-in-from-bottom-4",
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: "both",
        }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative h-full p-4">
          {children}
        </div>
      </div>
    );
  }
);

BentoCard.displayName = "BentoCard";

// Bento Grid Container
interface BentoGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function BentoGrid({ children, columns = 3, className }: BentoGridProps) {
  const columnClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid gap-4 auto-rows-auto",
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

// Card Header Component
interface BentoCardHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  iconBg?: string;
}

export function BentoCardHeader({
  icon,
  title,
  subtitle,
  action,
  iconBg = "bg-gray-100",
}: BentoCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              iconBg
            )}
          >
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Card Content Wrapper
export function BentoCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}

// Card Footer
export function BentoCardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 pt-4 border-t border-gray-100 flex items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}


