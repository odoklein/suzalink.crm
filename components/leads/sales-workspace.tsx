"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Play, Phone, Mail, FileText, Loader2 } from "lucide-react";
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
import { CompactLeadsList } from "@/components/leads/compact-leads-list";

type SalesWorkspaceProps = {
  campaignId: string;
};

export function SalesWorkspace({ campaignId }: SalesWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [note, setNote] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        title: "Error",
        description: error.message || "No available leads",
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
        title: "Error",
        description: error.message || "Failed to unlock lead",
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Success", description: "Status updated" });
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
      toast({ title: "Success", description: "Note added" });
    },
  });

  const handleGetNextLead = () => {
    getNextLeadMutation.mutate(campaignId);
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
      getNextLeadMutation.mutate(campaignId);
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
    <div className="space-y-6">
      {!isSessionActive ? (
        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto text-center">
              <Play className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
              <h3 className="text-h2 font-semibold text-text-main mb-2">Start Your Session</h3>
              <p className="text-body text-text-body mb-6">
                Click the button below to get your next lead from this campaign
              </p>
              <Button 
                onClick={handleGetNextLead} 
                size="lg" 
                disabled={getNextLeadMutation.isPending}
                className="w-full"
              >
                {getNextLeadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting lead...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Get Next Lead
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6 min-h-[600px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-text-main">
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
                  <Label className="text-sm font-medium text-text-body">Phone</Label>
                  <p className="text-body text-text-main">{standardData.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-text-body">Job Title</Label>
                  <p className="text-body text-text-main">{standardData.jobTitle || "-"}</p>
                </div>
                {Object.keys(customData).length > 0 && currentLead?.campaign?.schemaConfig && (
                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm font-medium text-text-body mb-2 block">
                      Custom Fields
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
            {/* Compact Leads Sidebar */}
            <CompactLeadsList
              campaignId={campaignId}
              currentLeadId={currentLead?.id}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-text-main text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      className="flex-1"
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
                    Quick Call Outcomes
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
                        queryClient.invalidateQueries({ queryKey: ["leads"] });
                        toast({ title: "Logged", description: "No answer recorded" });
                      }}
                    >
                      📞 No Answer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await fetch("/api/activities", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            leadId: currentLead.id,
                            type: "CALL",
                            metadata: { outcome: "Voicemail", note: "Left voicemail" },
                          }),
                        });
                        queryClient.invalidateQueries({ queryKey: ["leads"] });
                        toast({ title: "Logged", description: "Voicemail recorded" });
                      }}
                    >
                      🎙️ Voicemail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await Promise.all([
                          fetch("/api/activities", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              leadId: currentLead.id,
                              type: "CALL",
                              metadata: { outcome: "Interested", note: "Spoke - showed interest" },
                            }),
                          }),
                          updateStatusMutation.mutateAsync({ leadId: currentLead.id, status: "Contacted" })
                        ]);
                        queryClient.invalidateQueries({ queryKey: ["leads"] });
                        toast({ title: "Success", description: "Marked as interested" });
                      }}
                    >
                      ✅ Interested
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await Promise.all([
                          fetch("/api/activities", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              leadId: currentLead.id,
                              type: "CALL",
                              metadata: { outcome: "Not a Fit", note: "Spoke - not interested" },
                            }),
                          }),
                          updateStatusMutation.mutateAsync({ leadId: currentLead.id, status: "Lost" })
                        ]);
                        queryClient.invalidateQueries({ queryKey: ["leads"] });
                        toast({ title: "Success", description: "Marked as not a fit" });
                      }}
                    >
                      ❌ Not a Fit
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Update Status</Label>
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
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Locked">Locked</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Nurture">Nurture</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Add Note</Label>
                    <span className="text-xs text-text-body">
                      Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">N</kbd> to focus
                    </span>
                  </div>
                  <Textarea
                    ref={noteTextareaRef}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note... (Press Ctrl+S to save)"
                    rows={4}
                  />
                  <Button
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!note.trim()}
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>

                <Button
                  onClick={handleFinishAndGetNext}
                  variant="outline"
                  className="w-full"
                  disabled={unlockLeadMutation.isPending || getNextLeadMutation.isPending}
                >
                  {unlockLeadMutation.isPending || getNextLeadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Finish & Get Next
                      <span className="ml-2 text-xs text-text-body opacity-70">
                        (Ctrl+S)
                      </span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

