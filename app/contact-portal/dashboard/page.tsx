"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  CalendarCheck, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  contact: {
    id: string;
    name: string;
    email: string;
    account: {
      companyName: string;
    };
  };
  stats: {
    calendarConnected: boolean;
    availabilitySlotsCount: number;
    upcomingBookingsCount: number;
    pastBookingsCount: number;
  };
  upcomingBookings: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
    user: {
      email: string;
    };
  }>;
}

export default function ContactPortalDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["contact-portal-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const upcomingBookings = data?.upcomingBookings || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2240%22%20height=%2240%22%20viewBox=%220%200%2040%2040%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M20%2020v-20h-2v20h-18v2h18v18h2v-18h18v-2h-18z%22/%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-white/80 text-sm font-medium">Portail Client</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Bienvenue, {data?.contact.name}!
          </h1>
          <p className="text-white/80">
            Gérez vos disponibilités et rendez-vous avec {data?.contact.account.companyName}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cn(
          "relative overflow-hidden transition-all hover:shadow-lg",
          stats?.calendarConnected 
            ? "border-emerald-200 bg-emerald-50/50" 
            : "border-amber-200 bg-amber-50/50"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Calendrier
            </CardTitle>
            <Calendar className={cn(
              "h-5 w-5",
              stats?.calendarConnected ? "text-emerald-600" : "text-amber-600"
            )} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.calendarConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-semibold text-emerald-700">Connecté</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-lg font-semibold text-amber-700">Non connecté</span>
                </>
              )}
            </div>
            <Link href="/contact-portal/calendar">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 -ml-2 text-slate-600 hover:text-slate-900"
              >
                {stats?.calendarConnected ? "Gérer" : "Connecter"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Disponibilités
            </CardTitle>
            <Clock className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.availabilitySlotsCount || 0}
            </div>
            <p className="text-sm text-slate-500">créneaux définis</p>
            <Link href="/contact-portal/availability">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 -ml-2 text-slate-600 hover:text-slate-900"
              >
                Gérer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Rendez-vous
            </CardTitle>
            <CalendarCheck className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats?.upcomingBookingsCount || 0}
            </div>
            <p className="text-sm text-slate-500">à venir</p>
            <Link href="/contact-portal/bookings">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 -ml-2 text-slate-600 hover:text-slate-900"
              >
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Setup Guide (if not fully configured) */}
      {(!stats?.calendarConnected || !stats?.availabilitySlotsCount) && (
        <Card className="border-dashed border-2 border-primary-200 bg-primary-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Configuration rapide</CardTitle>
            <CardDescription>
              Complétez ces étapes pour permettre la prise de rendez-vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                  stats?.calendarConnected 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-primary-100 text-primary-700"
                )}>
                  {stats?.calendarConnected ? <CheckCircle2 className="h-4 w-4" /> : "1"}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    stats?.calendarConnected ? "text-slate-400 line-through" : "text-slate-900"
                  )}>
                    Connecter votre calendrier
                  </p>
                  <p className="text-sm text-slate-500">Google Calendar ou Outlook</p>
                </div>
                {!stats?.calendarConnected && (
                  <Link href="/contact-portal/calendar">
                    <Button size="sm" className="rounded-xl">
                      <Link2 className="mr-2 h-4 w-4" />
                      Connecter
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                  stats?.availabilitySlotsCount 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-primary-100 text-primary-700"
                )}>
                  {stats?.availabilitySlotsCount ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    stats?.availabilitySlotsCount ? "text-slate-400 line-through" : "text-slate-900"
                  )}>
                    Définir vos disponibilités
                  </p>
                  <p className="text-sm text-slate-500">Choisissez vos créneaux habituels</p>
                </div>
                {!stats?.availabilitySlotsCount && (
                  <Link href="/contact-portal/availability">
                    <Button size="sm" variant="outline" className="rounded-xl">
                      <Clock className="mr-2 h-4 w-4" />
                      Configurer
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains rendez-vous</CardTitle>
          <CardDescription>
            Vos rendez-vous à venir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Aucun rendez-vous à venir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <CalendarCheck className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{booking.title}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.startTime).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })} à {new Date(booking.startTime).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={
                    booking.status === "confirmed" ? "default" :
                    booking.status === "pending" ? "secondary" : "outline"
                  }>
                    {booking.status === "confirmed" ? "Confirmé" :
                     booking.status === "pending" ? "En attente" : booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}










