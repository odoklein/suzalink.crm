"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Play, User, Phone, Mail, FileText, CheckCircle, Loader2, PhoneOff, Voicemail, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldValueDisplay } from "@/components/ui/field-value-display";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";
import { PanelRight } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  status: string;
  account: {
    companyName: string;
  };
};

export default function LeadWorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [note, setNote] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [leadDetailsDrawerOpen, setLeadDetailsDrawerOpen] = useState(false);

  // Fetch campaigns user has access to
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const getNextLeadMutation = useMutation({
    mutationFn: async (campaignId: string) => {
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
      setCurrentLead(lead);
      setIsSessionActive(true);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Aucun lead disponible",
        variant: "destructive",
      });
    },
  });

  const unlockLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`/api/leads/${leadId}/lock`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unlock lead");
      return res.json();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du déverrouillage du lead",
        variant: "destructive",
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", currentLead?.id] });
      toast({ title: "Succès", description: "Statut mis à jour" });
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
      setNote("");
      toast({ title: "Succès", description: "Note ajoutée" });
    },
  });

  const handleGetNextLead = () => {
    if (!selectedCampaignId) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sélectionner une campagne",
        variant: "destructive",
      });
      return;
    }
    getNextLeadMutation.mutate(selectedCampaignId);
  };

  const handleFinishAndGetNext = async () => {
    if (!currentLead) return;

    try {
      // Unlock current lead
      await unlockLeadMutation.mutateAsync(currentLead.id);
      
      // Reset current lead state
      setCurrentLead(null);
      setIsSessionActive(false);
      
      // Try to get next lead from same campaign
      if (selectedCampaignId) {
        getNextLeadMutation.mutate(selectedCampaignId);
      } else {
        toast({
          title: "Information",
          description: "Lead déverrouillé. Sélectionnez une campagne pour obtenir le prochain lead.",
        });
      }
    } catch (error) {
      // Error already handled by mutation onError
    }
  };

  const handleEmailClick = () => {
    if (!currentLead?.id) return;
    router.push(`/inbox/compose?leadId=${currentLead.id}`);
  };

  const standardData = currentLead?.standardData || {};
  const customData = currentLead?.customData || {};

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Espace de travail commercial</h1>
        <p className="text-body text-text-body mt-2">
          Obtenez le prochain lead et commencez à travailler
        </p>
      </div>

      {!isSessionActive ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-green-50/30 pointer-events-none" />
          <CardContent className="py-16 relative">
            <div className="max-w-md mx-auto text-center">
              <img
                src="/illustrations/empty-session.svg"
                alt=""
                className="mx-auto w-48 h-48 mb-6"
              />
              <h3 className="text-xl font-semibold text-text-main mb-2">Démarrer votre session</h3>
              <p className="text-sm text-text-body mb-8">
                Sélectionnez une campagne et cliquez sur le bouton ci-dessous pour obtenir votre prochain lead
              </p>
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="campaign-select" className="font-medium">Sélectionner une campagne</Label>
                  <Select
                    value={selectedCampaignId}
                    onValueChange={setSelectedCampaignId}
                    disabled={campaignsLoading}
                  >
                    <SelectTrigger id="campaign-select" className="h-12">
                      <SelectValue placeholder={campaignsLoading ? "Chargement des campagnes..." : "Choisir une campagne"} />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.length === 0 && !campaignsLoading ? (
                        <SelectItem value="none" disabled>
                          Aucune campagne disponible
                        </SelectItem>
                      ) : (
                        campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name} - {campaign.account.companyName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGetNextLead} 
                  size="lg" 
                  disabled={!selectedCampaignId || getNextLeadMutation.isPending}
                  className="w-full h-12 text-base transition-all duration-150 hover:scale-[1.01] hover:shadow-lg"
                >
                  {getNextLeadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Obtention du lead...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Obtenir le prochain lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary-50/30 to-transparent">
                <CardTitle className="text-text-main text-xl">
                  {standardData.firstName} {standardData.lastName}
                </CardTitle>
                <CardDescription className="text-text-body">{currentLead?.campaign?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-text-body">Email</Label>
                  <p className="text-body text-text-main">{standardData.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-text-body">Téléphone</Label>
                  <p className="text-body text-text-main">{standardData.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-text-body">Poste</Label>
                  <p className="text-body text-text-main">{standardData.jobTitle || "-"}</p>
                </div>
                {Object.keys(customData).length > 0 && currentLead?.campaign?.schemaConfig && (
                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm font-medium text-text-body mb-2 block">
                      Champs personnalisés
                    </Label>
                    {(currentLead.campaign.schemaConfig as any[]).map((field: any) => {
                      const value = customData[field.key];
                      if (value === null || value === undefined || value === "") return null;
                      return (
                        <div key={field.key} className="mb-3">
                          <Label className="text-xs font-medium text-text-body mb-1 block">
                            {field.label || field.key}
                          </Label>
                          <FieldValueDisplay field={field} value={value} />
                      </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-main flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    Actions
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLeadDetailsDrawerOpen(true)}
                    title="Voir les détails du lead"
                    className="hover:bg-primary-50"
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  {standardData.phone && (
                    <ClickToDial 
                      phoneNumber={standardData.phone} 
                      className="flex-1"
                    />
                  )}
                  {standardData.email && (
                    <Button 
                      variant="outline" 
                      className="flex-1 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                      onClick={handleEmailClick}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                  )}
                </div>

                {/* Quick Call Outcomes */}
                <div className="pt-4 border-t border-border">
                  <Label className="text-sm font-medium text-text-body mb-3 block">
                    Résultats d'appel rapides
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:bg-gray-50 hover:border-gray-300"
                      onClick={async () => {
                        await fetch("/api/activities", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            leadId: currentLead.id,
                            type: "CALL",
                            metadata: { outcome: "No Answer", note: "Call made - no answer" },
                          }),
                        });
                        toast({ title: "Enregistré", description: "Pas de réponse enregistrée" });
                      }}
                    >
                      <PhoneOff className="h-4 w-4 text-gray-500" />
                      Pas de réponse
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:bg-orange-50 hover:border-orange-200"
                      onClick={async () => {
                        await fetch("/api/activities", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            leadId: currentLead.id,
                            type: "CALL",
                            metadata: { outcome: "Voicemail", note: "Message vocal laissé" },
                          }),
                        });
                        toast({ title: "Enregistré", description: "Message vocal enregistré" });
                      }}
                    >
                      <Voicemail className="h-4 w-4 text-orange-500" />
                      Message vocal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:bg-green-50 hover:border-green-200"
                      onClick={async () => {
                        await Promise.all([
                          fetch("/api/activities", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              leadId: currentLead.id,
                              type: "CALL",
                              metadata: { outcome: "Interested", note: "A parlé - a montré de l'intérêt" },
                            }),
                          }),
                          updateStatusMutation.mutateAsync({ leadId: currentLead.id, status: "Contacted" })
                        ]);
                        toast({ title: "Succès", description: "Marqué comme intéressé" });
                      }}
                    >
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      Intéressé
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:bg-red-50 hover:border-red-200"
                      onClick={async () => {
                        await Promise.all([
                          fetch("/api/activities", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              leadId: currentLead.id,
                              type: "CALL",
                              metadata: { outcome: "Not a Fit", note: "A parlé - pas intéressé" },
                            }),
                          }),
                          updateStatusMutation.mutateAsync({ leadId: currentLead.id, status: "Lost" })
                        ]);
                        toast({ title: "Succès", description: "Marqué comme non adapté" });
                      }}
                    >
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      Non adapté
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mettre à jour le statut</Label>
                  <Select
                    value={currentLead?.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate({ leadId: currentLead.id, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contacted">Contacté</SelectItem>
                      <SelectItem value="Qualified">Qualifié</SelectItem>
                      <SelectItem value="Nurture">Nourri</SelectItem>
                      <SelectItem value="Lost">Perdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ajouter une note</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ajouter une note..."
                    rows={4}
                  />
                  <Button
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!note.trim()}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ajouter une note
                  </Button>
                </div>

                <Button
                  onClick={handleFinishAndGetNext}
                  variant="outline"
                  className="w-full mt-2 h-11 border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 transition-all"
                  disabled={unlockLeadMutation.isPending || getNextLeadMutation.isPending}
                >
                  {unlockLeadMutation.isPending || getNextLeadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      Terminer et obtenir le suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <LeadDetailsDrawer
        open={leadDetailsDrawerOpen}
        onOpenChange={setLeadDetailsDrawerOpen}
        leadId={currentLead?.id || null}
      />
    </div>
  );
}

