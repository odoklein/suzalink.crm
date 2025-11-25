import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
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
        activities: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // For BD users, verify they have access to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: lead.campaignId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Access denied to this lead" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // First, fetch the lead to check campaign access
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { campaignId: true },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // For BD users, verify they have access to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: existingLead.campaignId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Access denied to this lead" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { status, standardData, customData, assignedBdId } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (standardData) updateData.standardData = standardData;
    if (customData !== undefined) updateData.customData = customData;
    if (assignedBdId !== undefined) updateData.assignedBdId = assignedBdId;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    // Log status change if status was updated
    if (status) {
      await prisma.activityLog.create({
        data: {
          leadId: id,
          userId: session.user.id,
          type: "STATUS_CHANGE",
          metadata: {
            oldStatus: lead.status,
            newStatus: status,
          },
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

