"use client";

import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  position?: "inline" | "corner";
  className?: string;
  showOffline?: boolean;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const pulseClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function OnlineIndicator({
  isOnline = true,
  size = "md",
  position = "inline",
  className,
  showOffline = false,
}: OnlineIndicatorProps) {
  // Don't render anything if offline and showOffline is false
  if (!isOnline && !showOffline) {
    return null;
  }

  const positionStyles = position === "corner" 
    ? "absolute -bottom-0.5 -right-0.5 ring-2 ring-white" 
    : "";

  return (
    <span
      className={cn(
        "relative flex items-center justify-center",
        positionStyles,
        className
      )}
    >
      {/* Pulsing ring animation for online status */}
      {isOnline && (
        <span
          className={cn(
            "absolute animate-ping rounded-full bg-emerald-400 opacity-75",
            pulseClasses[size]
          )}
          style={{
            animationDuration: "1.5s",
          }}
        />
      )}
      
      {/* Main indicator dot */}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          sizeClasses[size],
          isOnline 
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
            : "bg-gray-400"
        )}
      />
    </span>
  );
}

// Wrapper component for avatars - positions indicator in corner
interface AvatarWithStatusProps {
  children: React.ReactNode;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarWithStatus({
  children,
  isOnline = true,
  size = "md",
  className,
}: AvatarWithStatusProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      <OnlineIndicator 
        isOnline={isOnline} 
        size={size} 
        position="corner"
        showOffline={true}
      />
    </div>
  );
}









