import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { getLead } from "@/lib/queries";
import { LeadDetailContent } from "./lead-detail-content";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id: leadId } = await params;
  const queryClient = getQueryClient();

  // Prefetch lead data on the server
  const lead = await queryClient.fetchQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLead(leadId),
  });

  if (!lead) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LeadDetailContent leadId={leadId} initialLead={lead} />
    </HydrationBoundary>
  );
}

