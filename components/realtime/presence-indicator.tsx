"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PresenceIndicatorProps {
  userId: string;
  email: string;
  isOnline: boolean;
  currentActivity?: string;
}

export function PresenceIndicator({
  userId,
  email,
  isOnline,
  currentActivity,
}: PresenceIndicatorProps) {
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A] text-xs">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#3BBF7A] border-2 border-white rounded-full" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{email.split("@")[0]}</p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "En ligne" : "Hors ligne"}
            </p>
            {currentActivity && (
              <p className="text-xs text-muted-foreground">{currentActivity}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}











