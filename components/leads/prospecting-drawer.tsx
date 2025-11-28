"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Phone, Mail, FileText, Loader2, X, CheckCircle, XCircle, 
  Calendar, Clock, MapPin, Plus, MessageSquare, Check, Video, 
  Database, ChevronRight, MoreHorizontal, Sparkles, ArrowRight,
  Building2, User, Briefcase, Hash, AtSign, PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

type ProspectingDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  leadId?: string | null;
  autoAdvance?: boolean;
  onLeadChange?: (leadId: string | null) => void;
  autoInitiateCall?: boolean;
  onCallInitiated?: () => void;
};

// Notion-style inline editable field
function InlineField({
  icon: Icon,
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  className,
}: {
  icon?: any;
  label: string;
  value: string | number | null | undefined;
  onSave: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  placeholder?: string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(String(value || ""));
  }, [value]);

  const handleSave = () => {
    if (editValue !== String(value || "")) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(String(value || ""));
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors cursor-text",
        "hover:bg-muted/60",
        isEditing && "bg-muted/60",
        className
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {Icon && (
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
        {label}
      </span>
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
          placeholder={placeholder || `Ajouter ${label.toLowerCase()}`}
        />
      ) : (
        <span className={cn(
          "flex-1 text-sm truncate",
          value ? "text-foreground" : "text-muted-foreground/50"
        )}>
          {value || `Ajouter ${label.toLowerCase()}`}
        </span>
      )}
    </div>
  );
}

// Status badge with color
function StatusBadge({ 
  status, 
  color,
  onClick 
}: { 
  status: string; 
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all",
        "hover:ring-2 hover:ring-offset-1 hover:ring-primary/20",
        onClick && "cursor-pointer"
      )}
      style={{ 
        backgroundColor: color ? `${color}20` : undefined,
        color: color || undefined,
      }}
    >
      <span 
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color || "#6B7280" }}
      />
      {status}
    </button>
  );
}

export function ProspectingDrawer({
  open,
  onOpenChange,
  campaignId,
  leadId,
  autoAdvance = false,
  onLeadChange,
  autoInitiateCall = false,
  onCallInitiated,
}: ProspectingDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [note, setNote] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    description: "",
    meetingType: "PHYSICAL" as "PHYSICAL" | "ONLINE",
    address: "",
    city: "",
    postalCode: "",
    onlineMeetingEmail: "",
  });
  const [selectedColumns, setSelectedColumns] = useState({
    address: "",
    city: "",
    postalCode: "",
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch specific lead if leadId provided
  useEffect(() => {
    if (open) {
      if (leadId && leadId !== currentLead?.id) {
        fetch(`/api/leads/${leadId}`)
          .then((res) => res.json())
          .then((lead) => {
            if (!editingField) {
              setCurrentLead(lead);
              onLeadChange?.(lead.id);
            }
          })
          .catch(() => {
            toast({
              title: "Erreur",
              description: "Impossible de charger le lead",
              variant: "destructive",
            });
          });
      } else if (autoAdvance && !currentLead && !getNextLeadMutation.isPending) {
        getNextLeadMutation.mutate();
      }
    } else {
      setCurrentLead(null);
      setNote("");
      setEditingField(null);
    }
  }, [open, leadId, autoAdvance]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || !currentLead) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleFinishAndGetNext();
      }
      if (
        e.key === "n" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentLead]);

  // Auto-initiate call when requested
  useEffect(() => {
    if (autoInitiateCall && currentLead && open) {
      const phone = currentLead.standardData?.phone;
      if (phone) {
        // Small delay to ensure drawer is visible
        const timer = setTimeout(() => {
          // Try Aircall first, fallback to tel: link
          if (typeof window !== "undefined" && (window as any).Aircall) {
            const formattedPhone = phone.replace(/\D/g, "");
            (window as any).Aircall("dial", formattedPhone);
          } else {
            window.location.href = `tel:${phone}`;
          }
          onCallInitiated?.();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        onCallInitiated?.();
      }
    }
  }, [autoInitiateCall, currentLead, open, onCallInitiated]);

  const getNextLeadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/leads/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to get next lead");
      }
      return res.json();
    },
    onSuccess: (lead) => {
      if (!editingField) {
        setCurrentLead(lead);
        setNote("");
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        onLeadChange?.(lead.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Aucun lead disponible",
        description: error.message || "Tous les leads ont été traités",
        variant: "destructive",
      });
      onLeadChange?.(null);
    },
  });

  const unlockLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`/api/leads/${leadId}/lock`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unlock lead");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ leadId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["lead", leadId] });
      const previousLead = queryClient.getQueryData(["lead", leadId]);
      
      if (currentLead && currentLead.id === leadId) {
        const updatedLead = { ...currentLead, status };
        queryClient.setQueryData(["lead", leadId], updatedLead);
        setCurrentLead(updatedLead);
      }
      
      return { previousLead };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(["lead", variables.leadId], context.previousLead);
        if (currentLead && currentLead.id === variables.leadId) {
          setCurrentLead(context.previousLead as any);
        }
      }
      toast({ title: "Erreur", description: "Échec de la mise à jour", variant: "destructive" });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: currentLead.id,
          type: "NOTE",
          metadata: { note },
        }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", currentLead?.id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNote("");
      toast({ title: "Note ajoutée" });
    },
  });

  // Fetch dynamic statuses for the campaign
  const { data: campaignStatuses = [] } = useQuery({
    queryKey: ["campaign-statuses", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/statuses`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!campaignId && open,
    staleTime: 60000,
  });

  // Fetch bookings for current lead
  const { data: bookings = [] } = useQuery({
    queryKey: ["lead-bookings", currentLead?.id],
    queryFn: async () => {
      if (!currentLead?.id) return [];
      const res = await fetch(`/api/bookings?leadId=${currentLead.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentLead?.id && open,
  });

  // Fetch activities
  const { data: leadWithActivities } = useQuery({
    queryKey: ["lead", currentLead?.id],
    queryFn: async () => {
      if (!currentLead?.id) return null;
      const res = await fetch(`/api/leads/${currentLead.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!currentLead?.id && open && !editingField,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const activities = leadWithActivities?.activities || [];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: currentLead.id,
          ...data,
          contactName: `${standardData.firstName} ${standardData.lastName}`.trim(),
          contactEmail: standardData.email,
          contactPhone: standardData.phone,
        }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-bookings", currentLead?.id] });
      setBookingDialogOpen(false);
      setBookingForm({ 
        title: "", startTime: "", endTime: "", description: "",
        meetingType: "PHYSICAL", address: "", city: "", postalCode: "", onlineMeetingEmail: "",
      });
      toast({ title: "RDV créé avec succès" });
    },
  });

  const handleFinishAndGetNext = async () => {
    if (!currentLead) return;
    try {
      await unlockLeadMutation.mutateAsync(currentLead.id);
      setCurrentLead(null);
      setNote("");
      
      if (autoAdvance) {
        setTimeout(() => getNextLeadMutation.mutate(), 300);
      } else {
        onLeadChange?.(null);
      }
    } catch (error) {}
  };

  const handleQuickAction = async (outcome: string, status?: string) => {
    if (!currentLead) return;

    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: currentLead.id,
          type: "CALL",
          metadata: { outcome },
        }),
      });

      if (status) {
        await updateStatusMutation.mutateAsync({ leadId: currentLead.id, status });
      }

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: `Résultat: ${outcome}` });

      if (autoAdvance) {
        setTimeout(() => handleFinishAndGetNext(), 500);
      }
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  // Update lead field mutation
  const updateLeadFieldMutation = useMutation({
    mutationFn: async ({ field, value, isCustom }: { field: string; value: any; isCustom: boolean }) => {
      if (!currentLead) throw new Error("No lead selected");
      
      const updateData: any = {};
      if (isCustom) {
        updateData.customData = { ...(currentLead.customData || {}), [field]: value };
      } else {
        updateData.standardData = { ...(currentLead.standardData || {}), [field]: value };
      }
      const res = await fetch(`/api/leads/${currentLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: async ({ field, value, isCustom }) => {
      await queryClient.cancelQueries({ queryKey: ["lead", currentLead?.id] });
      const previousLead = queryClient.getQueryData(["lead", currentLead?.id]);
      
      if (currentLead) {
        const updatedLead = { ...currentLead };
        if (isCustom) {
          updatedLead.customData = { ...(updatedLead.customData || {}), [field]: value };
        } else {
          updatedLead.standardData = { ...(updatedLead.standardData || {}), [field]: value };
        }
        queryClient.setQueryData(["lead", currentLead.id], updatedLead);
        setCurrentLead(updatedLead);
      }
      
      return { previousLead };
    },
    onError: (err, variables, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(["lead", currentLead?.id], context.previousLead);
      }
      toast({ title: "Erreur", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", currentLead?.id] });
    },
  });

  const standardData = useMemo(() => currentLead?.standardData || {}, [currentLead?.standardData]);
  const customData = useMemo(() => currentLead?.customData || {}, [currentLead?.customData]);
  const schemaConfig = useMemo(() => currentLead?.campaign?.schemaConfig || [], [currentLead?.campaign?.schemaConfig]);

  // Get available fields for booking column selection
  const availableFields = useMemo(() => {
    const fields: Array<{ key: string; label: string; value: any; source: "standard" | "custom" }> = [];
    Object.keys(standardData).forEach((key) => {
      if (standardData[key]) {
        fields.push({
          key: `standard.${key}`,
          label: key,
          value: standardData[key],
          source: "standard",
        });
      }
    });
    schemaConfig.forEach((field: any) => {
      const value = customData[field.key];
      if (value) {
        fields.push({
          key: `custom.${field.key}`,
          label: field.label || field.key,
          value,
          source: "custom",
        });
      }
    });
    return fields;
  }, [standardData, customData, schemaConfig]);

  const handleColumnSelect = (field: "address" | "city" | "postalCode", columnKey: string) => {
    if (columnKey === "none") {
      setSelectedColumns({ ...selectedColumns, [field]: "" });
      return;
    }
    setSelectedColumns({ ...selectedColumns, [field]: columnKey });
    const selectedField = availableFields.find((f) => f.key === columnKey);
    if (selectedField) {
      setBookingForm({ ...bookingForm, [field]: String(selectedField.value || "") });
    }
  };

  const handleCreateBooking = () => {
    if (!bookingForm.title || !bookingForm.startTime || !bookingForm.endTime) {
      toast({ title: "Erreur", description: "Remplissez tous les champs requis", variant: "destructive" });
      return;
    }
    createBookingMutation.mutate(bookingForm);
  };

  const currentStatus = campaignStatuses.find((s: any) => 
    s.id === currentLead?.statusId || s.id === currentLead?.statusConfig?.id
  );

  return (
    <TooltipProvider>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          className="w-full sm:max-w-[420px] p-0 border-l shadow-2xl overflow-hidden flex flex-col"
          style={{ zIndex: 100 }}
        >
          {/* Loading State */}
          {!currentLead ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <SheetTitle className="sr-only">Chargement du prospect</SheetTitle>
              <div className="text-center space-y-4 max-w-[280px]">
                {getNextLeadMutation.isPending ? (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Chargement...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Récupération du prochain lead
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Prêt à prospecter</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliquez pour obtenir le prochain lead
                      </p>
                    </div>
                    <Button onClick={() => getNextLeadMutation.mutate()} className="w-full">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Obtenir un lead
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header - Compact */}
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <SheetTitle className="font-semibold text-base truncate">
                    {`${standardData.firstName || ""} ${standardData.lastName || ""}`.trim() || "Lead"}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {currentLead?.campaign?.name}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Status Section */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Statut</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="outline-none">
                          <StatusBadge 
                            status={currentStatus?.name || currentLead?.status || "Nouveau"}
                            color={currentStatus?.color}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-[200]">
                        {campaignStatuses.length === 0 ? (
                          <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                            Aucun statut configuré
                          </DropdownMenuItem>
                        ) : (
                          campaignStatuses.map((status: any) => (
                            <DropdownMenuItem
                              key={status.id}
                              onClick={() => {
                                if (currentLead?.id) {
                                  updateStatusMutation.mutate({ leadId: currentLead.id, status: status.id });
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span 
                                  className="h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span>{status.name}</span>
                                {status.isDefault && (
                                  <span className="text-[10px] text-muted-foreground ml-auto">Défaut</span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Contact Info - Notion Style */}
                <div className="px-4 py-3 border-b space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Contact
                  </p>
                  <InlineField
                    icon={AtSign}
                    label="Email"
                    value={standardData.email}
                    onSave={(v) => updateLeadFieldMutation.mutate({ field: "email", value: v, isCustom: false })}
                    type="email"
                  />
                  <InlineField
                    icon={Phone}
                    label="Téléphone"
                    value={standardData.phone}
                    onSave={(v) => updateLeadFieldMutation.mutate({ field: "phone", value: v, isCustom: false })}
                    type="tel"
                  />
                  <InlineField
                    icon={Briefcase}
                    label="Poste"
                    value={standardData.jobTitle}
                    onSave={(v) => updateLeadFieldMutation.mutate({ field: "jobTitle", value: v, isCustom: false })}
                  />
                  <InlineField
                    icon={Building2}
                    label="Entreprise"
                    value={standardData.company}
                    onSave={(v) => updateLeadFieldMutation.mutate({ field: "company", value: v, isCustom: false })}
                  />
                </div>

                {/* Custom Fields */}
                {schemaConfig.length > 0 && (
                  <div className="px-4 py-3 border-b space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Données
                    </p>
                    {schemaConfig.map((field: any) => (
                      <InlineField
                        key={field.key}
                        icon={Hash}
                        label={field.label || field.key}
                        value={customData[field.key]}
                        onSave={(v) => updateLeadFieldMutation.mutate({ field: field.key, value: v, isCustom: true })}
                        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Actions rapides
                  </p>
                  <div className="flex gap-2">
                    {standardData.phone && (
                      <ClickToDial phoneNumber={standardData.phone} className="flex-1 h-9" />
                    )}
                    {standardData.email && (
                      <Button 
                        variant="outline" 
                        className="flex-1 h-9"
                        onClick={() => router.push(`/inbox/compose?leadId=${currentLead.id}`)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                    )}
                  </div>

                  {/* Call Outcomes - Compact */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleQuickAction("No Answer")}
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pas de réponse</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleQuickAction("Voicemail")}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Répondeur</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleQuickAction("Interested", "Contacted")}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Intéressé</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleQuickAction("Not Interested", "Lost")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pas intéressé</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Bookings */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Rendez-vous
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Nouveau
                    </Button>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Aucun RDV planifié</p>
                  ) : (
                    <div className="space-y-2">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div
                          key={booking.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {booking.meetingType === "ONLINE" ? (
                              <Video className="h-4 w-4 text-primary" />
                            ) : (
                              <MapPin className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{booking.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(booking.startTime), "d MMM à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0">
                            {booking.approvalStatus === "on_hold" ? "En attente" : 
                             booking.approvalStatus === "approved" ? "Confirmé" : booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Notes
                  </p>
                  
                  {/* Recent Notes */}
                  {activities.filter((a: any) => a.type === "NOTE").length > 0 && (
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                      {activities
                        .filter((a: any) => a.type === "NOTE")
                        .slice(0, 3)
                        .map((activity: any) => (
                          <div key={activity.id} className="p-2 rounded-lg bg-muted/50">
                            <p className="text-xs line-clamp-2">{activity.metadata?.note}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {format(new Date(activity.createdAt), "d MMM HH:mm", { locale: fr })}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Add Note */}
                  <div className="space-y-2">
                    <Textarea
                      ref={noteTextareaRef}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ajouter une note... (N)"
                      rows={2}
                      className="text-sm resize-none"
                    />
                    <Button
                      onClick={() => addNoteMutation.mutate()}
                      disabled={!note.trim() || addNoteMutation.isPending}
                      variant="secondary"
                      className="w-full h-8 text-xs"
                      size="sm"
                    >
                      {addNoteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1" />
                      )}
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer - Next Lead Button */}
              {autoAdvance && (
                <div className="px-4 py-3 border-t bg-muted/30">
                  <Button
                    onClick={handleFinishAndGetNext}
                    className="w-full"
                    disabled={unlockLeadMutation.isPending || getNextLeadMutation.isPending}
                  >
                    {unlockLeadMutation.isPending || getNextLeadMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Suivant
                    <span className="ml-2 text-xs opacity-70">(⌘S)</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau RDV</DialogTitle>
            <DialogDescription>
              Planifier avec {standardData.firstName} {standardData.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Titre *</Label>
              <Input
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                placeholder="Ex: Rendez-vous découverte"
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bookingForm.meetingType === "PHYSICAL" ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setBookingForm({ ...bookingForm, meetingType: "PHYSICAL" })}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Physique
                </Button>
                <Button
                  type="button"
                  variant={bookingForm.meetingType === "ONLINE" ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setBookingForm({ ...bookingForm, meetingType: "ONLINE" })}
                >
                  <Video className="h-4 w-4 mr-2" />
                  En ligne
                </Button>
              </div>
            </div>

            {bookingForm.meetingType === "PHYSICAL" ? (
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Adresse *</Label>
                    <Select
                      value={selectedColumns.address || "none"}
                      onValueChange={(v) => handleColumnSelect("address", v)}
                    >
                      <SelectTrigger className="h-6 w-32 text-[10px]">
                        <Database className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Manuel</SelectItem>
                        {availableFields.map((f) => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={bookingForm.address}
                    onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                    placeholder="123 Rue Example"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Ville</Label>
                    <Input
                      value={bookingForm.city}
                      onChange={(e) => setBookingForm({ ...bookingForm, city: e.target.value })}
                      placeholder="Paris"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CP</Label>
                    <Input
                      value={bookingForm.postalCode}
                      onChange={(e) => setBookingForm({ ...bookingForm, postalCode: e.target.value })}
                      placeholder="75001"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <Label className="text-xs">Email pour invitation *</Label>
                <Input
                  type="email"
                  value={bookingForm.onlineMeetingEmail}
                  onChange={(e) => setBookingForm({ ...bookingForm, onlineMeetingEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="h-9"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Début *</Label>
                <Input
                  type="datetime-local"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin *</Label>
                <Input
                  type="datetime-local"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setBookingDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleCreateBooking}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
