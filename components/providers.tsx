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
            gcTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Refetch on mount if data is stale
            refetchOnReconnect: true, // Refetch on reconnect
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
          mutations: {
            retry: 1, // Retry mutations once
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

