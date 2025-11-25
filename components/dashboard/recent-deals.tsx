"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ExternalLink, Users, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Deal {
  id: string;
  name: string;
  company: string;
  campaign: string;
  status: string;
  createdAt: string;
}

interface RecentDealsProps {
  deals: Deal[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Qualified":
    case "Qualifié":
      return "bg-success-100 text-success-text border-success-500";
    case "Contacted":
    case "Contacté":
      return "bg-info-light text-info-500 border-info-500";
    case "Nurture":
    case "Nourri":
      return "bg-warning-100 text-warning-500 border-warning-500";
    case "Lost":
    case "Perdu":
      return "bg-danger-100 text-danger-text border-danger-500";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    "Qualified": "Qualifié",
    "Contacted": "Contacté",
    "Nurture": "Nourri",
    "Lost": "Perdu",
  };
  return statusMap[status] || status;
};

export function RecentDeals({ deals }: RecentDealsProps) {
  if (deals.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-text-main flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            Leads récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            illustration="/illustrations/empty-deals.svg"
            title="Aucun lead récent"
            description="Les leads que vous traitez apparaîtront ici."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-text-main flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          Leads récents
        </CardTitle>
        <Link 
          href="/leads/workspace" 
          className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors font-medium"
        >
          Tout voir
          <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {deals.map((deal) => (
            <Link 
              key={deal.id} 
              href={`/leads/${deal.id}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent transition-all duration-150 group border border-transparent hover:border-primary-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text-main truncate group-hover:text-primary-600 transition-colors">
                    {deal.name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(deal.status)}`}
                  >
                    {translateStatus(deal.status)}
                  </Badge>
                </div>
                <p className="text-xs text-text-body truncate">
                  {deal.company}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <p className="text-xs text-text-body">
                  {formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true })}
                </p>
                <ArrowRight className="h-4 w-4 text-text-body opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
