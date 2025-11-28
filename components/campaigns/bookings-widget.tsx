"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  ChevronRight,
  Plus,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardSection } from "./campaign-dashboard";
import { format, isToday, isTomorrow, differenceInMinutes } from "date-fns";

interface Booking {
  id: string;
  title?: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: string;
  location?: string;
  meetingUrl?: string;
  lead?: {
    id: string;
    standardData: {
      firstName?: string;
      lastName?: string;
      company?: string;
    };
  };
  user?: {
    id: string;
    email: string;
    avatar?: string;
  };
}

interface BookingsWidgetProps {
  campaignId: string;
  onAddBooking?: () => void;
  onViewAll?: () => void;
  maxItems?: number;
}

function getBookingTypeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "video":
    case "online":
    case "virtual":
      return Video;
    case "phone":
    case "call":
      return Phone;
    default:
      return MapPin;
  }
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function getTimeUntil(dateStr: string, timeStr: string): string | null {
  const dateTime = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const minutes = differenceInMinutes(dateTime, now);

  if (minutes < 0) return null;
  if (minutes < 60) return `In ${minutes}m`;
  if (minutes < 1440) return `In ${Math.floor(minutes / 60)}h`;
  return null;
}

function BookingCard({
  booking,
  index,
  onClick,
}: {
  booking: Booking;
  index: number;
  onClick?: () => void;
}) {
  const TypeIcon = getBookingTypeIcon(booking.type);
  const relativeDate = getRelativeDate(booking.date);
  const timeUntil = getTimeUntil(booking.date, booking.startTime);
  const isUpcoming = timeUntil !== null;

  const leadName = booking.lead?.standardData
    ? [
        booking.lead.standardData.firstName,
        booking.lead.standardData.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "Unknown";

  const initials = leadName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "group p-3 rounded-xl border transition-all duration-200 cursor-pointer",
        isUpcoming
          ? "border-primary-200 bg-primary-50/50 hover:bg-primary-50"
          : "border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200",
        "animate-in fade-in slide-in-from-right-2"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Lead avatar */}
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
          <AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm text-gray-900 truncate">{leadName}</p>
            {isUpcoming && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary-100 text-primary-700 border-primary-200">
                {timeUntil}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {booking.lead?.standardData?.company || booking.title || booking.type}
          </p>
        </div>

        {/* Time & type */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            {booking.startTime?.slice(0, 5)}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={cn(
                    "p-1.5 rounded-lg",
                    isUpcoming ? "bg-primary-100" : "bg-gray-100"
                  )}
                >
                  <TypeIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      isUpcoming ? "text-primary-600" : "text-gray-500"
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>{booking.type}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

function BookingSkeleton({ index }: { index: number }) {
  return (
    <div
      className="p-3 rounded-xl border border-gray-100 animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-12 bg-gray-100 rounded" />
          <div className="h-6 w-6 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function BookingsWidget({
  campaignId,
  onAddBooking,
  onViewAll,
  maxItems = 5,
}: BookingsWidgetProps) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["campaign-bookings-preview", campaignId],
    queryFn: async () => {
      const res = await fetch(
        `/api/campaigns/${campaignId}/bookings?limit=${maxItems}&upcoming=true`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.bookings || data || [];
    },
  });

  // Group by date
  const groupedBookings = bookings.reduce(
    (acc: Record<string, Booking[]>, booking: Booking) => {
      const dateKey = getRelativeDate(booking.date);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      return acc;
    },
    {}
  );

  return (
    <DashboardSection
      title="Upcoming Meetings"
      subtitle={`${bookings.length} scheduled`}
      action={
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs"
          onClick={onAddBooking}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Schedule
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <BookingSkeleton key={i} index={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-3">No upcoming meetings</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onAddBooking}
          >
            Schedule a meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBookings).map(([date, dateBookings]) => (
            <div key={date}>
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">{date}</p>
              <div className="space-y-2">
                {(dateBookings as Booking[]).map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} index={index} />
                ))}
              </div>
            </div>
          ))}

          {onViewAll && (
            <Button
              variant="ghost"
              className="w-full h-8 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50"
              onClick={onViewAll}
            >
              View all meetings
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      )}
    </DashboardSection>
  );
}

