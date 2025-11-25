"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ScheduleMeetingDialogProps {
  leadId?: string;
  leadName?: string;
  trigger?: React.ReactNode;
}

export function ScheduleMeetingDialog({
  leadId,
  leadName,
  trigger,
}: ScheduleMeetingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Set default times (tomorrow at 10 AM for 1 hour)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const [formData, setFormData] = useState({
    title: leadName ? `Meeting with ${leadName}` : "",
    description: "",
    startTime: tomorrow.toISOString().slice(0, 16),
    endTime: tomorrowEnd.toISOString().slice(0, 16),
    location: "",
    meetingType: "meeting",
  });

  const scheduleBookingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          leadId: leadId || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to schedule meeting");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      }
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      // Reset form
      setFormData({
        title: leadName ? `Meeting with ${leadName}` : "",
        description: "",
        startTime: tomorrow.toISOString().slice(0, 16),
        endTime: tomorrowEnd.toISOString().slice(0, 16),
        location: "",
        meetingType: "meeting",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Title *</Label>
            <Input
              id="meeting-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Meeting title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-description">Description</Label>
            <Textarea
              id="meeting-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Meeting agenda or notes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-start">Start Time *</Label>
              <Input
                id="meeting-start"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-end">End Time *</Label>
              <Input
                id="meeting-end"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-location">Location / Link</Label>
            <Input
              id="meeting-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Meeting room, address, or video call link"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-type">Meeting Type</Label>
            <Select
              value={formData.meetingType}
              onValueChange={(value) => setFormData({ ...formData, meetingType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => scheduleBookingMutation.mutate()}
            disabled={
              !formData.title ||
              !formData.startTime ||
              !formData.endTime ||
              scheduleBookingMutation.isPending
            }
            className="w-full"
          >
            {scheduleBookingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}





