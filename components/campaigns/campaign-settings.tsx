"use client";

// This component is now deprecated in favor of CampaignSettingsDrawer
// Keeping it for backwards compatibility but redirecting to open the drawer

import { useSession } from "next-auth/react";

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

type CampaignSettingsProps = {
  campaign: Campaign;
  assignments: Assignment[];
};

export function CampaignSettings({ campaign, assignments }: CampaignSettingsProps) {
  const { data: session } = useSession();
  const canConfigure = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  if (!canConfigure) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Vous n'avez pas accès à cette section</p>
      </div>
    );
  }

  // The settings are now shown in a drawer, triggered from the tab click
  // This component just displays a placeholder message
  return (
    <div className="flex items-center justify-center h-64 text-center">
      <div>
        <p className="text-muted-foreground">Les paramètres s'ouvrent dans un panneau latéral.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Cliquez sur l'onglet Settings pour l'ouvrir.</p>
      </div>
    </div>
  );
}
