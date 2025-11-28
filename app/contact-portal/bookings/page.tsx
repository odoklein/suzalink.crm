"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Loader2,
  Calendar,
  FileText,
  Video,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingType {
  name: string;
  icon?: string;
  color?: string;
  isPhysical?: boolean;
}

interface Booking {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  location?: string;
  address?: string;
  city?: string;
  meetingType?: MeetingType;
  user: {
    email: string;
    avatar?: string;
  };
  lead?: {
    standardData: any;
    campaign?: {
      name: string;
    };
  };
}

interface VisitDay {
  id: string;
  date: string;
  notes?: string;
  campaign: {
    name: string;
  };
}

export default function BookingsPage() {
  const { data: bookingsData, isLoading } = useQuery<{
    upcoming: Booking[];
    past: Booking[];
    visitDays: VisitDay[];
    account?: { companyName: string };
  }>({
    queryKey: ["contact-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const upcomingBookings = bookingsData?.upcoming || [];
  const pastBookings = bookingsData?.past || [];
  const visitDays = bookingsData?.visitDays || [];

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 border-0">Planifié</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-700 border-0">Annulé</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-700 border-0">Terminé</Badge>;
      case "no_show":
        return <Badge className="bg-amber-100 text-amber-700 border-0">Absent</Badge>;
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
                
                {(booking.location || booking.address) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{booking.address || booking.location}{booking.city && `, ${booking.city}`}</span>
                  </div>
                )}

                {booking.meetingType && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: booking.meetingType.color }}
                  >
                    {booking.meetingType.isPhysical ? (
                      <MapPin className="h-3 w-3 mr-1" />
                    ) : (
                      <Video className="h-3 w-3 mr-1" />
                    )}
                    {booking.meetingType.name}
                  </Badge>
                )}
              </div>
              
              {booking.description && (
                <p className="text-sm text-slate-600 mb-3">
                  {booking.description}
                </p>
              )}

              {booking.lead?.campaign && (
                <p className="text-xs text-slate-400">
                  Campagne: {booking.lead.campaign.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VisitDayCard = ({ visitDay }: { visitDay: VisitDay }) => {
    const formattedDate = formatDate(visitDay.date);

    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
              <CalendarDays className="h-7 w-7 text-amber-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 capitalize">{formattedDate}</h3>
                  <p className="text-sm text-slate-500">{visitDay.campaign.name}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-0">
                  Visite prévue
                </Badge>
              </div>
              
              {visitDay.notes && (
                <p className="text-sm text-slate-600">
                  {visitDay.notes}
                </p>
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
          Consultez vos rendez-vous et le calendrier des visites
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
            value="calendar"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Calendrier visites
            {visitDays.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700 border-0">
                {visitDays.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="past"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Historique
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

        <TabsContent value="calendar" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : visitDays.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">
                    Aucune visite planifiée
                  </h3>
                  <p className="text-sm text-slate-500">
                    Les jours de visite commerciale apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            visitDays.map((visitDay) => (
              <VisitDayCard key={visitDay.id} visitDay={visitDay} />
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
    </div>
  );
}
