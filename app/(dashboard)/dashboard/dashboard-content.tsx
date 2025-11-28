"use client";

import { useSession } from "next-auth/react";
import { BDDashboard } from "@/components/dashboard/bd";
import { AdminDashboard } from "@/components/dashboard/admin";
import { Loader2 } from "lucide-react";

export function DashboardContent() {
  const { data: session, status } = useSession();

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Get user role
  const userRole = session?.user?.role;

  // Route to appropriate dashboard based on role
  if (userRole === "ADMIN" || userRole === "MANAGER") {
    return <AdminDashboard />;
  }

  // Default to BD dashboard for BD and DEVELOPER roles
  return <BDDashboard />;
}
