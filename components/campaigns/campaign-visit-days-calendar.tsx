"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignVisitDay {
  id: string;
  campaignId: string;
  date: string;
  notes?: string;
}

interface CampaignVisitDaysCalendarProps {
  campaignId: string;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function CampaignVisitDaysCalendar({ campaignId }: CampaignVisitDaysCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [editingDay, setEditingDay] = useState<CampaignVisitDay | null>(null);

  // Calculate the start and end of the visible calendar period
  const calendarRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [currentDate]);

  const { data: visitDays = [], isLoading } = useQuery<CampaignVisitDay[]>({
    queryKey: ["campaign-visit-days", campaignId, calendarRange.startDate, calendarRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: calendarRange.startDate,
        endDate: calendarRange.endDate,
      });
      const res = await fetch(`/api/campaigns/${campaignId}/visit-days?${params}`);
      if (!res.ok) throw new Error("Failed to fetch visit days");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ dates, notes }: { dates: string[]; notes?: string }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/visit-days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, notes }),
      });
      if (!res.ok) throw new Error("Failed to create visit days");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-visit-days", campaignId] });
      setDialogOpen(false);
      setSelectedDates([]);
      setNotes("");
      toast({ title: "Jours de visite ajoutés" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/visit-days/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to update visit day");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-visit-days", campaignId] });
      setDialogOpen(false);
      setEditingDay(null);
      setNotes("");
      toast({ title: "Jour de visite mis à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/visit-days/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete visit day");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-visit-days", campaignId] });
      toast({ title: "Jour de visite supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  // Create a map of visit days for quick lookup
  const visitDayMap = useMemo(() => {
    const map = new Map<string, CampaignVisitDay>();
    for (const vd of visitDays) {
      const dateKey = new Date(vd.date).toISOString().split("T")[0];
      map.set(dateKey, vd);
    }
    return map;
  }, [visitDays]);

  const handleDateClick = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    const existingDay = visitDayMap.get(dateKey);

    if (existingDay) {
      // Edit existing day
      setEditingDay(existingDay);
      setNotes(existingDay.notes || "");
      setDialogOpen(true);
    } else {
      // Toggle selection for new days
      const isSelected = selectedDates.some(
        (d) => d.toISOString().split("T")[0] === dateKey
      );

      if (isSelected) {
        setSelectedDates(selectedDates.filter(
          (d) => d.toISOString().split("T")[0] !== dateKey
        ));
      } else {
        setSelectedDates([...selectedDates, date]);
      }
    }
  };

  const handleSubmit = () => {
    if (editingDay) {
      updateMutation.mutate({ id: editingDay.id, notes });
    } else if (selectedDates.length > 0) {
      createMutation.mutate({
        dates: selectedDates.map((d) => d.toISOString().split("T")[0]),
        notes: notes || undefined,
      });
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-heading">Calendrier des visites</h3>
          <p className="text-sm text-text-muted">
            Cliquez pour ajouter des jours de visite physique
          </p>
        </div>
        {selectedDates.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {selectedDates.length} jour{selectedDates.length > 1 ? "s" : ""} sélectionné{selectedDates.length > 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDates([])}
            >
              Annuler
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-surface-secondary rounded-lg p-3">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-text-heading">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-surface-secondary">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-text-muted border-b"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-20 border-b border-r bg-surface-secondary/50" />;
            }

            const dateKey = date.toISOString().split("T")[0];
            const visitDay = visitDayMap.get(dateKey);
            const isSelected = selectedDates.some(
              (d) => d.toISOString().split("T")[0] === dateKey
            );
            const past = isPast(date);
            const today = isToday(date);

            return (
              <button
                key={dateKey}
                onClick={() => !past && handleDateClick(date)}
                disabled={past}
                className={cn(
                  "h-20 p-1 border-b border-r text-left transition-colors relative group",
                  past && "bg-surface-secondary/50 cursor-not-allowed",
                  !past && "hover:bg-primary-50",
                  isSelected && "bg-primary-100",
                  visitDay && "bg-emerald-50"
                )}
              >
                <div className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                  today && "bg-primary-500 text-white",
                  !today && !past && "text-text-heading",
                  past && "text-text-muted"
                )}>
                  {date.getDate()}
                </div>
                
                {visitDay && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 rounded px-1 py-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">Visite</span>
                    </div>
                    {visitDay.notes && (
                      <p className="text-[10px] text-text-muted truncate mt-0.5 px-1">
                        {visitDay.notes}
                      </p>
                    )}
                  </div>
                )}

                {isSelected && !visitDay && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary-500 rounded-full" />
                  </div>
                )}

                {visitDay && !past && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(visitDay.id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-100 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-rose-500" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-100 rounded border border-emerald-200" />
          <span>Jour de visite</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-100 rounded border border-primary-200" />
          <span>Sélectionné</span>
        </div>
      </div>

      {/* Dialog for adding/editing notes */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingDay(null);
          setNotes("");
        }
        setDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDay ? "Modifier le jour de visite" : "Ajouter des jours de visite"}
            </DialogTitle>
            <DialogDescription>
              {editingDay 
                ? `Jour: ${new Date(editingDay.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`
                : `${selectedDates.length} jour${selectedDates.length > 1 ? "s" : ""} sélectionné${selectedDates.length > 1 ? "s" : ""}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Secteur Nord, Zone industrielle..."
                rows={3}
              />
            </div>

            {!editingDay && selectedDates.length > 0 && (
              <div className="space-y-2">
                <Label>Dates sélectionnées</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date) => (
                    <Badge key={date.toISOString()} variant="outline">
                      {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {editingDay && (
              <Button
                variant="outline"
                onClick={() => {
                  deleteMutation.mutate(editingDay.id);
                  setDialogOpen(false);
                  setEditingDay(null);
                }}
                className="mr-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingDay ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

