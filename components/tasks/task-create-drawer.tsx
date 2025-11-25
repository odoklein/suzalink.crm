"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskDialog } from "./task-dialog";

type TaskCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
};

export function TaskCreateDrawer({
  open,
  onOpenChange,
  projectId,
}: TaskCreateDrawerProps) {
  return (
    <TaskDialog
      open={open}
      onOpenChange={onOpenChange}
      projectId={projectId}
    />
  );
}

