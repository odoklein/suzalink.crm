"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Phone,
  Mail,
  Calendar,
  Building2,
  FileText,
  Clock,
  X,
  Loader2,
  Plus,
  Video,
  MapPin,
  AtSign,
  Briefcase,
  Hash,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  Database,
} from "lucide-react";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  status: string;
  statusId?: string;
  statusConfig?: { id: string; name: string; color: string };
  standardData: any;
  customData: any;
  campaign?: {
    id: string;
    name: string;
    schemaConfig: any;
  };
  activities?: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata: any;
    user?: { email: string };
  }>;
};

type LeadDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
};

// Notion-style inline editable field
function InlineField({
  icon: Icon,
  label,
  value,
  onSave,
  type = "text",
  placeholder,
}: {
  icon?: any;
  label: string;
  value: string | number | null | undefined;
  onSave: (value: string) => void;
  type?: "text" | "email" | "tel" | "number";
  placeholder?: string;
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

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors cursor-text",
        "hover:bg-muted/60",
        isEditing && "bg-muted/60"
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setEditValue(String(value || "")); setIsEditing(false); }
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
          placeholder={placeholder || `Ajouter ${label.toLowerCase()}`}
        />
      ) : (
        <span className={cn("flex-1 text-sm truncate", value ? "text-foreground" : "text-muted-foreground/50")}>
          {value || `Ajouter ${label.toLowerCase()}`}
        </span>
      )}
    </div>
  );
}

// Status badge
function StatusBadge({ status, color }: { status: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color ? `${color}20` : undefined, color: color || "#6B7280" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color || "#6B7280" }} />
      {status}
    </span>
  );
}

export function LeadDetailsDrawer({ open, onOpenChange, leadId }: LeadDetailsDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: "", startTime: "", endTime: "", description: "",
    meetingType: "PHYSICAL" as "PHYSICAL" | "ONLINE",
    address: "", city: "", postalCode: "", onlineMeetingEmail: "",
  });
  const [selectedColumns, setSelectedColumns] = useState({ address: "", city: "", postalCode: "" });
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!leadId && open,
  });

  // Fetch campaign statuses
  const { data: campaignStatuses = [] } = useQuery({
    queryKey: ["campaign-statuses", lead?.campaign?.id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${lead?.campaign?.id}/statuses`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!lead?.campaign?.id && open,
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["lead-bookings", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const res = await fetch(`/api/bookings?leadId=${leadId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!leadId && open,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const updateLeadFieldMutation = useMutation({
    mutationFn: async ({ field, value, isCustom }: { field: string; value: any; isCustom: boolean }) => {
      if (!lead) throw new Error("No lead");
      const updateData: any = {};
      if (isCustom) {
        updateData.customData = { ...(lead.customData || {}), [field]: value };
      } else {
        updateData.standardData = { ...(lead.standardData || {}), [field]: value };
      }
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, type: "NOTE", metadata: { note } }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      setNote("");
      toast({ title: "Note ajoutée" });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
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
      queryClient.invalidateQueries({ queryKey: ["lead-bookings", leadId] });
      setBookingDialogOpen(false);
      setBookingForm({ title: "", startTime: "", endTime: "", description: "", meetingType: "PHYSICAL", address: "", city: "", postalCode: "", onlineMeetingEmail: "" });
      toast({ title: "RDV créé" });
    },
  });

  const standardData = lead?.standardData || {};
  const customData = lead?.customData || {};
  const schemaConfig = lead?.campaign?.schemaConfig || [];
  const activities = lead?.activities || [];

  const currentStatus = campaignStatuses.find((s: any) => s.id === lead?.statusId || s.id === lead?.statusConfig?.id);

  // Available fields for column selection
  const availableFields = useMemo(() => {
    const fields: Array<{ key: string; label: string; value: any }> = [];
    Object.entries(standardData).forEach(([key, value]) => {
      if (value) fields.push({ key: `standard.${key}`, label: key, value });
    });
    schemaConfig.forEach((field: any) => {
      const value = customData[field.key];
      if (value) fields.push({ key: `custom.${field.key}`, label: field.label || field.key, value });
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

  if (!leadId) return null;

  return (
    <TooltipProvider>
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[440px] p-0 border-l shadow-2xl overflow-hidden flex flex-col">
        {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : lead ? (
          <>
              {/* Header */}
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base truncate">
                    {`${standardData.firstName || ""} ${standardData.lastName || ""}`.trim() || "Lead"}
                  </h2>
                  <span className="text-xs text-muted-foreground">{lead.campaign?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                  <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                    onClick={() => {
                          router.push(`/leads/${leadId}`);
                      onOpenChange(false);
                    }}
                  >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ouvrir la page complète</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Status */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Statut</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="outline-none">
                          <StatusBadge status={currentStatus?.name || lead.status || "Nouveau"} color={currentStatus?.color} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {campaignStatuses.map((status: any) => (
                          <DropdownMenuItem
                            key={status.id}
                            onClick={() => updateStatusMutation.mutate({ leadId: lead.id, status: status.id })}
                          >
                            <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: status.color }} />
                            {status.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="px-4 py-3 border-b space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
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
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Données</p>
                    {schemaConfig.map((field: any) => (
                      <InlineField
                        key={field.key}
                        icon={Hash}
                        label={field.label || field.key}
                        value={customData[field.key]}
                        onSave={(v) => updateLeadFieldMutation.mutate({ field: field.key, value: v, isCustom: true })}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
                  <div className="flex gap-2">
                    {standardData.phone && <ClickToDial phoneNumber={standardData.phone} className="flex-1 h-9" />}
                    {standardData.email && (
                      <Button
                        variant="outline"
                        className="flex-1 h-9"
                        onClick={() => { router.push(`/inbox/compose?leadId=${leadId}`); onOpenChange(false); }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </Button>
                    )}
                  </div>
                    </div>

                {/* Bookings */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rendez-vous</p>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setBookingDialogOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Nouveau
                    </Button>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Aucun RDV</p>
                  ) : (
                    <div className="space-y-2">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div key={booking.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {booking.meetingType === "ONLINE" ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{booking.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(booking.startTime), "d MMM à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {booking.approvalStatus === "on_hold" ? "En attente" : booking.approvalStatus === "approved" ? "Confirmé" : booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                  {activities.filter((a) => a.type === "NOTE").length > 0 && (
                    <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                      {activities.filter((a) => a.type === "NOTE").slice(0, 3).map((activity) => (
                        <div key={activity.id} className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs line-clamp-2">{activity.metadata?.note}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(activity.createdAt), "d MMM HH:mm", { locale: fr })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Textarea
                      ref={noteRef}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ajouter une note..."
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
                      {addNoteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Lead non trouvé</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau RDV</DialogTitle>
            <DialogDescription>Planifier avec {standardData.firstName} {standardData.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Titre *</Label>
              <Input value={bookingForm.title} onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })} placeholder="Ex: Rendez-vous découverte" className="h-9" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={bookingForm.meetingType === "PHYSICAL" ? "default" : "outline"} className="h-9" onClick={() => setBookingForm({ ...bookingForm, meetingType: "PHYSICAL" })}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Physique
                </Button>
                <Button type="button" variant={bookingForm.meetingType === "ONLINE" ? "default" : "outline"} className="h-9" onClick={() => setBookingForm({ ...bookingForm, meetingType: "ONLINE" })}>
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
                    <Select value={selectedColumns.address || "none"} onValueChange={(v) => handleColumnSelect("address", v)}>
                      <SelectTrigger className="h-6 w-32 text-[10px]">
                        <Database className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Manuel</SelectItem>
                        {availableFields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input value={bookingForm.address} onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })} placeholder="123 Rue Example" className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Ville</Label>
                      <Select value={selectedColumns.city || "none"} onValueChange={(v) => handleColumnSelect("city", v)}>
                        <SelectTrigger className="h-5 w-20 text-[9px] px-1">
                          <SelectValue placeholder="Col" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Manuel</SelectItem>
                          {availableFields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={bookingForm.city} onChange={(e) => setBookingForm({ ...bookingForm, city: e.target.value })} placeholder="Paris" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">CP</Label>
                      <Select value={selectedColumns.postalCode || "none"} onValueChange={(v) => handleColumnSelect("postalCode", v)}>
                        <SelectTrigger className="h-5 w-20 text-[9px] px-1">
                          <SelectValue placeholder="Col" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Manuel</SelectItem>
                          {availableFields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={bookingForm.postalCode} onChange={(e) => setBookingForm({ ...bookingForm, postalCode: e.target.value })} placeholder="75001" className="h-9" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <Label className="text-xs">Email pour invitation *</Label>
                <Input type="email" value={bookingForm.onlineMeetingEmail} onChange={(e) => setBookingForm({ ...bookingForm, onlineMeetingEmail: e.target.value })} placeholder="contact@example.com" className="h-9" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Début *</Label>
                <Input type="datetime-local" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin *</Label>
                <Input type="datetime-local" value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} className="h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={bookingForm.description} onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })} placeholder="Informations complémentaires..." rows={2} className="resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setBookingDialogOpen(false)}>Annuler</Button>
              <Button className="flex-1" onClick={() => createBookingMutation.mutate(bookingForm)} disabled={createBookingMutation.isPending || !bookingForm.title || !bookingForm.startTime || !bookingForm.endTime}>
                {createBookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
