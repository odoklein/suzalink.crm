"use client";

import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, eachHourOfInterval, startOfDay, endOfDay, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Video, Clock } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";

type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingType?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  onlineMeetingEmail?: string;
  contactName?: string;
  status: string;
  user: { email: string };
  lead?: { standardData: any; campaign?: { id: string; name: string } };
};

type CampaignBookingsAgendaProps = {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  accountId?: string;
};

export function CampaignBookingsAgenda({ bookings, onBookingClick, accountId }: CampaignBookingsAgendaProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get account contacts for drop zones
  const { data: accountData } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!accountId,
  });

  const contacts = accountData?.interlocuteurs || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get week start (Monday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Time slots (8am to 8pm, 30min intervals)
  const timeSlots = useMemo(() => {
    const start = startOfDay(weekStart);
    const end = endOfDay(weekStart);
    const hours = eachHourOfInterval({ start, end });
    const slots: Date[] = [];
    hours.forEach((hour) => {
      if (hour.getHours() >= 8 && hour.getHours() < 20) {
        slots.push(hour);
        slots.push(new Date(hour.getTime() + 30 * 60 * 1000));
      }
    });
    return slots;
  }, [weekStart]);

  // Group bookings by day and time
  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = bookings.filter((booking) => {
        const bookingDate = parseISO(booking.startTime);
        return isSameDay(bookingDate, day);
      });
    });
    return grouped;
  }, [bookings, weekDays]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Extract contact ID from drop zone
    const contactId = over.id.toString().replace("contact-", "");
    const bookingId = active.id.toString().replace("booking-", "");

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !contactId) return;

    // Open placement dialog
    onBookingClick(booking);
  };

  const getBookingPosition = (booking: Booking) => {
    const start = parseISO(booking.startTime);
    const end = parseISO(booking.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;

    // Calculate position (each hour = 60px, starting from 8am)
    const top = ((startMinutes - 8 * 60) / 30) * 30; // 30px per 30min slot
    const height = (duration / 30) * 30;

    return { top, height };
  };

  const activeBooking = activeId ? bookings.find((b) => `booking-${b.id}` === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
            className="px-3 py-1 border rounded hover:bg-muted"
          >
            ←
          </button>
          <span className="font-semibold">
            {format(weekStart, "d MMM", { locale: fr })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
            className="px-3 py-1 border rounded hover:bg-muted"
          >
            →
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1 text-sm border rounded hover:bg-muted"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 border-b bg-muted/50" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
            <div className="p-2 font-medium text-sm border-r">Heure</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-2 text-center border-r last:border-r-0">
                <div className="font-medium text-sm">{format(day, "EEE", { locale: fr })}</div>
                <div className="text-xs text-muted-foreground">{format(day, "d MMM", { locale: fr })}</div>
              </div>
            ))}
          </div>

          <div className="relative" style={{ minHeight: "600px" }}>
            {/* Time grid */}
            <div className="grid grid-cols-8 border-b" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = 8 + Math.floor(i / 2);
                const minutes = i % 2 === 0 ? 0 : 30;
                return (
                  <div key={i} className="contents">
                    <div className="p-1 text-xs text-muted-foreground border-r border-b" style={{ height: "30px" }}>
                      {i % 2 === 0 && `${hour.toString().padStart(2, "0")}:00`}
                    </div>
                    {weekDays.map((day, dayIdx) => (
                      <div
                        key={`${day.toISOString()}-${i}`}
                        className="border-r border-b last:border-r-0"
                        style={{ height: "30px" }}
                        id={`slot-${format(day, "yyyy-MM-dd")}-${hour}-${minutes}`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Bookings */}
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDay[dayKey] || [];
              return (
                <div key={dayKey} className="absolute inset-0 pointer-events-none">
                  <div className="relative" style={{ gridColumn: `day-${dayKey}` }}>
                    {dayBookings.map((booking) => {
                      const { top, height } = getBookingPosition(booking);
                      return (
                        <div
                          key={booking.id}
                          id={`booking-${booking.id}`}
                          className="absolute left-0 right-0 mx-1 pointer-events-auto cursor-move"
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 40)}px`,
                          }}
                          onClick={() => onBookingClick(booking)}
                        >
                          <Card className="h-full p-2 hover:shadow-md transition-shadow bg-primary-50 border-primary-200">
                            <CardContent className="p-0">
                              <div className="flex items-start gap-1">
                                {booking.meetingType === "PHYSICAL" ? (
                                  <MapPin className="h-3 w-3 text-primary-600 flex-shrink-0 mt-0.5" />
                                ) : booking.meetingType === "ONLINE" ? (
                                  <Video className="h-3 w-3 text-primary-600 flex-shrink-0 mt-0.5" />
                                ) : null}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-xs truncate">{booking.title}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {format(parseISO(booking.startTime), "HH:mm", { locale: fr })} -{" "}
                                    {format(parseISO(booking.endTime), "HH:mm", { locale: fr })}
                                  </div>
                                  {booking.contactName && (
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {booking.contactName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Contact drop zones - one per day column */}
            {contacts.map((contact: any) =>
              weekDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayIndex = weekDays.indexOf(day);
                return (
                  <div
                    key={`contact-${contact.id}-${dayKey}`}
                    id={`contact-${contact.id}`}
                    data-day-index={dayIndex}
                    className="absolute border-2 border-dashed border-transparent hover:border-primary-300 rounded transition-opacity pointer-events-auto"
                    style={{
                      left: `${120 + (dayIndex * (100 / 7))}%`,
                      width: `${100 / 7}%`,
                      top: 0,
                      bottom: 0,
                      zIndex: 1000,
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  >
                    <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
                      {contact.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DragOverlay>
          {activeBooking ? (
            <Card className="w-48 p-2 bg-white shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-1">
                  {activeBooking.meetingType === "PHYSICAL" ? (
                    <MapPin className="h-3 w-3 text-primary-600" />
                  ) : activeBooking.meetingType === "ONLINE" ? (
                    <Video className="h-3 w-3 text-primary-600" />
                  ) : null}
                  <div className="flex-1">
                    <div className="font-medium text-xs">{activeBooking.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(parseISO(activeBooking.startTime), "HH:mm", { locale: fr })} -{" "}
                      {format(parseISO(activeBooking.endTime), "HH:mm", { locale: fr })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">💡 Glissez-déposez un rendez-vous sur une colonne de contact pour le placer dans son agenda</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-500" />
            <span>Rendez-vous physique</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary-500" />
            <span>Rendez-vous en ligne</span>
          </div>
        </div>
      </div>
    </div>
  );
}

