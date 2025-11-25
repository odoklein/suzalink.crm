"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  User,
  Building2,
} from "lucide-react";
import { ClickToDial } from "@/components/aircall/click-to-dial";
import { ScheduleMeetingDialog } from "@/components/bookings/schedule-meeting-dialog";

type LeadQuickActionsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  phone?: string;
  email?: string;
  campaignId?: string;
};

export function LeadQuickActionsDrawer({
  open,
  onOpenChange,
  leadId,
  leadName,
  phone,
  email,
  campaignId,
}: LeadQuickActionsDrawerProps) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
            Quick Actions
          </SheetTitle>
          <SheetDescription className="text-body text-text-body mt-2">
            Quick access to actions for {leadName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Communication Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-text-main mb-3">
                Communication
              </h3>
              {phone && (
                <ClickToDial phoneNumber={phone} className="w-full" />
              )}
              {email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/inbox/compose?leadId=${leadId}`);
                    onOpenChange(false);
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              )}
              <ScheduleMeetingDialog
                leadId={leadId}
                leadName={leadName}
              />
            </CardContent>
          </Card>

          {/* Navigation Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-text-main mb-3">
                Navigation
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  router.push(`/leads/${leadId}`);
                  onOpenChange(false);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                View Full Lead Details
              </Button>
              {campaignId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(`/campaigns/${campaignId}`);
                    onOpenChange(false);
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  View Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

