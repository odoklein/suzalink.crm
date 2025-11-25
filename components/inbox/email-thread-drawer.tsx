"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Reply,
  Loader2,
  User,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

type EmailThreadDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string | null;
};

export function EmailThreadDrawer({
  open,
  onOpenChange,
  threadId,
}: EmailThreadDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [showReply, setShowReply] = useState(false);

  const { data: thread, isLoading } = useQuery<EmailThread>({
    queryKey: ["email-thread", threadId],
    queryFn: async () => {
      if (!threadId) return null;
      const res = await fetch(`/api/inbox/threads/${threadId}`);
      if (!res.ok) throw new Error("Failed to fetch thread");
      return res.json();
    },
    enabled: !!threadId && open,
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
      queryClient.invalidateQueries({ queryKey: ["email-threads"] });
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

  if (!threadId) return null;

  // Combine main thread message with replies
  const allMessages: EmailMessage[] = thread
    ? [
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
      ].sort(
        (a, b) =>
          new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
      )
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : thread ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                    {thread.subject}
                  </SheetTitle>
                  <SheetDescription className="text-body text-text-body mt-2">
                    {thread.fromEmail} → {thread.toEmail}
                  </SheetDescription>
                  {thread.lead && (
                    <Link
                      href={`/leads/${thread.lead.id}`}
                      className="text-body text-primary-500 hover:underline mt-2 inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <User className="h-4 w-4" />
                      {thread.lead.standardData?.firstName}{" "}
                      {thread.lead.standardData?.lastName}
                    </Link>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowReply(!showReply)}
                >
                  <Reply className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {/* Email Messages */}
              {allMessages.map((message, index) => (
                <Card key={message.id || index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-text-main">
                            {message.fromEmail}
                          </p>
                          {message.isOutbound && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-md font-medium">
                              Sent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-body">
                          to {message.toEmail}
                        </p>
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
                      <p className="text-body text-text-main">
                        {thread.fromEmail}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <p className="text-body text-text-main">
                        Re: {thread.subject}
                      </p>
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
                        disabled={
                          !replyBody.trim() || sendReplyMutation.isPending
                        }
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
          </>
        ) : (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
            <p className="text-body text-text-body mb-4">Thread not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

