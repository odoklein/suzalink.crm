"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Settings,
  MoreHorizontal,
  UserPlus,
  Calendar,
  Download,
  Trash2,
  Edit,
  Share2,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingAction {
  id: string;
  label: string;
  icon: typeof Plus;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}

interface FloatingActionBarProps {
  campaignId?: string;
  primaryActions?: FloatingAction[];
  secondaryActions?: FloatingAction[];
  onAddLead?: () => void;
  onImportCSV?: () => void;
  onAddBooking?: () => void;
  onOpenSettings?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function FloatingActionBar({
  campaignId,
  primaryActions,
  secondaryActions,
  onAddLead,
  onImportCSV,
  onAddBooking,
  onOpenSettings,
  onDelete,
  className,
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Default actions if not provided
  const defaultPrimaryActions: FloatingAction[] = [
    {
      id: "add-lead",
      label: "Ajouter un lead",
      icon: UserPlus,
      onClick: onAddLead,
      variant: "primary",
    },
    {
      id: "import-csv",
      label: "Importer CSV",
      icon: Upload,
      href: campaignId ? `/campaigns/${campaignId}/import` : undefined,
      onClick: onImportCSV,
    },
    {
      id: "add-booking",
      label: "Planifier RDV",
      icon: Calendar,
      onClick: onAddBooking,
    },
  ];

  const defaultSecondaryActions: FloatingAction[] = [
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      onClick: onOpenSettings,
    },
    {
      id: "export",
      label: "Exporter les données",
      icon: Download,
    },
    {
      id: "delete",
      label: "Supprimer la campagne",
      icon: Trash2,
      onClick: onDelete,
      variant: "danger",
    },
  ];

  const actions = primaryActions || defaultPrimaryActions;
  const moreActions = secondaryActions || defaultSecondaryActions;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "animate-in slide-in-from-bottom-4 fade-in duration-500",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-2xl",
          "bg-white/95 backdrop-blur-xl",
          "border border-gray-200/50",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]",
          "transition-all duration-300"
        )}
      >
        {/* Collapse/Expand button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-600"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronUp
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    !isExpanded && "rotate-180"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isExpanded ? "Réduire" : "Développer"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Primary Actions */}
        <div
          className={cn(
            "flex items-center gap-1.5 transition-all duration-300 overflow-hidden",
            isExpanded ? "max-w-[500px] opacity-100" : "max-w-0 opacity-0"
          )}
        >
          <TooltipProvider>
            {actions.map((action, index) => {
              const Icon = action.icon;
              const isPrimary = action.variant === "primary";

              const buttonContent = (
                <Button
                  key={action.id}
                  variant={isPrimary ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 rounded-xl font-medium transition-all duration-200",
                    isPrimary
                      ? "bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    "animate-in fade-in slide-in-from-bottom-2",
                    action.disabled && "opacity-50 pointer-events-none"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {action.label}
                </Button>
              );

              if (action.href) {
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Link href={action.href}>{buttonContent}</Link>
                    </TooltipTrigger>
                    <TooltipContent side="top">{action.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="top">{action.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Divider */}
        {isExpanded && <div className="w-px h-6 bg-gray-200" />}

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Plus d'actions</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent
            align="end"
            side="top"
            className="w-48 rounded-xl p-1.5"
            sideOffset={12}
          >
            {moreActions.map((action, index) => {
              const Icon = action.icon;
              const isDanger = action.variant === "danger";

              return (
                <div key={action.id}>
                  {isDanger && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={action.onClick}
                    className={cn(
                      "rounded-lg cursor-pointer",
                      isDanger && "text-destructive-500 focus:text-destructive-500"
                    )}
                    disabled={action.disabled}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Simple version for campaigns list page
export function FloatingCreateButton({
  onClick,
  label = "Nouvelle campagne",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          "h-14 px-6 rounded-2xl font-semibold",
          "bg-primary-500 hover:bg-primary-600 text-white",
          "shadow-[0_8px_24px_rgba(76,133,255,0.35)]",
          "hover:shadow-[0_12px_32px_rgba(76,133,255,0.45)]",
          "hover:scale-105 active:scale-100",
          "transition-all duration-200"
        )}
      >
        <Plus className="h-5 w-5 mr-2" />
        {label}
      </Button>
    </div>
  );
}

