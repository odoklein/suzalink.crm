import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateLeadScores, calculateLeadScoreFromDatabase } from "@/lib/lead-scoring";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId, leadId } = await request.json();

    if (leadId) {
      // Score a specific lead
      const score = await calculateLeadScoreFromDatabase(leadId);
      return NextResponse.json({ leadId, score });
    } else {
      // Score all leads or leads in a specific campaign
      await updateLeadScores(campaignId);
      return NextResponse.json({ 
        message: campaignId 
          ? `Updated scores for campaign ${campaignId}` 
          : "Updated scores for all leads" 
      });
    }
  } catch (error) {
    console.error("Lead scoring error:", error);
    return NextResponse.json(
      { error: "Failed to calculate lead scores" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const score = await calculateLeadScoreFromDatabase(leadId);
    return NextResponse.json({ leadId, score });

  } catch (error) {
    console.error("Lead scoring error:", error);
    return NextResponse.json(
      { error: "Failed to get lead score" },
      { status: 500 }
    );
  }
}





