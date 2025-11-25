"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Play, Pause, Trash2, Mail, Clock } from "lucide-react";
import type { EmailSequence } from "@/lib/email-templates";

type SequenceDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: EmailSequence | null;
  onEdit?: (sequence: EmailSequence) => void;
  onDelete?: (sequenceId: string) => void;
};

export function SequenceDetailsDrawer({
  open,
  onOpenChange,
  sequence,
  onEdit,
  onDelete,
}: SequenceDetailsDrawerProps) {
  if (!sequence) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                {sequence.name}
              </SheetTitle>
              <SheetDescription className="text-body text-text-body mt-2">
                Email sequence details and steps
              </SheetDescription>
            </div>
            <Badge variant={sequence.isActive ? "default" : "secondary"}>
              {sequence.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sequence Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {sequence.description && (
                <div>
                  <Label className="text-sm font-medium text-text-body mb-1 block">
                    Description
                  </Label>
                  <p className="text-body text-text-main">
                    {sequence.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-text-body mb-1 block">
                    Steps
                  </Label>
                  <p className="text-body font-semibold text-text-main">
                    {sequence.steps.length}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-text-body mb-1 block">
                    Trigger
                  </Label>
                  <p className="text-body text-text-main">
                    {sequence.trigger?.type?.replace('_', ' ') || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-text-body mb-1 block">
                    Status
                  </Label>
                  <Badge variant={sequence.isActive ? "default" : "secondary"}>
                    {sequence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sequence Steps */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-semibold text-text-main mb-4 block">
                Sequence Steps
              </Label>
              <div className="space-y-4">
                {sequence.steps.length === 0 ? (
                  <p className="text-body text-text-body text-center py-4">
                    No steps configured
                  </p>
                ) : (
                  sequence.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-text-body" />
                          <span className="font-medium text-text-main">
                            {step.templateName || `Step ${index + 1}`}
                          </span>
                        </div>
                        {step.delayDays !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-text-body">
                            <Clock className="h-3 w-3" />
                            <span>Delay: {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            {onEdit && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onEdit(sequence);
                  onOpenChange(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Sequence
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start"
                disabled={sequence.isActive}
              >
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-start"
                disabled={!sequence.isActive}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this sequence?")) {
                    onDelete(sequence.id);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Sequence
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

