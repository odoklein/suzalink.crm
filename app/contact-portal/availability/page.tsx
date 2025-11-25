"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Globe,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isRecurring: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 0, label: "Dimanche", short: "Dim" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/London", label: "Londres (GMT/BST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

export default function AvailabilityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [editMode, setEditMode] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const { data: savedSlots = [], isLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["contact-availability"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/availability");
      if (!res.ok) throw new Error("Failed to fetch availability");
      const data = await res.json();
      setSlots(data);
      if (data.length > 0) {
        setTimezone(data[0].timezone);
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/contact-portal/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots, timezone }),
      });
      if (!res.ok) throw new Error("Failed to save availability");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-availability"] });
      setEditMode(false);
      toast({
        title: "Disponibilités enregistrées",
        description: "Vos créneaux de disponibilité ont été mis à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder",
        variant: "destructive",
      });
    },
  });

  const addSlot = (dayOfWeek: number) => {
    const newSlot: AvailabilitySlot = {
      id: `temp-${Date.now()}`,
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      timezone,
      isRecurring: true,
    };
    setSlots([...slots, newSlot]);
    setEditMode(true);
  };

  const removeSlot = (slotId: string) => {
    setSlots(slots.filter(s => s.id !== slotId));
    setEditMode(true);
  };

  const updateSlot = (slotId: string, field: "startTime" | "endTime", value: string) => {
    setSlots(slots.map(s => 
      s.id === slotId ? { ...s, [field]: value } : s
    ));
    setEditMode(true);
  };

  const getSlotsForDay = (dayOfWeek: number) => {
    return slots.filter(s => s.dayOfWeek === dayOfWeek);
  };

  const hasChanges = editMode || JSON.stringify(slots) !== JSON.stringify(savedSlots);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes disponibilités</h1>
          <p className="text-slate-500 mt-1">
            Définissez vos créneaux disponibles pour les rendez-vous
          </p>
        </div>
        
        {hasChanges && (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        )}
      </div>

      {/* Timezone Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Globe className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="font-medium text-slate-900">Fuseau horaire</p>
              <p className="text-sm text-slate-500">
                Tous les créneaux sont affichés dans ce fuseau horaire
              </p>
            </div>
            <Select value={timezone} onValueChange={(v) => { setTimezone(v); setEditMode(true); }}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Créneaux hebdomadaires</CardTitle>
          <CardDescription>
            Ces créneaux se répètent chaque semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = getSlotsForDay(day.value);
                
                return (
                  <div
                    key={day.value}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                      daySlots.length > 0 
                        ? "border-primary-200 bg-primary-50/30" 
                        : "border-slate-200"
                    )}
                  >
                    <div className="w-28 flex-shrink-0">
                      <p className="font-medium text-slate-900">{day.label}</p>
                      {daySlots.length > 0 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {daySlots.length} créneau{daySlots.length !== 1 ? "x" : ""}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">
                          Non disponible
                        </p>
                      ) : (
                        daySlots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2">
                            <Select
                              value={slot.startTime}
                              onValueChange={(v) => updateSlot(slot.id, "startTime", v)}
                            >
                              <SelectTrigger className="w-28 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(time => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <span className="text-slate-400">à</span>
                            
                            <Select
                              value={slot.endTime}
                              onValueChange={(v) => updateSlot(slot.id, "endTime", v)}
                            >
                              <SelectTrigger className="w-28 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(time => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlot(slot.id)}
                              className="h-9 w-9 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSlot(day.value)}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 mb-2">
                Modèles rapides
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekdaySlots = [1, 2, 3, 4, 5].map(day => ({
                      id: `temp-${Date.now()}-${day}`,
                      dayOfWeek: day,
                      startTime: "09:00",
                      endTime: "17:00",
                      timezone,
                      isRecurring: true,
                    }));
                    setSlots(weekdaySlots);
                    setEditMode(true);
                  }}
                >
                  Lun-Ven 9h-17h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekdaySlots = [1, 2, 3, 4, 5].map(day => ({
                      id: `temp-${Date.now()}-${day}`,
                      dayOfWeek: day,
                      startTime: "09:00",
                      endTime: "12:00",
                      timezone,
                      isRecurring: true,
                    }));
                    setSlots(weekdaySlots);
                    setEditMode(true);
                  }}
                >
                  Lun-Ven matins
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekdaySlots = [1, 2, 3, 4, 5].map(day => ({
                      id: `temp-${Date.now()}-${day}`,
                      dayOfWeek: day,
                      startTime: "14:00",
                      endTime: "18:00",
                      timezone,
                      isRecurring: true,
                    }));
                    setSlots(weekdaySlots);
                    setEditMode(true);
                  }}
                >
                  Lun-Ven après-midis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSlots([]);
                    setEditMode(true);
                  }}
                  className="text-rose-600 hover:text-rose-700"
                >
                  Tout effacer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

