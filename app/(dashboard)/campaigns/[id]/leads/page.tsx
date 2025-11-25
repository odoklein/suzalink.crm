import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { getCampaign, getLeads } from "@/lib/queries";
import { CampaignLeadsContent } from "./campaign-leads-content";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CampaignLeadsPage({ params }: Props) {
  const { id: campaignId } = await params;
  const queryClient = getQueryClient();

  // Prefetch campaign and initial leads page
  const [campaign] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ["campaign", campaignId],
      queryFn: () => getCampaign(campaignId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["leads", campaignId, 1, "all"],
      queryFn: () => getLeads({ campaignId, page: 1, limit: 50 }),
    }),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CampaignLeadsContent campaign={campaign} campaignId={campaignId} />
    </HydrationBoundary>
  );
}
