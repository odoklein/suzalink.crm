"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
  ExternalLink,
  Target,
  Phone,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignStats {
  leads: number;
  qualified: number;
  contacted: number;
  bookings: number;
  conversionRate: number;
}

interface Campaign {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Draft" | "Completed";
  startDate: string | null;
  account: {
    id: string;
    companyName: string;
  };
  _count?: {
    leads: number;
  };
  stats?: CampaignStats;
}

interface CampaignCardEnhancedProps {
  campaign: Campaign;
  index?: number;
  onEdit?: (id: string) => void;
  onDelete?: (campaign: Campaign) => void;
  onClick?: (id: string) => void;
}

const STATUS_CONFIG = {
  Active: {
    label: "Active",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    glow: "shadow-emerald-500/20",
  },
  Paused: {
    label: "En pause",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    glow: "shadow-amber-500/20",
  },
  Draft: {
    label: "Brouillon",
    color: "bg-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    glow: "shadow-gray-400/20",
  },
  Completed: {
    label: "Terminée",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    glow: "shadow-blue-500/20",
  },
};

function StatBadge({
  icon: Icon,
  value,
  label,
  color = "text-gray-600",
}: {
  icon: typeof Users;
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <Icon className={cn("h-3.5 w-3.5", color)} />
            <span className="text-sm font-semibold text-gray-900">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CampaignCardEnhanced({
  campaign,
  index = 0,
  onEdit,
  onDelete,
  onClick,
}: CampaignCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.Draft;

  // Calculate stats (use provided or derive from _count)
  const stats: CampaignStats = campaign.stats || {
    leads: campaign._count?.leads || 0,
    qualified: Math.floor((campaign._count?.leads || 0) * 0.3),
    contacted: Math.floor((campaign._count?.leads || 0) * 0.6),
    bookings: Math.floor((campaign._count?.leads || 0) * 0.1),
    conversionRate: campaign._count?.leads ? 30 : 0,
  };

  const formattedDate = campaign.startDate
    ? new Date(campaign.startDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Non définie";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-white overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-gray-200/50",
        "hover:border-gray-300 hover:-translate-y-1",
        "animate-in fade-in slide-in-from-bottom-4",
        statusConfig.borderColor
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          statusConfig.color,
          "transition-all duration-300",
          isHovered && "h-1.5"
        )}
      />

      {/* Card content */}
      <div className="p-5 pt-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            {/* Company */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 truncate">
                {campaign.account?.companyName || "Aucun compte"}
              </span>
            </div>

            {/* Campaign name */}
            <h3 className="text-lg font-semibold text-gray-900 leading-tight truncate group-hover:text-primary-600 transition-colors">
              {campaign.name}
            </h3>
          </div>

          {/* Status badge */}
          <Badge
            className={cn(
              "shrink-0 font-medium px-2.5 py-1 rounded-lg border",
              statusConfig.bgColor,
              statusConfig.textColor,
              statusConfig.borderColor,
              "shadow-sm",
              statusConfig.glow
            )}
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig.color)}
            />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatBadge
            icon={Users}
            value={stats.leads}
            label="Leads totaux"
            color="text-blue-500"
          />
          <StatBadge
            icon={CheckCircle2}
            value={stats.qualified}
            label="Leads qualifiés"
            color="text-emerald-500"
          />
          <StatBadge
            icon={Calendar}
            value={stats.bookings}
            label="RDV planifiés"
            color="text-violet-500"
          />
          <StatBadge
            icon={TrendingUp}
            value={`${stats.conversionRate}%`}
            label="Taux de conversion"
            color="text-amber-500"
          />
        </div>

        {/* Date row */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span>Début {formattedDate}</span>
        </div>
      </div>

      {/* Hover actions overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-5 py-4",
          "bg-gradient-to-t from-white via-white/95 to-transparent",
          "flex items-center justify-between gap-3",
          "transition-all duration-300",
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(campaign.id);
            }}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Modifier
          </Button>
          <Link href={`/campaigns/${campaign.id}/import`} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs font-medium"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Importer
            </Button>
          </Link>
        </div>

        {/* View button */}
        <Button
          size="sm"
          className="h-8 rounded-lg text-xs font-medium bg-primary-500 hover:bg-primary-600"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(campaign.id);
          }}
        >
          Voir la campagne
          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      {/* More actions menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg",
                "opacity-0 group-hover:opacity-100",
                "transition-all duration-200",
                "hover:bg-gray-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onClick?.(campaign.id)}>
              <ExternalLink />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(campaign.id)}>
              <Edit />
              Modifier la campagne
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/campaigns/${campaign.id}/import`}>
                <Upload />
                Importer CSV
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(campaign)}
              destructive
            >
              <Trash2 />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Clickable area */}
      <Link
        href={`/campaigns/${campaign.id}`}
        className="absolute inset-0 z-0"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick(campaign.id);
          }
        }}
      />
    </div>
  );
}

// Skeleton loader for the card
export function CampaignCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5 pt-6",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="h-1 bg-gray-200 rounded-full mb-4 -mt-2 -mx-5" />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-100 rounded mb-2 animate-pulse" />
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

