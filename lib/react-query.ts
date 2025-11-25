import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// Create a QueryClient factory that can be used in server components
// Using React's cache() to ensure we get the same instance per request
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
});

