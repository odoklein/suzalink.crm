"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LeadDetailsDrawer } from "@/components/leads/lead-details-drawer";
import { CampaignQuickViewDrawer } from "@/components/campaigns/campaign-quick-view-drawer";

type SearchResultDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: "leads" | "campaigns" | "accounts";
  itemId: string | null;
  onEdit?: (id: string) => void;
};

export function SearchResultDetailsDrawer({
  open,
  onOpenChange,
  entity,
  itemId,
  onEdit,
}: SearchResultDetailsDrawerProps) {
  if (entity === "leads" && itemId) {
    return (
      <LeadDetailsDrawer
        open={open}
        onOpenChange={onOpenChange}
        leadId={itemId}
      />
    );
  }

  if (entity === "campaigns" && itemId) {
    return (
      <CampaignQuickViewDrawer
        open={open}
        onOpenChange={onOpenChange}
        campaignId={itemId}
        onEdit={onEdit}
      />
    );
  }

  // Accounts are excluded per requirements
  return null;
}

