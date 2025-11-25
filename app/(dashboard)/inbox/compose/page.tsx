"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ComposeEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [leadId, setLeadId] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get leadId, replyTo, and subject from query params
  const queryLeadId = searchParams.get("leadId");
  const queryReplyTo = searchParams.get("replyTo");
  const querySubject = searchParams.get("subject");

  // Fetch lead details if leadId is provided
  const { data: lead } = useQuery({
    queryKey: ["lead", queryLeadId],
    queryFn: async () => {
      if (!queryLeadId) return null;
      const res = await fetch(`/api/leads/${queryLeadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!queryLeadId,
  });

  // Auto-populate email when lead is loaded or replyTo/subject are provided
  useEffect(() => {
    if (lead && queryLeadId) {
      setLeadId(queryLeadId);
      const email = lead.standardData?.email;
      if (email) {
        setTo(email);
      }
    } else if (queryReplyTo) {
      setTo(queryReplyTo);
    }
    if (querySubject) {
      setSubject(querySubject);
    }
  }, [lead, queryLeadId, queryReplyTo, querySubject]);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads?limit=100");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      return data.leads || [];
    },
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
      router.push("/inbox");
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
    const lead = leads.find((l: any) => l.id === selectedLeadId);
    if (lead) {
      setTo(lead.standardData?.email || "");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/inbox">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">Compose Email</h1>
          <p className="text-body text-muted-foreground mt-2">Send an email to a lead</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? "Sending..." : "Send Email"}
            </Button>
            <Link href="/inbox">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

