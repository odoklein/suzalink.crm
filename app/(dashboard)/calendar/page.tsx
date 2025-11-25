"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingDetailsDrawer } from "@/components/calendar/meeting-details-drawer";
import { MeetingScheduleDrawer } from "@/components/calendar/meeting-schedule-drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("week");
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get start and end of current view
  const getViewRange = () => {
    if (view === "month") {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    } else {
      const day = currentDate.getDay();
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
  };

  const { start, end } = getViewRange();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/bookings?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const { data: integration } = useQuery({
    queryKey: ["calendar-integration"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/google/auth");
      if (!res.ok) return null;
      return res.json();
    },
  });


  const navigatePrevious = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateHeader = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
  };

  const getDaysInView = () => {
    const days: Date[] = [];
    if (view === "month") {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startDay = firstDay.getDay();
      
      // Add previous month days
      for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(firstDay);
        day.setDate(day.getDate() - i - 1);
        days.push(day);
      }
      
      // Add current month days
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      }
      
      // Add next month days to complete grid
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        const day = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
        days.push(day);
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
    }
    return days;
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return (
        bookingDate.getDate() === day.getDate() &&
        bookingDate.getMonth() === day.getMonth() &&
        bookingDate.getFullYear() === day.getFullYear()
      );
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setScheduleDrawerOpen(true);
  };

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Calendrier</h1>
          <p className="text-body text-text-body mt-2">Gérez vos réunions et votre planning</p>
        </div>
        <div className="flex items-center gap-2">
          {integration?.authUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={integration.authUrl}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connecter Google Calendar
              </a>
            </Button>
          )}
          <Button onClick={() => setScheduleDrawerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réunion
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-h2 font-semibold text-text-main min-w-[250px] text-center">
                {formatDateHeader()}
              </h2>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                Semaine
              </Button>
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                Mois
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-text-body">Chargement du calendrier...</div>
          ) : (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-text-body py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInView().map((day, index) => {
                  const dayBookings = getBookingsForDay(day);
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-[100px] p-2 border border-border rounded-lg cursor-pointer hover:bg-surface transition-colors ${
                        isToday ? "border-primary-500 bg-primary-50" : ""
                      } ${!isCurrentMonth && view === "month" ? "opacity-40" : ""}`}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isToday ? "text-primary-500" : "text-text-main"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                              statusColors[booking.status] || "bg-gray-100"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingClick(booking.id);
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(booking.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="font-medium truncate">{booking.title}</div>
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-text-body">
                            +{dayBookings.length - 3} de plus
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming meetings list */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Réunions à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-text-body mb-3 opacity-50" />
              <p className="text-body text-text-body">Aucune réunion planifiée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex items-start gap-4 p-3 border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
                  onClick={() => handleBookingClick(booking.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text-main">{booking.title}</h4>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-body space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(booking.startTime).toLocaleString()}
                      </div>
                      {booking.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {booking.location}
                        </div>
                      )}
                      {booking.lead && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {booking.lead.standardData?.firstName} {booking.lead.standardData?.lastName}
                          {booking.lead.campaign && (
                            <span className="text-xs">({booking.lead.campaign.name})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MeetingScheduleDrawer
        open={scheduleDrawerOpen}
        onOpenChange={setScheduleDrawerOpen}
        defaultDate={selectedDate || undefined}
      />

      <MeetingDetailsDrawer
        open={!!selectedBookingId}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
        bookingId={selectedBookingId}
      />
    </div>
  );
}



