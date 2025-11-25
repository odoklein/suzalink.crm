"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

type EmailComposeDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLeadId?: string;
  defaultTo?: string;
  defaultSubject?: string;
};

export function EmailComposeDrawer({
  open,
  onOpenChange,
  defaultLeadId,
  defaultTo,
  defaultSubject,
}: EmailComposeDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [leadId, setLeadId] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch lead details if defaultLeadId is provided
  const { data: lead } = useQuery({
    queryKey: ["lead", defaultLeadId],
    queryFn: async () => {
      if (!defaultLeadId) return null;
      const res = await fetch(`/api/leads/${defaultLeadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!defaultLeadId && open,
  });

  // Auto-populate email when drawer opens
  useEffect(() => {
    if (open) {
      if (lead && defaultLeadId) {
        setLeadId(defaultLeadId);
        const email = lead.standardData?.email;
        if (email) {
          setTo(email);
        }
      } else if (defaultTo) {
        setTo(defaultTo);
      }
      if (defaultSubject) {
        setSubject(defaultSubject);
      }
    } else {
      // Reset form when drawer closes
      setTo("");
      setSubject("");
      setBody("");
      setLeadId("");
    }
  }, [open, lead, defaultLeadId, defaultTo, defaultSubject]);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads?limit=100");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      return data.leads || [];
    },
    enabled: open,
  });

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          leadId: leadId || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send email");
      }

      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      onOpenChange(false);
      // Reset form
      setTo("");
      setSubject("");
      setBody("");
      setLeadId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadSelect = (selectedLeadId: string) => {
    setLeadId(selectedLeadId);
    const selectedLead = leads.find((l: any) => l.id === selectedLeadId);
    if (selectedLead) {
      setTo(selectedLead.standardData?.email || "");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Compose Email
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Send an email to a lead or contact
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Link to Lead (Optional)</Label>
            <Select value={leadId} onValueChange={handleLeadSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead: any) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.standardData?.firstName} {lead.standardData?.lastName} -{" "}
                    {lead.standardData?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your message..."
              rows={10}
            />
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Button onClick={handleSend} disabled={isSending} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

