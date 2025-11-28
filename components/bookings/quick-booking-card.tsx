"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, User, Mail, Phone } from "lucide-react";

type QuickBookingCardProps = {
  leadId: string;
  leadData?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
};

export function QuickBookingCard({ leadId, leadData }: QuickBookingCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [formData, setFormData] = useState({
    contactName: leadData?.name || "",
    contactEmail: leadData?.email || "",
    contactPhone: leadData?.phone || "",
    address: leadData?.address || "",
    postalCode: leadData?.postalCode || "",
    city: leadData?.city || "",
    startTime: "",
    notes: "",
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          title: `RDV - ${data.contactName}`,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(new Date(data.startTime).getTime() + 60 * 60 * 1000).toISOString(),
          description: data.notes,
          meetingType: "meeting",
          status: "scheduled",
        }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({ title: "RDV créé", description: "Le rendez-vous a été enregistré avec succès" });
      setIsExpanded(false);
      setFormData({ ...formData, startTime: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le RDV", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName || !formData.startTime) {
      toast({ title: "Champs requis", description: "Nom et date/heure sont obligatoires", variant: "destructive" });
      return;
    }
    bookingMutation.mutate(formData);
  };

  if (!isExpanded) {
    return (
      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
        <CardContent className="pt-6">
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Créer un RDV
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Nouveau Rendez-vous
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="contactName" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Nom du contact *
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Dr. Martin Dupont"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contactEmail" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="contactPhone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Téléphone
              </Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Adresse
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue de la République"
              />
            </div>
            
            <div>
              <Label htmlFor="postalCode">Code Postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="06000"
              />
            </div>
            
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Nice"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="startTime">Date et heure *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={bookingMutation.isPending}
              className="flex-1"
            >
              {bookingMutation.isPending ? "Création..." : "Créer le RDV"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpanded(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
