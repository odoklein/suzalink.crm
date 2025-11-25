"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Edit,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Booking = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: string;
  status: string;
  lead?: {
    id: string;
    standardData: any;
    campaign?: {
      name: string;
    };
  };
};

type MeetingDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
  onEdit?: (bookingId: string) => void;
};

export function MeetingDetailsDrawer({
  open,
  onOpenChange,
  bookingId,
  onEdit,
}: MeetingDetailsDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed to fetch booking");
      return res.json();
    },
    enabled: !!bookingId && open,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });

  if (!bookingId) return null;

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-yellow-100 text-yellow-700",
  };

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
        ) : booking ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                    {booking.title}
                  </SheetTitle>
                  <SheetDescription className="text-body text-text-body mt-2">
                    Meeting details and information
                  </SheetDescription>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[booking.status] || "bg-gray-100 text-gray-700"}
                >
                  {booking.status}
                </Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Meeting Information */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-text-body mb-1 block">
                      Date & Time
                    </Label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-text-body" />
                      <span className="text-body text-text-main">
                        {format(new Date(booking.startTime), "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-text-body" />
                      <span className="text-body text-text-main">
                        {format(new Date(booking.startTime), "p")} -{" "}
                        {format(new Date(booking.endTime), "p")}
                      </span>
                    </div>
                  </div>

                  {booking.location && (
                    <div>
                      <Label className="text-sm font-medium text-text-body mb-1 block">
                        Location
                      </Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-text-body" />
                        <span className="text-body text-text-main">
                          {booking.location}
                        </span>
                      </div>
                    </div>
                  )}

                  {booking.description && (
                    <div>
                      <Label className="text-sm font-medium text-text-body mb-1 block">
                        Description
                      </Label>
                      <p className="text-body text-text-main">
                        {booking.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-text-body mb-1 block">
                      Meeting Type
                    </Label>
                    <Badge variant="outline" className="capitalize">
                      {booking.meetingType.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Information */}
              {booking.lead && (
                <Card>
                  <CardContent className="pt-6">
                    <Label className="text-sm font-medium text-text-body mb-3 block">
                      Associated Lead
                    </Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-text-body" />
                      <div className="flex-1">
                        <p className="text-body font-medium text-text-main">
                          {booking.lead.standardData?.firstName}{" "}
                          {booking.lead.standardData?.lastName}
                        </p>
                        {booking.lead.campaign && (
                          <p className="text-sm text-text-body">
                            {booking.lead.campaign.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          router.push(`/leads/${booking.lead?.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {onEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      onEdit(booking.id);
                      onOpenChange(false);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Meeting
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this meeting?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Meeting
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
            <p className="text-body text-text-body">Meeting not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

