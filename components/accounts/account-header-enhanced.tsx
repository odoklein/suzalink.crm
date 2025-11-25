"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AccountHeaderEnhancedProps {
  companyName: string;
  contractStatus: string;
  guestToken: string;
  lastActivity?: string;
  accountId: string;
  onDelete: () => void;
}

export function AccountHeaderEnhanced({
  companyName,
  contractStatus,
  guestToken,
  lastActivity,
  accountId,
  onDelete,
}: AccountHeaderEnhancedProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (lastActivity) {
      const updateTimeAgo = () => {
        setTimeAgo(formatDistanceToNow(new Date(lastActivity), { addSuffix: true }));
      };
      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [lastActivity]);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(guestToken);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Guest token copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy token",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const isActive = contractStatus.toLowerCase() === "active";

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/accounts">
          <Button
            variant="ghost"
            size="icon"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-h1">{companyName}</h1>
            <Badge
              className={cn(
                "capitalize border transition-all duration-300",
                getStatusColor(contractStatus),
                isActive && "animate-pulse"
              )}
            >
              {contractStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>Account Details</p>
            {lastActivity && (
              <>
                <span>•</span>
                <p className="flex items-center gap-1">
                  Last activity: <span className="font-medium">{timeAgo}</span>
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/accounts/${accountId}/edit`}>
            <Button
              variant="outline"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Guest Token Quick Copy */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <span className="text-sm font-medium text-muted-foreground">Guest Token:</span>
        <code className="flex-1 text-xs font-mono bg-background px-2 py-1 rounded border truncate">
          {guestToken}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyToken}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}



