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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, AlertCircle, CheckCircle2, Video, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  contactName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  meetingType?: string;
  onlineMeetingEmail?: string;
  lead?: { standardData: any; campaign?: { id: string; name: string; account?: { id: string } } };
};

type BookingPlacementDialogProps = {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
};

export function BookingPlacementDialog({
  booking,
  open,
  onOpenChange,
  accountId,
}: BookingPlacementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  // Get account contacts
  const accountIdToUse = accountId || booking.lead?.campaign?.account?.id;
  const { data: accountData } = useQuery({
    queryKey: ["account", accountIdToUse],
    queryFn: async () => {
      if (!accountIdToUse) return null;
      const res = await fetch(`/api/accounts/${accountIdToUse}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!accountIdToUse,
  });

  const contacts = accountData?.interlocuteurs || [];

  // Get contact calendars when a contact is selected
  const { data: contactCalendars } = useQuery({
    queryKey: ["contact-calendars", selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return [];
      const res = await fetch(`/api/contacts/${selectedContactId}/calendar`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedContactId,
  });

  const placementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContactId) throw new Error("Contact non sélectionné");

      // Create ContactBooking
      const res = await fetch("/api/contact-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          title: booking.title,
          description: `RDV depuis campagne: ${booking.lead?.campaign?.name || ""}`,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: "confirmed",
          notes: `Placé depuis RDV ${booking.id}`,
          meetingLink: booking.onlineMeetingEmail || null,
          location: booking.address || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create contact booking");
      }
      const contactBooking = await res.json();

      // Sync to external calendar if integration exists
      if (selectedCalendarId && contactCalendars?.length > 0) {
        const calendar = contactCalendars.find((c: any) => c.id === selectedCalendarId);
        if (calendar) {
          // TODO: Implement calendar sync
          // await syncToExternalCalendar(calendar, contactBooking);
        }
      }

      // Update booking status to 'placed'
      const updateRes = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "placed",
          metadata: {
            contactBookingId: contactBooking.id,
            contactId: selectedContactId,
          },
        }),
      });
      if (!updateRes.ok) throw new Error("Failed to update booking");

      return contactBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["account", accountIdToUse] });
      toast({
        title: "RDV placé",
        description: "Le rendez-vous a été ajouté à l'agenda du contact",
      });
      onOpenChange(false);
      setSelectedContactId(null);
      setSelectedCalendarId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de placer le rendez-vous",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Placer le rendez-vous dans l'agenda du contact</DialogTitle>
          <DialogDescription>
            Sélectionnez le contact et son calendrier pour placer ce rendez-vous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  {booking.meetingType === "PHYSICAL" ? (
                    <MapPin className="h-4 w-4 text-primary-500" />
                  ) : booking.meetingType === "ONLINE" ? (
                    <Video className="h-4 w-4 text-primary-500" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  {booking.contactName || booking.title}
                </div>
                {booking.meetingType === "PHYSICAL" && booking.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {booking.address}, {booking.city} {booking.postalCode && `(${booking.postalCode})`}
                  </div>
                )}
                {booking.meetingType === "ONLINE" && booking.onlineMeetingEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-3 w-3" />
                    Email: {booking.onlineMeetingEmail}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Date: {format(new Date(booking.startTime), "PPp", { locale: fr })} - {format(new Date(booking.endTime), "HH:mm", { locale: fr })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact selection */}
          <div className="space-y-2">
            <Label>Contact *</Label>
            <Select value={selectedContactId || ""} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Aucun contact disponible
                  </SelectItem>
                ) : (
                  contacts.map((contact: any) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {contact.name}
                        {contact.email && (
                          <span className="text-xs text-muted-foreground">({contact.email})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar selection (if contact has calendars) */}
          {selectedContactId && contactCalendars && contactCalendars.length > 0 && (
            <div className="space-y-2">
              <Label>Calendrier</Label>
              <Select value={selectedCalendarId || ""} onValueChange={setSelectedCalendarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un calendrier (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (calendrier interne uniquement)</SelectItem>
                  {contactCalendars.map((calendar: any) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.provider} - {calendar.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => placementMutation.mutate()}
              disabled={!selectedContactId || placementMutation.isPending}
            >
              {placementMutation.isPending ? "Placement..." : "Confirmer le placement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
