"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, User, Mail, Phone, Clock, Video, List, Grid, Filter, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo } from "react";
import { BookingPlacementDialog } from "./booking-placement-dialog";
import { CampaignBookingsAgenda } from "./campaign-bookings-agenda";

type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  meetingType?: string;
  onlineMeetingEmail?: string;
  status: string;
  distance?: number;
  user: { email: string };
  lead?: { standardData: any; campaign?: { id: string; name: string } };
};

type CampaignBookingsTabProps = {
  campaignId: string;
  accountId?: string;
};

export function CampaignBookingsTab({ campaignId, accountId }: CampaignBookingsTabProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [placementDialogOpen, setPlacementDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "agenda">("list");
  
  // Filter states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [proximityMode, setProximityMode] = useState<"postal_code" | "radius">("postal_code");
  const [radius, setRadius] = useState<string>("10");
  const [sortBy, setSortBy] = useState<"date" | "proximity">("date");
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("proximityMode", proximityMode);
    if (proximityMode === "radius") {
      params.set("radius", radius);
      // For proximity sorting, we'd need a reference point - using first booking's location or center
      // For now, we'll use postal code grouping
    }
    if (meetingTypeFilter !== "all") {
      params.set("meetingType", meetingTypeFilter);
    }
    return params.toString();
  }, [dateFrom, dateTo, sortBy, proximityMode, radius, meetingTypeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["campaign-bookings", campaignId, queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/bookings?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json() as Promise<{
        bookings: Booking[];
        groupedByCP: Record<string, Booking[]>;
        total: number;
      }>;
    },
  });

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setPlacementDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Chargement des rendez-vous...</div>;
  }

  if (!data || data.total === 0) {
    return (
      <div className="p-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground">Aucun rendez-vous pour cette campagne</p>
      </div>
    );
  }

  const postalCodes = Object.keys(data.groupedByCP).sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Rendez-vous pris</h2>
          <p className="text-muted-foreground">{data.total} RDV au total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "agenda" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("agenda")}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres et tri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de rendez-vous</Label>
                <Select value={meetingTypeFilter} onValueChange={setMeetingTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="PHYSICAL">Physique</SelectItem>
                    <SelectItem value="ONLINE">En ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode de proximité</Label>
                <Select value={proximityMode} onValueChange={(v: "postal_code" | "radius") => setProximityMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postal_code">Par code postal</SelectItem>
                    <SelectItem value="radius">Par rayon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {proximityMode === "radius" && (
                <div className="space-y-2">
                  <Label>Rayon (km)</Label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Trier par</Label>
                <Select value={sortBy} onValueChange={(v: "date" | "proximity") => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="proximity">Proximité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "agenda" ? (
        <CampaignBookingsAgenda
          bookings={data.bookings}
          onBookingClick={handleBookingClick}
          accountId={accountId}
        />
      ) : (
        <>
          {postalCodes.map((cp) => {
        const bookings = data.groupedByCP[cp];
        return (
          <Card key={cp}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Code Postal: {cp}
                <Badge variant="outline">{bookings.length} RDV</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {booking.meetingType === "PHYSICAL" ? (
                            <MapPin className="h-4 w-4 text-primary-500" />
                          ) : booking.meetingType === "ONLINE" ? (
                            <Video className="h-4 w-4 text-primary-500" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{booking.contactName || booking.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {booking.status}
                          </Badge>
                          {booking.meetingType && (
                            <Badge variant="secondary" className="text-xs">
                              {booking.meetingType === "PHYSICAL" ? "Physique" : "En ligne"}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(booking.startTime), "PPp", { locale: fr })}
                          </div>
                          {booking.contactEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.contactEmail}
                            </div>
                          )}
                          {booking.contactPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.contactPhone}
                            </div>
                          )}
                        </div>
                        
                        {booking.meetingType === "PHYSICAL" && booking.address && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {booking.address}, {booking.city} {booking.postalCode && `(${booking.postalCode})`}
                          </div>
                        )}
                        {booking.meetingType === "ONLINE" && booking.onlineMeetingEmail && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Video className="h-3 w-3" />
                            Email: {booking.onlineMeetingEmail}
                          </div>
                        )}
                        {booking.distance !== undefined && booking.distance !== null && (
                          <div className="text-xs text-muted-foreground">
                            Distance: {booking.distance.toFixed(1)} km
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Créé par: {booking.user.email}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookingClick(booking);
                        }}
                      >
                        Placer dans l'agenda
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
        </>
      )}

      {selectedBooking && (
        <BookingPlacementDialog
          booking={selectedBooking}
          open={placementDialogOpen}
          onOpenChange={setPlacementDialogOpen}
          accountId={accountId}
        />
      )}
    </div>
  );
}
