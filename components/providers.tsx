"use client";

import { QueryClient, QueryClientProvider, HydrationBoundary, DehydratedState } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

export function Providers({ 
  children,
  dehydratedState,
}: { 
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {dehydratedState ? (
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        ) : (
          children
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Query key factory for consistent key management and better caching
export const queryKeys = {
  // Campaign configuration - longer cache, rarely changes
  campaignStatuses: (campaignId: string) => ['campaign-statuses', campaignId] as const,
  campaignMeetingTypes: (campaignId: string) => ['campaign-meeting-types', campaignId] as const,
  campaignVisitDays: (campaignId: string, startDate?: string, endDate?: string) => 
    ['campaign-visit-days', campaignId, startDate, endDate] as const,
  
  // Weekly planning
  weeklyPlanning: (weekStart: string) => ['weekly-planning', weekStart] as const,
  
  // Bookings
  bookings: (filters?: Record<string, any>) => ['bookings', filters] as const,
  leadBookings: (leadId: string) => ['lead-bookings', leadId] as const,
  
  // Leads
  leads: (filters?: Record<string, any>) => ['leads', filters] as const,
  lead: (id: string) => ['lead', id] as const,
  nextLead: (campaignId: string) => ['next-lead', campaignId] as const,
  
  // Activities
  leadActivities: (leadId: string) => ['lead-activities', leadId] as const,
  
  // Contact portal
  contactBookings: () => ['contact-bookings'] as const,
  contactPortalSession: () => ['contact-portal-session'] as const,
};

// Stale times for different data types (in milliseconds)
export const staleTimeConfig = {
  // Configuration data - changes rarely
  campaignConfig: 5 * 60 * 1000, // 5 minutes
  
  // Real-time data - needs frequent updates
  bookings: 30 * 1000, // 30 seconds
  leads: 60 * 1000, // 1 minute
  
  // Weekly planning - changes during planning sessions
  planning: 2 * 60 * 1000, // 2 minutes
  
  // User session/auth
  session: 5 * 60 * 1000, // 5 minutes
};
