"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  portalEnabled?: boolean;
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface ContactBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

const DAYS_OF_WEEK = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const FULL_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Generate time slots for a day
function generateTimeSlots(startTime: string, endTime: string, intervalMinutes = 30): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const min = currentMinutes % 60;
    slots.push(`${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    currentMinutes += intervalMinutes;
  }
  
  return slots;
}

// Get the next 14 days
function getNextTwoWeeks(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
}

export function ContactBookingDialog({
  open,
  onOpenChange,
  contact,
}: ContactBookingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<"slots" | "details">("slots");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(30);

  // Fetch contact availability
  const { data: availability = [], isLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["contact-availability", contact?.id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contact?.id}/availability`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!contact?.id && open,
  });

  // Create booking mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime || !contact) {
        throw new Error("Missing required booking details");
      }

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const res = await fetch(`/api/contacts/${contact.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          meetingLink,
          location,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-bookings", contact?.id] });
      toast({
        title: "Rendez-vous créé",
        description: "Le contact a été notifié du rendez-vous",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("slots");
    setSelectedDate(null);
    setSelectedTime(null);
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setLocation("");
    setDuration(30);
    setWeekOffset(0);
    onOpenChange(false);
  };

  if (!contact) return null;

  // Get days for current week view
  const allDays = getNextTwoWeeks();
  const displayDays = allDays.slice(weekOffset * 7, (weekOffset + 1) * 7);

  // Get availability for a specific day
  const getAvailabilityForDay = (date: Date): AvailabilitySlot[] => {
    const dayOfWeek = date.getDay();
    return availability.filter(slot => slot.dayOfWeek === dayOfWeek);
  };

  // Get time slots for selected date
  const getTimeSlotsForDate = (): string[] => {
    if (!selectedDate) return [];
    const dayAvailability = getAvailabilityForDay(selectedDate);
    
    const allSlots: string[] = [];
    for (const slot of dayAvailability) {
      allSlots.push(...generateTimeSlots(slot.startTime, slot.endTime));
    }
    
    return [...new Set(allSlots)].sort();
  };

  const timeSlots = getTimeSlotsForDate();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            Réserver un rendez-vous
          </DialogTitle>
          <DialogDescription>
            Planifier un rendez-vous avec {contact.name}
          </DialogDescription>
        </DialogHeader>

        {step === "slots" ? (
          <div className="space-y-6 py-4">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm font-medium text-slate-600">
                {displayDays[0].toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Day Selection */}
            <div className="grid grid-cols-7 gap-2">
              {displayDays.map((date) => {
                const dayAvailability = getAvailabilityForDay(date);
                const hasAvailability = dayAvailability.length > 0;
                const isSelected = selectedDate?.getTime() === date.getTime();
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <button
                    key={date.toISOString()}
                    disabled={!hasAvailability}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                        : hasAvailability
                        ? "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                        : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed",
                      isToday && "ring-1 ring-primary-200"
                    )}
                  >
                    <span className="text-xs text-slate-500 uppercase">
                      {DAYS_OF_WEEK[date.getDay()]}
                    </span>
                    <span className={cn(
                      "text-lg font-semibold",
                      isSelected ? "text-primary-700" : "text-slate-900"
                    )}>
                      {date.getDate()}
                    </span>
                    {hasAvailability && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="space-y-3">
                <Label className="text-sm text-slate-600">
                  Créneaux disponibles le {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Label>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Aucun créneau disponible ce jour
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-2 px-3 text-sm rounded-lg border transition-all",
                          selectedTime === time
                            ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                            : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Duration Selection */}
            {selectedTime && (
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Durée</Label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={cn(
                        "py-2 px-4 text-sm rounded-lg border transition-all",
                        duration === mins
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                          : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                      )}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedDate || !selectedTime}
                className="bg-gradient-to-r from-primary-500 to-primary-600"
              >
                Continuer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Selected Time Summary */}
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
              <Calendar className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-semibold text-primary-900">
                  {selectedDate?.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-sm text-primary-700">
                  {selectedTime} - {duration} minutes
                </p>
              </div>
            </div>

            {/* Booking Details Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du rendez-vous *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Point projet, Demo produit..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails du rendez-vous..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingLink" className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-slate-400" />
                    Lien visio
                  </Label>
                  <Input
                    id="meetingLink"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Lieu
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bureau, salle de réunion..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep("slots")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
              <Button
                onClick={() => bookMutation.mutate()}
                disabled={!title || bookMutation.isPending}
                className="bg-gradient-to-r from-primary-500 to-primary-600"
              >
                {bookMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmer le rendez-vous
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}




