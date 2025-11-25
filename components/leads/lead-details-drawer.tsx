"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  Calendar,
  User,
  Building2,
  ExternalLink,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { ScheduleMeetingDialog } from "@/components/bookings/schedule-meeting-dialog";

type Lead = {
  id: string;
  status: string;
  standardData: any;
  customData: any;
  campaign?: {
    id: string;
    name: string;
    schemaConfig: any;
  };
  activities?: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata: any;
    user?: {
      email: string;
    };
  }>;
};

type LeadDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
};

export function LeadDetailsDrawer({
  open,
  onOpenChange,
  leadId,
}: LeadDetailsDrawerProps) {
  const router = useRouter();

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!leadId && open,
  });

  if (!leadId) return null;

  const standardData = lead?.standardData || {};
  const customData = lead?.customData || {};
  const schemaConfig = lead?.campaign?.schemaConfig || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-20 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : lead ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                {standardData.firstName} {standardData.lastName}
              </SheetTitle>
              <SheetDescription className="text-body text-text-body mt-2">
                {lead.campaign?.name || "Détails du lead"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                {standardData.phone && (
                  <ClickToDial phoneNumber={standardData.phone} className="w-full" />
                )}
                {standardData.email && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(`/inbox/compose?leadId=${leadId}`);
                      onOpenChange(false);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer un email
                  </Button>
                )}
                <ScheduleMeetingDialog
                  leadId={leadId}
                  leadName={`${standardData.firstName} ${standardData.lastName}`}
                />
              </div>

              {/* Contact Information */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-text-body mb-1 block">
                      Email
                    </Label>
                    <p className="text-body text-text-main">
                      {standardData.email || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-body mb-1 block">
                      Téléphone
                    </Label>
                    <p className="text-body text-text-main">
                      {standardData.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-body mb-1 block">
                      Poste
                    </Label>
                    <p className="text-body text-text-main">
                      {standardData.jobTitle || "-"}
                    </p>
                  </div>
                  {standardData.company && (
                    <div>
                      <Label className="text-sm font-medium text-text-body mb-1 block">
                        Entreprise
                      </Label>
                      <p className="text-body text-text-main">
                        {standardData.company}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom Fields */}
              {schemaConfig.length > 0 && Object.keys(customData).length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-semibold text-text-main mb-4">
                      Champs personnalisés
                    </h3>
                    <div className="space-y-4">
                      {schemaConfig.map((field: any) => {
                        const value = customData[field.key];
                        if (value === null || value === undefined || value === "") return null;
                        return (
                          <div key={field.key}>
                            <Label className="text-sm font-medium text-text-body mb-1 block">
                              {field.label}
                            </Label>
                            <FieldValueDisplay field={field} value={value} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-text-main">Statut</Label>
                    <Badge variant="outline" className="text-sm">
                      {lead.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              {lead.activities && lead.activities.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-semibold text-text-main mb-4">
                      Activité récente
                    </h3>
                    <div className="space-y-3">
                      {lead.activities.slice(0, 5).map((activity: any) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="mt-0.5">
                            {activity.type === "CALL" && (
                              <Phone className="h-4 w-4 text-blue-500" />
                            )}
                            {activity.type === "EMAIL" && (
                              <Mail className="h-4 w-4 text-green-500" />
                            )}
                            {activity.type === "NOTE" && (
                              <FileText className="h-4 w-4 text-yellow-500" />
                            )}
                            {activity.type === "STATUS_CHANGE" && (
                              <Clock className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main capitalize">
                              {activity.type.replace("_", " ")}
                            </p>
                            {activity.metadata?.note && (
                              <p className="text-xs text-text-body mt-1 line-clamp-2">
                                {activity.metadata.note}
                              </p>
                            )}
                            <p className="text-xs text-text-body mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/leads/${leadId}`);
                    onOpenChange(false);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir tous les détails
                </Button>
                {lead.campaign && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push(`/campaigns/${lead.campaign?.id}`);
                      onOpenChange(false);
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Voir la campagne
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-body text-text-body">Lead introuvable</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

