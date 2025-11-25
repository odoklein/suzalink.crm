"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BDSelector } from "@/components/ui/bd-selector";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AccountAssignmentDialogProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountAssignmentDialog({
  accountId,
  open,
  onOpenChange,
}: AccountAssignmentDialogProps) {
  const [selectedBDs, setSelectedBDs] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["account-assignments", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}/assign`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch(`/api/accounts/${accountId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      if (!res.ok) throw new Error("Failed to assign BDs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-assignments", accountId] });
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      toast({
        title: "Success",
        description: "BDs assigned successfully",
      });
      onOpenChange(false);
      setSelectedBDs([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign BDs",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    assignMutation.mutate(selectedBDs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign BDs to Account</DialogTitle>
          <DialogDescription>
            Select business developers to assign to this account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select BDs</label>
            <BDSelector
              value={selectedBDs}
              onChange={setSelectedBDs}
              role="BD"
              placeholder="Select BDs..."
            />
          </div>

          {assignments.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Currently Assigned</label>
              <div className="flex flex-wrap gap-2">
                {assignments.map((assignment: any) => (
                  <Badge
                    key={assignment.user.id}
                    variant="secondary"
                    className="gap-1"
                  >
                    {assignment.user.avatar ? (
                      <img
                        src={assignment.user.avatar}
                        alt={assignment.user.email}
                        className="h-4 w-4 rounded-full"
                      />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {assignment.user.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

