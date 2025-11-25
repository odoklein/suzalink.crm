"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldValueDisplay } from "@/components/ui/field-value-display";

type Lead = {
  id: string;
  status: string;
  standardData: any;
  customData: any;
  lockedAt: string | null;
  lockedByUser: {
    id: string;
    email: string;
  } | null;
  assignedBD: {
    id: string;
    email: string;
  } | null;
};

type LeadTableProps = {
  campaignId: string;
  schemaConfig?: any[];
};

export function LeadTable({ campaignId, schemaConfig = [] }: LeadTableProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["leads", campaignId, page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        campaignId,
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const leads: Lead[] = data?.leads || [];
  const pagination = data?.pagination || { total: 0, totalPages: 0 };

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
    return <div className="text-center py-12">Loading leads...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Locked">Locked</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Nurture">Nurture</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Phone
                </th>
                {schemaConfig.map((field) => (
                  <th
                    key={field.key}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7 + schemaConfig.length} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {lead.standardData?.firstName} {lead.standardData?.lastName}
                    </td>
                    <td className="px-4 py-3">{lead.standardData?.email || "-"}</td>
                    <td className="px-4 py-3">{lead.standardData?.phone || "-"}</td>
                    {schemaConfig.map((field) => (
                      <td key={field.key} className="px-4 py-3">
                        <FieldValueDisplay field={field} value={lead.customData?.[field.key]} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.assignedBD?.email?.split("@")[0] || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/leads/${lead.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {lead.standardData?.phone && (
                          <Button variant="ghost" size="icon">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {lead.standardData?.email && (
                          <Button variant="ghost" size="icon">
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of{" "}
            {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

