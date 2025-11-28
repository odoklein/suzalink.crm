"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Users,
  X,
  Sun,
  Moon,
  Target,
  CalendarDays,
  CalendarRange,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface Campaign {
  id: string;
  name: string;
  account: {
    id: string;
    companyName: string;
  };
  _count: {
    leads: number;
  };
}

interface DailyAssignment {
  id: string;
  userId: string;
  campaignId: string;
  date: string;
  timeSlot: string;
  notes?: string;
  user: User;
  campaign: Campaign;
  assignedBy: {
    email: string;
  };
}

interface DailyPlanningData {
  assignments: DailyAssignment[];
  users: User[];
  campaigns: Campaign[];
}

interface SlotSelection {
  date: Date;
  timeSlot: "morning" | "afternoon" | "full_day";
}

// Campaign colors
const CAMPAIGN_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", dot: "bg-blue-500", hover: "hover:bg-blue-200" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", dot: "bg-emerald-500", hover: "hover:bg-emerald-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", dot: "bg-amber-500", hover: "hover:bg-amber-200" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", dot: "bg-purple-500", hover: "hover:bg-purple-200" },
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300", dot: "bg-rose-500", hover: "hover:bg-rose-200" },
  { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300", dot: "bg-cyan-500", hover: "hover:bg-cyan-200" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300", dot: "bg-indigo-500", hover: "hover:bg-indigo-200" },
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", dot: "bg-orange-500", hover: "hover:bg-orange-200" },
];

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const PARIS_TIMEZONE = "Europe/Paris";

// Helper function to get current date in Paris timezone
function getParisDate(): Date {
  const now = new Date();
  const parisStr = now.toLocaleString("en-CA", { timeZone: PARIS_TIMEZONE, hour12: false });
  // parisStr format: "2025-01-15, 14:30:00" -> extract date part
  const [datePart] = parisStr.split(",");
  const [year, month, day] = datePart.split("-").map(Number);
  const parisDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  return parisDate;
}

// Helper function to get date key (YYYY-MM-DD) in Paris timezone
function getDateKey(date: Date | string): string {
  if (typeof date === "string") {
    // Handle ISO string from database - extract just the date portion
    return date.split("T")[0];
  }
  // Format date in Paris timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

// Helper function to format date for display in Paris timezone
function formatDateParis(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("fr-FR", { ...options, timeZone: PARIS_TIMEZONE });
}

// Helper function to get day of week in Paris timezone (0 = Sunday, 6 = Saturday)
function getParisDayOfWeek(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TIMEZONE,
    weekday: "short",
  });
  const dayStr = formatter.format(date);
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return days[dayStr] ?? 0;
}

// Helper function to get date parts in Paris timezone
function getParisDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);
  return { year, month, day };
}

// Assignment Dialog - Select BD and Campaign
function AssignmentDialog({
  open,
  onOpenChange,
  users,
  campaigns,
  campaignColorMap,
  onSubmit,
  slotSelection,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  campaigns: Campaign[];
  campaignColorMap: Map<string, typeof CAMPAIGN_COLORS[0]>;
  onSubmit: (userId: string, campaignId: string) => void;
  slotSelection: SlotSelection | null;
  isLoading: boolean;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const getSlotLabel = (slot: string) => {
    if (slot === "morning") return "Matin";
    if (slot === "afternoon") return "Après-midi";
    return "Journée complète";
  };

  const getSlotIcon = (slot: string) => {
    if (slot === "morning") return <Sun className="h-5 w-5 text-amber-500" />;
    if (slot === "afternoon") return <Moon className="h-5 w-5 text-indigo-500" />;
    return <CalendarDays className="h-5 w-5 text-primary" />;
  };

  const formatDate = (date: Date) => {
    return formatDateParis(date, { weekday: "long", day: "numeric", month: "long" });
  };

  const getInitials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  const handleSubmit = () => {
    if (selectedUserId && selectedCampaignId) {
      onSubmit(selectedUserId, selectedCampaignId);
      setSelectedUserId(null);
      setSelectedCampaignId(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedUserId(null);
      setSelectedCampaignId(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {slotSelection && getSlotIcon(slotSelection.timeSlot)}
            Nouvelle assignation
          </DialogTitle>
          <DialogDescription>
            {slotSelection && (
              <span>
                {formatDate(slotSelection.date)} — <strong>{getSlotLabel(slotSelection.timeSlot)}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* BD Selection */}
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Choisir un BD
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-1">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                  Aucun BD disponible
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left",
                      selectedUserId === user.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={cn(
                        "text-xs font-medium",
                        selectedUserId === user.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      )}>
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">
                      {user.email.split("@")[0]}
                    </span>
                    {selectedUserId === user.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Campaign Selection */}
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              Choisir une campagne
            </label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune campagne active
                </p>
              ) : (
                campaigns.map((campaign) => {
                  const colors = campaignColorMap.get(campaign.id);
                  const isSelected = selectedCampaignId === campaign.id;
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : colors?.border,
                        colors?.bg, colors?.hover,
                        "hover:scale-[1.01]"
                      )}
                    >
                      <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colors?.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold truncate", colors?.text)}>
                          {campaign.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {campaign.account.companyName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs h-6 flex-shrink-0">
                        {campaign._count.leads} leads
                      </Badge>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || !selectedCampaignId || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Créer l'assignation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Clickable Time Slot
function ClickableSlot({
  date,
  timeSlot,
  assignments,
  campaignColorMap,
  onClick,
  onDelete,
  isToday,
}: {
  date: Date;
  timeSlot: "morning" | "afternoon";
  assignments: DailyAssignment[];
  campaignColorMap: Map<string, typeof CAMPAIGN_COLORS[0]>;
  onClick: (date: Date, timeSlot: "morning" | "afternoon" | "full_day") => void;
  onDelete: (assignmentId: string) => void;
  isToday: boolean;
}) {
  const slotAssignments = assignments.filter(
    (a) =>
      getDateKey(a.date) === getDateKey(date) &&
      (a.timeSlot === timeSlot || a.timeSlot === "full_day")
  );

  return (
    <div
      onClick={() => onClick(date, timeSlot)}
      className={cn(
        "min-h-[60px] p-1.5 border-t border-dashed transition-all duration-200 flex flex-wrap gap-1 items-start content-start relative cursor-pointer group",
        timeSlot === "morning" 
          ? "bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200 hover:from-amber-100/70 hover:to-orange-100/50" 
          : "bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-indigo-200 hover:from-indigo-100/70 hover:to-purple-100/50",
        isToday && "ring-1 ring-primary/20 ring-inset"
      )}
    >
      {/* Slot label */}
      <div className={cn(
        "absolute top-0 right-1 text-[9px] font-medium px-1 rounded-b z-10",
        timeSlot === "morning" ? "text-amber-600 bg-amber-100/80" : "text-indigo-600 bg-indigo-100/80"
      )}>
        {timeSlot === "morning" ? "☀️ Matin" : "🌙 Soir"}
      </div>

      {/* Add button on hover */}
      {slotAssignments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded-full shadow-sm">
            <Plus className="h-3 w-3" />
            Ajouter
          </div>
        </div>
      )}

      {/* Assignments */}
      {slotAssignments.map((assignment) => {
        const colors = campaignColorMap.get(assignment.campaignId);
        return (
          <Tooltip key={assignment.id}>
            <TooltipTrigger asChild>
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "group/item flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border shadow-sm cursor-default",
                  colors?.bg, colors?.text, colors?.border
                )}
              >
                <span className="max-w-[60px] truncate">
                  {assignment.campaign.name}
                </span>
                <span className="text-[9px] opacity-60">
                  ({assignment.user.email.split("@")[0].slice(0, 4)})
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(assignment.id);
                  }}
                  className="opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-destructive ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{assignment.campaign.name}</p>
              <p className="text-muted-foreground">
                {assignment.campaign.account.companyName}
              </p>
              <p className="text-muted-foreground">
                BD: {assignment.user.email.split("@")[0]}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// Day Column Component
function DayColumn({
  date,
  assignments,
  campaignColorMap,
  onSlotClick,
  onDelete,
  isToday,
  isWeekend,
}: {
  date: Date;
  assignments: DailyAssignment[];
  campaignColorMap: Map<string, typeof CAMPAIGN_COLORS[0]>;
  onSlotClick: (date: Date, timeSlot: "morning" | "afternoon" | "full_day") => void;
  onDelete: (assignmentId: string) => void;
  isToday: boolean;
  isWeekend: boolean;
}) {
  // Filter assignments for this date
  const dayAssignments = assignments.filter(
    (a) => getDateKey(a.date) === getDateKey(date)
  );

  // Check for full day assignment
  const fullDayAssignment = dayAssignments.find((a) => a.timeSlot === "full_day");

  return (
    <div
      className={cn(
        "flex-1 min-w-[130px] border-r border-gray-200 flex flex-col relative",
        isWeekend && "bg-gray-50/50",
        isToday && "bg-primary/5"
      )}
    >
      {fullDayAssignment ? (
        // Full day view
        <div className="flex-1 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "group h-full flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg border-2 text-xs font-medium cursor-default shadow-sm",
                  campaignColorMap.get(fullDayAssignment.campaignId)?.bg,
                  campaignColorMap.get(fullDayAssignment.campaignId)?.text,
                  campaignColorMap.get(fullDayAssignment.campaignId)?.border
                )}
              >
                <CalendarDays className="h-4 w-4 mb-1 opacity-60" />
                <span className="text-center truncate w-full">{fullDayAssignment.campaign.name}</span>
                <span className="text-[10px] opacity-70">{fullDayAssignment.user.email.split("@")[0]}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(fullDayAssignment.id);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{fullDayAssignment.campaign.name}</p>
              <p className="text-muted-foreground text-xs">
                {fullDayAssignment.campaign.account.companyName} - Journée complète
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <>
          {/* Morning slot */}
          <div className="flex-1 relative">
            <ClickableSlot
              date={date}
              timeSlot="morning"
              assignments={dayAssignments}
              campaignColorMap={campaignColorMap}
              onClick={onSlotClick}
              onDelete={onDelete}
              isToday={isToday}
            />
          </div>

          {/* Afternoon slot */}
          <div className="flex-1 relative">
            <ClickableSlot
              date={date}
              timeSlot="afternoon"
              assignments={dayAssignments}
              campaignColorMap={campaignColorMap}
              onClick={onSlotClick}
              onDelete={onDelete}
              isToday={isToday}
            />
          </div>

          {/* Full day button */}
          <button
            onClick={() => onSlotClick(date, "full_day")}
            className="h-7 border-t border-gray-200 flex items-center justify-center text-[10px] text-gray-400 hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Plus className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100" />
            <span className="group-hover:font-medium">📅 Journée entière</span>
          </button>
        </>
      )}
    </div>
  );
}

// Helper to get Monday of the week for a given date (in Paris timezone)
function getParisWeekStart(date: Date): Date {
  const { year, month, day } = getParisDateParts(date);
  const dayOfWeek = getParisDayOfWeek(date);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, Sunday = 0 -> -6
  const monday = new Date(year, month - 1, day + diff, 12, 0, 0, 0); // Use noon to avoid DST issues
  return monday;
}

export default function PlanningPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get today's date in Paris timezone
  const today = useMemo(() => getParisDate(), []);

  // State
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(() => getParisDate());
  const [slotSelection, setSlotSelection] = useState<SlotSelection | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Current week state - start from Monday of current week in Paris timezone
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return getParisWeekStart(getParisDate());
  });

  // Calculate dates based on view (using Paris timezone)
  const viewDates = useMemo(() => {
    if (view === "day") {
      return [selectedDay];
    }
    const dates: Date[] = [];
    const { year, month, day } = getParisDateParts(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      // Use noon to avoid DST transition issues
      const date = new Date(year, month - 1, day + i, 12, 0, 0, 0);
      dates.push(date);
    }
    return dates;
  }, [view, currentWeekStart, selectedDay]);

  const weekEnd = viewDates[viewDates.length - 1];

  // Fetch data - use getDateKey to avoid timezone issues
  const startDateKey = getDateKey(currentWeekStart);
  const endDateKey = getDateKey(weekEnd);
  
  const { data, isLoading } = useQuery<DailyPlanningData>({
    queryKey: ["daily-planning", startDateKey, endDateKey],
    queryFn: async () => {
      const res = await fetch(
        `/api/planning/daily?startDate=${startDateKey}&endDate=${endDateKey}`
      );
      if (!res.ok) throw new Error("Failed to fetch planning");
      return res.json();
    },
  });

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async ({
      userId,
      campaignId,
      date,
      timeSlot,
    }: {
      userId: string;
      campaignId: string;
      date: Date;
      timeSlot: string;
    }) => {
      const res = await fetch("/api/planning/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          campaignId,
          date: getDateKey(date),
          timeSlot,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-planning"],
      });
      toast({ title: "✅ Assignation créée" });
      setDialogOpen(false);
      setSlotSelection(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/planning/daily/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-planning"],
      });
      toast({ title: "Assignation supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Navigation (using Paris timezone)
  const goToPrevious = () => {
    if (view === "week") {
      const { year, month, day } = getParisDateParts(currentWeekStart);
      const newDate = new Date(year, month - 1, day - 7, 12, 0, 0, 0);
      setCurrentWeekStart(newDate);
    } else {
      const { year, month, day } = getParisDateParts(selectedDay);
      const newDate = new Date(year, month - 1, day - 1, 12, 0, 0, 0);
      setSelectedDay(newDate);
    }
  };

  const goToNext = () => {
    if (view === "week") {
      const { year, month, day } = getParisDateParts(currentWeekStart);
      const newDate = new Date(year, month - 1, day + 7, 12, 0, 0, 0);
      setCurrentWeekStart(newDate);
    } else {
      const { year, month, day } = getParisDateParts(selectedDay);
      const newDate = new Date(year, month - 1, day + 1, 12, 0, 0, 0);
      setSelectedDay(newDate);
    }
  };

  const goToToday = () => {
    const parisToday = getParisDate();
    setSelectedDay(parisToday);
    setCurrentWeekStart(getParisWeekStart(parisToday));
  };

  // Campaign color mapping
  const campaignColorMap = useMemo(() => {
    const map = new Map<string, typeof CAMPAIGN_COLORS[0]>();
    data?.campaigns.forEach((campaign, index) => {
      map.set(campaign.id, CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]);
    });
    return map;
  }, [data?.campaigns]);

  // Format date range (using Paris timezone)
  const formatDateRange = () => {
    if (view === "day") {
      return formatDateParis(selectedDay, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const startStr = formatDateParis(currentWeekStart, { day: "numeric", month: "short" });
    const endStr = formatDateParis(weekEnd, { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} — ${endStr}`;
  };

  // Handle slot click - open dialog
  const handleSlotClick = useCallback((date: Date, timeSlot: "morning" | "afternoon" | "full_day") => {
    setSlotSelection({ date, timeSlot });
    setDialogOpen(true);
  }, []);

  // Handle assignment submission
  const handleSubmit = useCallback((userId: string, campaignId: string) => {
    if (slotSelection) {
      createAssignment.mutate({
        userId,
        campaignId,
        date: slotSelection.date,
        timeSlot: slotSelection.timeSlot,
      });
    }
  }, [slotSelection, createAssignment]);

  // Handle delete
  const handleDelete = useCallback((assignmentId: string) => {
    deleteAssignment.mutate(assignmentId);
  }, [deleteAssignment]);

  // Stats
  const stats = useMemo(() => {
    if (!data) return { totalAssignments: 0, totalBDs: 0, morningSlots: 0, afternoonSlots: 0 };
    const morningSlots = data.assignments.filter((a) => a.timeSlot === "morning" || a.timeSlot === "full_day").length;
    const afternoonSlots = data.assignments.filter((a) => a.timeSlot === "afternoon" || a.timeSlot === "full_day").length;
    return {
      totalAssignments: data.assignments.length,
      totalBDs: data.users.length,
      morningSlots,
      afternoonSlots,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Chargement du planning...</p>
          </div>
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const campaigns = data?.campaigns || [];
  const assignments = data?.assignments || [];

  return (
    <TooltipProvider>
      <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Planning BD</h1>
            <p className="text-sm text-muted-foreground">
              Cliquez sur un créneau pour ajouter une assignation
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <Tabs value={view} onValueChange={(v) => setView(v as "week" | "day")}>
              <TabsList className="h-9">
                <TabsTrigger value="week" className="gap-1.5 text-xs">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Semaine
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-1.5 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Jour
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium whitespace-nowrap">{formatDateRange()}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs ml-1" onClick={goToToday}>
                Aujourd'hui
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-700">{stats.totalAssignments}</p>
              <p className="text-xs text-blue-600">Assignations</p>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-700">{stats.totalBDs}</p>
              <p className="text-xs text-emerald-600">BDs disponibles</p>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sun className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-700">{stats.morningSlots}</p>
              <p className="text-xs text-amber-600">Matinées</p>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Moon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-indigo-700">{stats.afternoonSlots}</p>
              <p className="text-xs text-indigo-600">Après-midis</p>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="flex border-b border-gray-200 bg-muted/30">
            {viewDates.map((date) => {
              const dateKey = getDateKey(date);
              const todayKey = getDateKey(today);
              const isCurrentDay = dateKey === todayKey;
              const dayOfWeek = getParisDayOfWeek(date);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const { day } = getParisDateParts(date);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "flex-1 min-w-[130px] p-3 text-center border-r border-gray-200",
                    isWeekend && "bg-gray-100/50",
                    isCurrentDay && "bg-primary/10"
                  )}
                >
                  <div className={cn("text-xs font-medium", isCurrentDay ? "text-primary" : "text-muted-foreground")}>
                    {DAYS_OF_WEEK[dayOfWeek === 0 ? 6 : dayOfWeek - 1]}
                  </div>
                  <div className={cn("text-2xl font-bold", isCurrentDay ? "text-primary" : "text-foreground")}>
                    {day}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDateParis(date, { month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Body */}
          <div className="flex min-h-[450px]">
            {viewDates.map((date) => {
              const dateKey = getDateKey(date);
              const todayKey = getDateKey(today);
              const isCurrentDay = dateKey === todayKey;
              const dayOfWeek = getParisDayOfWeek(date);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <DayColumn
                  key={dateKey}
                  date={date}
                  assignments={assignments}
                  campaignColorMap={campaignColorMap}
                  onSlotClick={handleSlotClick}
                  onDelete={handleDelete}
                  isToday={isCurrentDay}
                  isWeekend={isWeekend}
                />
              );
            })}
          </div>
        </div>

        {/* Campaign Legend */}
        {campaigns.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground font-medium mr-2">Campagnes:</span>
            {campaigns.map((campaign) => {
              const colors = campaignColorMap.get(campaign.id);
              return (
                <div
                  key={campaign.id}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border",
                    colors?.bg, colors?.text, colors?.border
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", colors?.dot)} />
                  <span className="max-w-[100px] truncate">{campaign.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        users={users}
        campaigns={campaigns}
        campaignColorMap={campaignColorMap}
        onSubmit={handleSubmit}
        slotSelection={slotSelection}
        isLoading={createAssignment.isPending}
      />
    </TooltipProvider>
  );
}
