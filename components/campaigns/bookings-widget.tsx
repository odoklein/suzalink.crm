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
import { format, isToday, isTomorrow, differenceInMinutes, isValid } from "date-fns";
import { fr } from "date-fns/locale";

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
  if (!dateStr) return "Date inconnue";
  const date = new Date(dateStr);
  if (!isValid(date)) return "Date invalide";
  
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  return format(date, "EEEE d MMMM", { locale: fr });
}

function getTimeUntil(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  const dateTime = new Date(`${dateStr}T${timeStr}`);
  if (!isValid(dateTime)) return null;
  
  const now = new Date();
  const minutes = differenceInMinutes(dateTime, now);

  if (minutes < 0) return null;
  if (minutes < 60) return `Dans ${minutes}m`;
  if (minutes < 1440) return `Dans ${Math.floor(minutes / 60)}h`;
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
          ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card hover:bg-accent/50 hover:border-accent",
        "animate-in fade-in slide-in-from-right-2"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Lead avatar */}
        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm text-foreground truncate">{leadName}</p>
            {isUpcoming && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                {timeUntil}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {booking.lead?.standardData?.company || booking.title || booking.type}
          </p>
        </div>

        {/* Time & type */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            {booking.startTime?.slice(0, 5)}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isUpcoming ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <TypeIcon className="h-3.5 w-3.5" />
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
      title="Prochains Rendez-vous"
      subtitle={`${bookings.length} planifiés`}
      action={
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs"
          onClick={onAddBooking}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Planifier
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
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Aucun rendez-vous à venir</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onAddBooking}
          >
            Planifier un rendez-vous
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBookings).map(([date, dateBookings]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1 capitalize">{date}</p>
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
              className="w-full h-8 text-sm text-primary hover:text-primary hover:bg-primary/10"
              onClick={onViewAll}
            >
              Voir tous les rendez-vous
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
        </div>
      )}
    </DashboardSection>
  );
}

