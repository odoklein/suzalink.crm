"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  PhoneCall,
  Mail,
  MessageSquare,
  CheckCircle,
  FileText,
  Clock,
} from "lucide-react";

type Activity = {
  id: string;
  type: string;
  createdAt: string;
  metadata: any;
  user?: {
    email: string;
  };
};

type LeadActivityTimelineDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  leadName: string;
};

export function LeadActivityTimelineDrawer({
  open,
  onOpenChange,
  activities,
  leadName,
}: LeadActivityTimelineDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Activity Timeline
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Complete history of interactions with {leadName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-text-body mb-3 opacity-50" />
                <p className="text-body text-text-body">No activities yet</p>
                <p className="text-sm text-text-body mt-1">
                  Start by making a call or sending an email
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />

              <div className="space-y-6">
                {activities.map((activity) => {
                  const activityIcon = {
                    CALL: <PhoneCall className="h-4 w-4" />,
                    EMAIL: <Mail className="h-4 w-4" />,
                    NOTE: <MessageSquare className="h-4 w-4" />,
                    STATUS_CHANGE: <CheckCircle className="h-4 w-4" />,
                  }[activity.type] || <FileText className="h-4 w-4" />;

                  const activityColor = {
                    CALL: "bg-blue-500",
                    EMAIL: "bg-green-500",
                    NOTE: "bg-yellow-500",
                    STATUS_CHANGE: "bg-purple-500",
                  }[activity.type] || "bg-gray-500";

                  return (
                    <div key={activity.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-0 top-1 w-8 h-8 rounded-full ${activityColor} flex items-center justify-center text-white shadow-md z-10`}
                      >
                        {activityIcon}
                      </div>

                      <Card className="border border-border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-text-main capitalize">
                                {activity.type.replace("_", " ")}
                              </p>
                              <p className="text-xs text-text-body">
                                by {activity.user?.email || "System"}
                              </p>
                            </div>
                            <p className="text-xs text-text-body flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {activity.metadata?.note && (
                            <p className="text-body text-text-main mt-2 bg-background p-3 rounded-md">
                              {activity.metadata.note}
                            </p>
                          )}

                          {activity.metadata?.outcome && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                {activity.metadata.outcome}
                              </span>
                            </div>
                          )}

                          {activity.metadata?.oldStatus &&
                            activity.metadata?.newStatus && (
                              <p className="text-sm text-text-body mt-2">
                                Status changed from{" "}
                                <span className="font-medium">
                                  {activity.metadata.oldStatus}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-primary-500">
                                  {activity.metadata.newStatus}
                                </span>
                              </p>
                            )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

