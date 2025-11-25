"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CompactLeadsListProps = {
  campaignId: string;
  currentLeadId?: string;
  onLeadSelect?: (leadId: string) => void;
};

export function CompactLeadsList({
  campaignId,
  currentLeadId,
  onLeadSelect,
}: CompactLeadsListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["leads", campaignId, "compact"],
    queryFn: async () => {
      const params = new URLSearchParams({
        campaignId,
        page: "1",
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const leads = data?.leads || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-info-light text-info-500";
      case "Locked":
        return "bg-warning-100 text-warning-500";
      case "Contacted":
        return "bg-primary-100 text-primary-500";
      case "Qualified":
        return "bg-success-100 text-success-text";
      case "Nurture":
        return "bg-muted text-muted-foreground";
      case "Lost":
        return "bg-destructive-100 text-destructive-text";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-text-main flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recent Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-text-main flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recent Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-body text-center py-4">
            No leads yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-text-main flex items-center gap-2">
          <Users className="h-4 w-4" />
          Recent Leads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {leads.map((lead: any) => {
            const isActive = lead.id === currentLeadId;
            const standardData = lead.standardData || {};
            const name = `${standardData.firstName || ""} ${standardData.lastName || ""}`.trim() || "Unknown";

            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                onClick={(e) => {
                  if (onLeadSelect) {
                    e.preventDefault();
                    onLeadSelect(lead.id);
                  }
                }}
                className={cn(
                  "block px-3 py-2.5 hover:bg-surface transition-colors border-l-2",
                  isActive
                    ? "bg-primary-50 border-l-primary-500"
                    : "border-l-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-primary-700" : "text-text-main"
                      )}
                    >
                      {name}
                    </p>
                    {standardData.email && (
                      <p className="text-xs text-text-body truncate mt-0.5">
                        {standardData.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-1.5 py-0",
                        getStatusColor(lead.status)
                      )}
                    >
                      {lead.status}
                    </Badge>
                    <ChevronRight className="h-3 w-3 text-text-body" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

