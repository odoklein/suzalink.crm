"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Target,
  Calendar,
  TrendingUp,
  Building2,
  Clock,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignStats {
  totalLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
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
}

interface CampaignDashboardProps {
  campaign: Campaign;
  stats?: CampaignStats;
  children?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  onOpenSettings?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  Active: {
    label: "Active",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  Paused: {
    label: "Paused",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  Draft: {
    label: "Draft",
    color: "bg-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
  },
  Completed: {
    label: "Completed",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
};

function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  trend,
  index = 0,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  trend?: number;
  index?: number;
}) {
  const isPositiveTrend = trend && trend > 0;

  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl bg-white border border-gray-100",
        "transition-all duration-300 hover:shadow-lg hover:border-gray-200",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <TrendingUp
              className={cn(
                "h-3.5 w-3.5",
                isPositiveTrend ? "text-emerald-500" : "text-red-500",
                !isPositiveTrend && "rotate-180"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                isPositiveTrend ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isPositiveTrend ? "+" : ""}
              {trend}%
            </span>
            <span className="text-xs text-gray-400">vs last week</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignDashboard({
  campaign,
  stats,
  children,
  leftContent,
  rightContent,
  onOpenSettings,
  isLoading = false,
}: CampaignDashboardProps) {
  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.Draft;

  // Default stats
  const displayStats: CampaignStats = stats || {
    totalLeads: campaign._count?.leads || 0,
    qualifiedLeads: Math.floor((campaign._count?.leads || 0) * 0.3),
    contactedLeads: Math.floor((campaign._count?.leads || 0) * 0.6),
    bookings: Math.floor((campaign._count?.leads || 0) * 0.1),
    conversionRate: campaign._count?.leads ? 30 : 0,
  };

  const formattedDate = campaign.startDate
    ? new Date(campaign.startDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not set";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            {/* Back & Title */}
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/campaigns">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Back to campaigns</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-3">
                {/* Campaign icon */}
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-primary-500 to-primary-600",
                    "shadow-lg shadow-primary-500/25"
                  )}
                >
                  <Target className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">
                      {campaign.name}
                    </h1>
                    <Badge
                      className={cn(
                        "font-medium px-2 py-0.5 rounded-md border",
                        statusConfig.bgColor,
                        statusConfig.textColor,
                        statusConfig.borderColor
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full mr-1.5",
                          statusConfig.color
                        )}
                      />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {campaign.account?.companyName}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Started {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl"
                      onClick={onOpenSettings}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Campaign settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuItem className="rounded-lg">
                    Edit campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg">
                    Export data
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg">
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg text-destructive-500">
                    Delete campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPICard
            icon={Users}
            label="Total Leads"
            value={displayStats.totalLeads}
            color="bg-blue-500"
            index={0}
          />
          <KPICard
            icon={Target}
            label="Qualified"
            value={displayStats.qualifiedLeads}
            subtitle={`${displayStats.totalLeads > 0 ? Math.round((displayStats.qualifiedLeads / displayStats.totalLeads) * 100) : 0}% of total`}
            color="bg-emerald-500"
            trend={12}
            index={1}
          />
          <KPICard
            icon={Calendar}
            label="Bookings"
            value={displayStats.bookings}
            subtitle="Scheduled meetings"
            color="bg-violet-500"
            trend={8}
            index={2}
          />
          <KPICard
            icon={TrendingUp}
            label="Conversion"
            value={`${displayStats.conversionRate}%`}
            subtitle="Lead to meeting"
            color="bg-amber-500"
            trend={-3}
            index={3}
          />
        </div>

        {/* Two Column Layout */}
        {children ? (
          children
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (60%) - Main content */}
            <div className="lg:col-span-3 space-y-6">{leftContent}</div>

            {/* Right Column (40%) - Widgets */}
            <div className="lg:col-span-2 space-y-6">{rightContent}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard section wrapper
export function DashboardSection({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Dashboard skeleton
export function CampaignDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-gray-100 bg-white animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-11 w-11 rounded-xl bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

