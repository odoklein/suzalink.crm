"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CampaignSettings } from "./campaign-settings";

type Campaign = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  schemaConfig: any;
  account: {
    id: string;
    companyName: string;
  };
  _count: {
    leads: number;
  };
};

type Assignment = {
  user: {
    id: string;
    email: string;
    avatar?: string | null;
  };
  assignedAt: string;
};

type CampaignSettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  assignments: Assignment[];
};

export function CampaignSettingsDrawer({
  open,
  onOpenChange,
  campaign,
  assignments,
}: CampaignSettingsDrawerProps) {
  if (!campaign) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Campaign Settings
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Manage campaign settings and assignments
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <CampaignSettings campaign={campaign} assignments={assignments} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

