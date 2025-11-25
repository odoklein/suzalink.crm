"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarCheck,
  Clock,
  MapPin,
  Link2,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Video,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  meetingLink?: string;
  location?: string;
  user: {
    email: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function BookingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const { data: bookingsData, isLoading } = useQuery<{
    upcoming: Booking[];
    past: Booking[];
  }>({
    queryKey: ["contact-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/contact-portal/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-bookings"] });
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      toast({
        title: "Rendez-vous annulé",
        description: "Le rendez-vous a été annulé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler le rendez-vous",
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/contact-portal/bookings/${bookingId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to confirm booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-bookings"] });
      toast({
        title: "Rendez-vous confirmé",
        description: "Le rendez-vous a été confirmé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer le rendez-vous",
        variant: "destructive",
      });
    },
  });

  const upcomingBookings = bookingsData?.upcoming || [];
  const pastBookings = bookingsData?.past || [];

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Confirmé</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-0">En attente</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-700 border-0">Annulé</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-700 border-0">Terminé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const BookingCard = ({ booking, isPast = false }: { booking: Booking; isPast?: boolean }) => {
    const { date, time } = formatDateTime(booking.startTime);
    const duration = formatDuration(booking.startTime, booking.endTime);

    return (
      <Card className={cn(
        "transition-all hover:shadow-md",
        isPast && "opacity-75"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0",
              booking.status === "cancelled" ? "bg-rose-100" :
              booking.status === "confirmed" ? "bg-emerald-100" :
              "bg-primary-100"
            )}>
              <CalendarCheck className={cn(
                "h-7 w-7",
                booking.status === "cancelled" ? "text-rose-600" :
                booking.status === "confirmed" ? "text-emerald-600" :
                "text-primary-600"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{booking.title}</h3>
                  <p className="text-sm text-slate-500 capitalize">{date}</p>
                </div>
                {getStatusBadge(booking.status)}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{time} ({duration})</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{booking.user.email}</span>
                </div>
                
                {booking.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{booking.location}</span>
                  </div>
                )}
              </div>
              
              {booking.description && (
                <p className="text-sm text-slate-600 mb-3">
                  {booking.description}
                </p>
              )}
              
              {booking.meetingLink && (
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Video className="h-4 w-4" />
                  Rejoindre la réunion
                </a>
              )}
              
              {!isPast && booking.status !== "cancelled" && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  {booking.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => confirmMutation.mutate(booking.id)}
                      disabled={confirmMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {confirmMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Confirmer
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBookingToCancel(booking.id);
                      setCancelDialogOpen(true);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes rendez-vous</h1>
        <p className="text-slate-500 mt-1">
          Consultez et gérez vos rendez-vous
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger 
            value="upcoming" 
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            À venir
            {upcomingBookings.length > 0 && (
              <Badge className="ml-2 bg-primary-100 text-primary-700 border-0">
                {upcomingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="past"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Passés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Aucun rendez-vous à venir
                  </h3>
                  <p className="text-sm text-slate-500">
                    Vos prochains rendez-vous apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Aucun rendez-vous passé
                  </h3>
                  <p className="text-sm text-slate-500">
                    L'historique de vos rendez-vous apparaîtra ici
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isPast />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre interlocuteur sera notifié de l'annulation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToCancel && cancelMutation.mutate(bookingToCancel)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Annuler le rendez-vous
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


