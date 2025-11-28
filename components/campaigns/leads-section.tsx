"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ChevronRight,
  Phone,
  Mail,
  MoreHorizontal,
  UserPlus,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { DashboardSection } from "./campaign-dashboard";

interface Lead {
  id: string;
  standardData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    company?: string;
  };
  status?: {
    id: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LeadsSectionProps {
  campaignId: string;
  onLeadClick?: (leadId: string) => void;
  onAddLead?: () => void;
  maxItems?: number;
}

function LeadRow({
  lead,
  onClick,
  index,
}: {
  lead: Lead;
  onClick?: () => void;
  index: number;
}) {
  const { firstName, lastName, email, phone, jobTitle, company } =
    lead.standardData || {};
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Inconnu";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusColor = lead.status?.color || "#6B7280";

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-xl",
        "transition-all duration-200 cursor-pointer",
        "hover:bg-gray-50",
        "animate-in fade-in slide-in-from-left-2"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
        <AvatarFallback
          className="text-xs font-medium"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{fullName}</p>
          {lead.status && (
            <Badge
              className="text-[10px] px-1.5 py-0 font-medium rounded"
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                borderColor: `${statusColor}30`,
              }}
            >
              {lead.status.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {jobTitle && company
            ? `${jobTitle} chez ${company}`
            : jobTitle || company || email || "Aucun détail"}
        </p>
      </div>

      {/* Contact icons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {email && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${email}`;
                  }}
                >
                  <Mail className="h-4 w-4 text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{email}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {phone && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${phone}`;
                  }}
                >
                  <Phone className="h-4 w-4 text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{phone}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}

function LeadRowSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 animate-pulse"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function LeadsSection({
  campaignId,
  onLeadClick,
  onAddLead,
  maxItems = 10,
}: LeadsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["campaign-leads-preview", campaignId],
    queryFn: async () => {
      const res = await fetch(
        `/api/leads?campaignId=${campaignId}&limit=${maxItems * 2}&sortBy=updatedAt&sortOrder=desc`
      );
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  // Fetch statuses for filter
  const { data: statuses = [] } = useQuery({
    queryKey: ["campaign-statuses", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const leads: Lead[] = leadsData?.leads || [];
  const totalCount = leadsData?.total || 0;

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (statusFilter) {
      result = result.filter((l) => l.status?.id === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const { firstName, lastName, email, company } = l.standardData || {};
        return (
          firstName?.toLowerCase().includes(query) ||
          lastName?.toLowerCase().includes(query) ||
          email?.toLowerCase().includes(query) ||
          company?.toLowerCase().includes(query)
        );
      });
    }

    return result.slice(0, maxItems);
  }, [leads, statusFilter, searchQuery, maxItems]);

  const remainingCount = Math.max(0, totalCount - maxItems);

  return (
    <DashboardSection
      title="Leads"
      subtitle={`${totalCount} leads au total`}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={onAddLead}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Ajouter un lead
          </Button>
        </div>
      }
    >
      {/* Search & Quick Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-lg text-sm"
          />
        </div>

        {/* Status quick filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              statusFilter === null
                ? "bg-primary-100 text-primary-700"
                : "text-gray-500 hover:bg-gray-100"
            )}
          >
            Tous
          </button>
          {statuses.slice(0, 3).map((status: any) => (
            <button
              key={status.id}
              onClick={() =>
                setStatusFilter(statusFilter === status.id ? null : status.id)
              }
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                statusFilter === status.id
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-1 -mx-1">
        {isLoading ? (
          [...Array(5)].map((_, i) => <LeadRowSkeleton key={i} index={i} />)
        ) : filteredLeads.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter
                ? "Aucun lead ne correspond à vos filtres"
                : "Aucun lead pour le moment"}
            </p>
            {!searchQuery && !statusFilter && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAddLead}
              >
                Ajouter votre premier lead
              </Button>
            )}
          </div>
        ) : (
          <>
            {filteredLeads.map((lead, index) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                index={index}
                onClick={() => onLeadClick?.(lead.id)}
              />
            ))}

            {/* View all link */}
            {remainingCount > 0 && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full h-9 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  Voir tous les {totalCount} leads
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardSection>
  );
}

