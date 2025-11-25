import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { getDashboardStats } from "@/lib/queries";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const queryClient = getQueryClient();

  // Prefetch dashboard stats on the server
  await queryClient.prefetchQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}

