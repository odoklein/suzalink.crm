"use client";

import { Eye, Phone, Mail, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  status: string;
  standardData: any;
  customData: any;
  assignedBD: {
    id: string;
    email: string;
    avatar?: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
};

interface LeadCardViewProps {
  leads: Lead[];
  schemaConfig: any[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  getStatusColor: (status: string) => string;
  statusOptions: string[];
}

export function LeadCardView({
  leads,
  schemaConfig,
  selectedIds,
  onSelect,
  onSelectAll,
  getStatusColor,
  statusOptions,
}: LeadCardViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Success", description: "Status updated" });
    },
  });

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No leads found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => {
        const standardData = lead.standardData || {};
        const isSelected = selectedIds.includes(lead.id);

        return (
          <Card
            key={lead.id}
            className={`cursor-pointer transition-all hover:shadow-float ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelect(lead.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-main">
                    {standardData.firstName} {standardData.lastName}
                  </h3>
                  <p className="text-sm text-text-body mt-1">
                    {standardData.email || standardData.phone || "No contact"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/leads/${lead.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {standardData.phone && (
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </DropdownMenuItem>
                    )}
                    {standardData.email && (
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Select
                    value={lead.status}
                    onValueChange={(value) => {
                      updateStatusMutation.mutate({ leadId: lead.id, status: value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectTrigger className="h-7 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {lead.assignedBD && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Assigned</span>
                    <span className="text-xs text-text-main">
                      {lead.assignedBD.email.split("@")[0]}
                    </span>
                  </div>
                )}

                {schemaConfig.slice(0, 2).map((field) => {
                  const value = lead.customData?.[field.key];
                  if (!value) return null;
                  return (
                    <div key={field.key} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                      <div className="text-xs">
                        <FieldValueDisplay field={field} value={value} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                {standardData.phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${standardData.phone}`;
                    }}
                  >
                    <Phone className="mr-2 h-3 w-3" />
                    Call
                  </Button>
                )}
                {standardData.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${standardData.email}`;
                    }}
                  >
                    <Mail className="mr-2 h-3 w-3" />
                    Email
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/leads/${lead.id}`}>
                    <Eye className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

