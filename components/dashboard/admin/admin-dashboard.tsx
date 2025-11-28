"use client";

import { useSession } from "next-auth/react";
import { AdminKpiWidgets } from "@/components/admin/admin-kpi-widgets";

export function AdminDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.email?.split("@")[0] || "Admin";

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {userName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Admin KPI Widgets */}
      <AdminKpiWidgets />
    </div>
  );
}
