"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Mail, MessageSquare, CheckCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/help/empty-state";

interface UserActivityTabProps {
  userId: string;
}

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["user-activities", userId, activityTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(activityTypeFilter !== "all" && { type: activityTypeFilter }),
      });
      const res = await fetch(`/api/admin/users/${userId}/activities?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "NOTE":
        return <MessageSquare className="h-4 w-4" />;
      case "STATUS_CHANGE":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "CALL":
        return "bg-[#4C85FF]";
      case "EMAIL":
        return "bg-[#3BBF7A]";
      case "NOTE":
        return "bg-[#F59E0B]";
      case "STATUS_CHANGE":
        return "bg-[#A46CFF]";
      default:
        return "bg-[#6B7280]";
    }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      CALL: "Appel",
      EMAIL: "Email",
      NOTE: "Note",
      STATUS_CHANGE: "Changement de statut",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A6BFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB] hover:shadow-sm transition-shadow duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#A46CFF]/10">
                <Calendar className="h-5 w-5 text-[#A46CFF]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[#1B1F24]">
                  Historique d'activité
                </CardTitle>
                <CardDescription className="text-sm text-[#6B7280]">
                  Toutes les activités de cet utilisateur dans le système
                </CardDescription>
              </div>
            </div>
            <div className="w-48">
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="rounded-[12px] border-[#DEE2E6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="CALL">Appels</SelectItem>
                  <SelectItem value="EMAIL">Emails</SelectItem>
                  <SelectItem value="NOTE">Notes</SelectItem>
                  <SelectItem value="STATUS_CHANGE">Changements de statut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!activities || activities.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <Calendar className="h-7 w-7 text-[#9CA3AF]" />
              </div>
              <p className="text-[15px] text-[#6B7280] font-medium">Aucune activité</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Cet utilisateur n'a pas encore d'activité enregistrée
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity: any, index: number) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[#E6E8EB] hover:border-[#DEE2E6] hover:bg-[#F8F9FA]/50 transition-all duration-200"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${getActivityColor(
                      activity.type
                    )} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-xs border-[#E6E8EB] bg-white font-medium"
                      >
                        {getActivityLabel(activity.type)}
                      </Badge>
                      <span className="text-xs text-[#9CA3AF]">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {activity.lead && (
                      <p className="text-sm text-[#1B1F24] font-medium mb-1">
                        Lead: {activity.lead.standardData?.firstName}{" "}
                        {activity.lead.standardData?.lastName}
                      </p>
                    )}
                    {activity.metadata && (
                      <div className="text-sm text-[#6B7280] space-y-0.5">
                        {activity.metadata.outcome && (
                          <p>Résultat: {activity.metadata.outcome}</p>
                        )}
                        {activity.metadata.note && (
                          <p className="line-clamp-2">Note: {activity.metadata.note}</p>
                        )}
                        {activity.metadata.duration && (
                          <p>Durée: {activity.metadata.duration} minutes</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




