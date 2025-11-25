import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // For BD users, verify they have access to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Access denied to this campaign" },
          { status: 403 }
        );
      }
    }

    // Use smart prioritization with lead scoring
    // First, try to get high-priority leads (score > 70) or recently touched leads
    const result = await prisma.$queryRaw<Array<{
      id: string;
      campaign_id: string;
      status: string;
      standard_data: any;
      custom_data: any;
      locked_at: Date | null;
      locked_by_user_id: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT * FROM leads
      WHERE campaign_id = ${campaignId}
        AND status = 'New'
        AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '30 minutes')
      ORDER BY 
        -- Prioritize leads with high scores (if available in customData)
        CASE 
          WHEN custom_data->>'leadScore' IS NOT NULL 
          THEN CAST(custom_data->>'leadScore' AS INTEGER)
          ELSE 0 
        END DESC,
        -- Then prioritize leads with recent updates (potential warm leads)
        updated_at DESC,
        -- Finally, oldest leads first (FIFO for equal priority)
        created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "No available leads" },
        { status: 404 }
      );
    }

    const lead = result[0];

    // Lock the lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lockedAt: new Date(),
        lockedByUserId: session.user.id,
        status: "Locked",
      },
    });

    // Fetch full lead with relations
    const fullLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        campaign: {
          include: {
            account: true,
          },
        },
        assignedBD: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(fullLead);
  } catch (error) {
    console.error("Error getting next lead:", error);
    return NextResponse.json(
      { error: "Failed to get next lead" },
      { status: 500 }
    );
  }
}

