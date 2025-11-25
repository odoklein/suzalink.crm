"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Calendar, Loader2 } from "lucide-react";

type MeetingScheduleDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultLeadId?: string;
};

export function MeetingScheduleDrawer({
  open,
  onOpenChange,
  defaultDate,
  defaultLeadId,
}: MeetingScheduleDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newBooking, setNewBooking] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    meetingType: "meeting",
    leadId: defaultLeadId || "",
  });

  // Set default times when drawer opens
  useEffect(() => {
    if (open && defaultDate) {
      const startOfDay = new Date(defaultDate);
      startOfDay.setHours(9, 0, 0, 0);
      const endOfDay = new Date(defaultDate);
      endOfDay.setHours(10, 0, 0, 0);

      setNewBooking({
        ...newBooking,
        startTime: startOfDay.toISOString().slice(0, 16),
        endTime: endOfDay.toISOString().slice(0, 16),
      });
    }
  }, [open, defaultDate]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setNewBooking({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        meetingType: "meeting",
        leadId: defaultLeadId || "",
      });
    }
  }, [open, defaultLeadId]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onOpenChange(false);
      setNewBooking({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        meetingType: "meeting",
        leadId: defaultLeadId || "",
      });
      toast({ title: "Success", description: "Meeting scheduled" });
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Schedule Meeting
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Create a new meeting or appointment
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={newBooking.title}
              onChange={(e) =>
                setNewBooking({ ...newBooking, title: e.target.value })
              }
              placeholder="Meeting title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newBooking.description}
              onChange={(e) =>
                setNewBooking({ ...newBooking, description: e.target.value })
              }
              placeholder="Meeting description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={newBooking.startTime}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, startTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={newBooking.endTime}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, endTime: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={newBooking.location}
              onChange={(e) =>
                setNewBooking({ ...newBooking, location: e.target.value })
              }
              placeholder="Meeting location or link"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingType">Type</Label>
            <Select
              value={newBooking.meetingType}
              onValueChange={(value) =>
                setNewBooking({ ...newBooking, meetingType: value })
              }
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

          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Button
              onClick={() => createBookingMutation.mutate()}
              disabled={
                !newBooking.title ||
                !newBooking.startTime ||
                !newBooking.endTime ||
                createBookingMutation.isPending
              }
              className="w-full"
            >
              {createBookingMutation.isPending ? (
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
            <Button
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

