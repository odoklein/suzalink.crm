"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, use } from "react";
import { ArrowLeft, Mail, Reply, Loader2, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EmailMessage = {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  isOutbound?: boolean;
};

type EmailThread = {
  id: string;
  subject: string;
  fromEmail: string;
  toEmail: string;
  receivedAt: string;
  body: string;
  lead: {
    id: string;
    standardData: any;
  } | null;
  messages?: EmailMessage[];
};

export default function InboxThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const threadId = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [showReply, setShowReply] = useState(false);

  const { data: thread, isLoading } = useQuery<EmailThread>({
    queryKey: ["email-thread", threadId],
    queryFn: async () => {
      const res = await fetch(`/api/inbox/threads/${threadId}`);
      if (!res.ok) throw new Error("Failed to fetch thread");
      return res.json();
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: thread?.fromEmail,
          subject: `Re: ${thread?.subject}`,
          body: replyBody,
          leadId: thread?.lead?.id,
          threadId: threadId,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-thread", threadId] });
      setReplyBody("");
      setShowReply(false);
      toast({ title: "Success", description: "Reply sent successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
            <p className="text-body text-muted-foreground">Loading thread...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
            <p className="text-body text-text-body mb-4">Thread not found</p>
            <Button onClick={() => router.push("/inbox")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inbox
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combine main thread message with replies
  const allMessages: EmailMessage[] = [
    {
      id: thread.id,
      fromEmail: thread.fromEmail,
      toEmail: thread.toEmail,
      subject: thread.subject,
      body: thread.body,
      receivedAt: thread.receivedAt,
      isOutbound: false,
    },
    ...(thread.messages || []),
  ].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/inbox")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">
              {thread.subject}
            </h1>
            {thread.lead && (
              <Link
                href={`/leads/${thread.lead.id}`}
                className="text-body text-primary-500 hover:underline mt-1 inline-flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                {thread.lead.standardData?.firstName} {thread.lead.standardData?.lastName}
              </Link>
            )}
          </div>
        </div>
        <Button onClick={() => setShowReply(!showReply)}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </Button>
      </div>

      <div className="space-y-4">
        {/* Email Messages */}
        {allMessages.map((message, index) => (
          <Card key={message.id || index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-text-main">{message.fromEmail}</p>
                    {message.isOutbound && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-md font-medium">
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-body">to {message.toEmail}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-body">
                  <Calendar className="h-4 w-4" />
                  {new Date(message.receivedAt).toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div
                  className="whitespace-pre-wrap text-text-main"
                  dangerouslySetInnerHTML={{
                    __html: message.body.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Reply Form */}
        {showReply && (
          <Card className="border-2 border-primary-500">
            <CardHeader>
              <CardTitle className="text-text-main">Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>To</Label>
                <p className="text-body text-text-main">{thread.fromEmail}</p>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <p className="text-body text-text-main">Re: {thread.subject}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-body">Message</Label>
                <Textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your reply..."
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => sendReplyMutation.mutate()}
                  disabled={!replyBody.trim() || sendReplyMutation.isPending}
                >
                  {sendReplyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReply(false);
                    setReplyBody("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
