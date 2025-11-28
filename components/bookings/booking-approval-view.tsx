"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Building2,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  approvalStatus: string;
  location?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  user: {
    id: string;
    email: string;
  };
  lead?: {
    id: string;
    standardData: any;
    campaign?: {
      id: string;
      name: string;
    };
  };
  meetingType?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    isPhysical?: boolean;
  };
  approver?: {
    id: string;
    email: string;
  };
}

interface BookingApprovalViewProps {
  userRole: string;
}

export function BookingApprovalView({ userRole }: BookingApprovalViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"date" | "proximity">("date");
  const [statusFilter, setStatusFilter] = useState<string>("on_hold");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const canApprove = ["ADMIN", "MANAGER"].includes(userRole);

  const { data, isLoading } = useQuery<{
    grouped?: Record<string, Booking[]>;
    total: number;
  } | Booking[]>({
    queryKey: ["bookings", view, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        approvalStatus: statusFilter,
      });
      
      if (view === "date") {
        params.set("groupBy", "date");
      } else if (view === "proximity") {
        // Use Paris as default center for proximity sorting
        params.set("sort", "proximity");
        params.set("lat", "48.8566");
        params.set("lng", "2.3522");
        params.set("groupBy", "postalCode");
      }
      
      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({ title: "RDV approuvé", description: "Le rendez-vous a été approuvé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const res = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to reject booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setRejectDialogOpen(false);
      setSelectedBooking(null);
      setRejectReason("");
      toast({ title: "RDV refusé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Approuvé</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-100 text-amber-700 border-0">En attente</Badge>;
      case "rejected":
        return <Badge className="bg-rose-100 text-rose-700 border-0">Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const { date, time } = formatDateTime(booking.startTime);
    const leadName = booking.lead?.standardData?.firstName 
      ? `${booking.lead.standardData.firstName} ${booking.lead.standardData.lastName || ""}`
      : "Lead";

    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: booking.meetingType?.color 
                      ? `${booking.meetingType.color}20` 
                      : "#f1f5f9" 
                  }}
                >
                  {booking.meetingType?.isPhysical ? (
                    <MapPin className="h-5 w-5" style={{ color: booking.meetingType?.color || "#6B7280" }} />
                  ) : (
                    <Calendar className="h-5 w-5" style={{ color: booking.meetingType?.color || "#6B7280" }} />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-text-heading">{booking.title}</h4>
                  <p className="text-sm text-text-muted">{leadName}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{date} à {time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{booking.user.email}</span>
                </div>
                {booking.lead?.campaign && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{booking.lead.campaign.name}</span>
                  </div>
                )}
              </div>

              {(booking.address || booking.location) && (
                <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.address || booking.location}</span>
                  {booking.city && <span>, {booking.city}</span>}
                  {booking.postalCode && <span> ({booking.postalCode})</span>}
                </div>
              )}

              {booking.distance !== undefined && booking.distance !== Infinity && (
                <Badge variant="outline" className="text-xs">
                  ~{booking.distance.toFixed(1)} km
                </Badge>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {getApprovalBadge(booking.approvalStatus)}
              
              {canApprove && booking.approvalStatus === "on_hold" && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(booking.id)}
                    disabled={approveMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setRejectDialogOpen(true);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroupedBookings = () => {
    if (!data) return null;

    // Check if data has 'grouped' property (grouped response)
    if ('grouped' in data && data.grouped) {
      const grouped = data.grouped;
      const sortedKeys = Object.keys(grouped).sort();

      return (
        <div className="space-y-6">
          {sortedKeys.map((key) => (
            <div key={key}>
              <h3 className="font-semibold text-text-heading mb-3 sticky top-0 bg-background py-2">
                {view === "date" 
                  ? new Date(key).toLocaleDateString("fr-FR", { 
                      weekday: "long", 
                      day: "numeric", 
                      month: "long" 
                    })
                  : key === "unknown" ? "Sans code postal" : `Code postal: ${key}`
                }
                <Badge variant="outline" className="ml-2">
                  {grouped[key].length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {grouped[key].map((booking: Booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Flat list of bookings
    const bookings = data as Booking[];
    return (
      <div className="space-y-3">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const total = data && 'total' in data ? data.total : Array.isArray(data) ? data.length : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_hold">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Refusés</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-text-muted" />
          <Tabs value={view} onValueChange={(v) => setView(v as "date" | "proximity")}>
            <TabsList>
              <TabsTrigger value="date">Par date</TabsTrigger>
              <TabsTrigger value="proximity">Par proximité</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Badge variant="outline" className="ml-auto">
          {total} RDV
        </Badge>
      </div>

      {/* Bookings List */}
      {total === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-text-muted" />
              <h3 className="font-medium text-text-heading mb-1">
                Aucun rendez-vous
              </h3>
              <p className="text-sm text-text-muted">
                {statusFilter === "on_hold" 
                  ? "Aucun RDV en attente d'approbation"
                  : "Aucun RDV trouvé avec ces filtres"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        renderGroupedBookings()
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser ce RDV ?</DialogTitle>
            <DialogDescription>
              {selectedBooking?.title} - {selectedBooking?.user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du refus (optionnel)</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi ce RDV est refusé..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && rejectMutation.mutate({
                bookingId: selectedBooking.id,
                reason: rejectReason || undefined,
              })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

