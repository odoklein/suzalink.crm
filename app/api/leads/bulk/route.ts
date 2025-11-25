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
    const { leadIds, action, data } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "leadIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    // Verify all leads belong to campaigns the user has access to
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
      },
      include: {
        campaign: {
          include: {
            account: true,
          },
        },
      },
    });

    if (leads.length !== leadIds.length) {
      return NextResponse.json(
        { error: "Some leads not found" },
        { status: 404 }
      );
    }

    // For BD users, verify they have access to all campaigns
    if (session.user.role === "BD") {
      const campaignIds = [...new Set(leads.map((lead) => lead.campaignId))];
      const assignments = await prisma.campaignAssignment.findMany({
        where: {
          userId: session.user.id,
          campaignId: { in: campaignIds },
        },
        select: { campaignId: true },
      });

      const assignedCampaignIds = new Set(assignments.map((a) => a.campaignId));
      const hasAccessToAll = campaignIds.every((id) => assignedCampaignIds.has(id));

      if (!hasAccessToAll) {
        return NextResponse.json(
          { error: "Access denied to one or more leads" },
          { status: 403 }
        );
      }
    }

    let result;

    switch (action) {
      case "updateStatus":
        if (!data?.status) {
          return NextResponse.json(
            { error: "status is required for updateStatus action" },
            { status: 400 }
          );
        }

        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { status: data.status },
        });

        // Log activity for each lead
        await Promise.all(
          leads.map((lead) =>
            prisma.activityLog.create({
              data: {
                leadId: lead.id,
                userId: session.user.id,
                type: "STATUS_CHANGE",
                metadata: {
                  oldStatus: lead.status,
                  newStatus: data.status,
                  bulkUpdate: true,
                },
              },
            })
          )
        );

        return NextResponse.json({
          message: `Updated ${result.count} leads`,
          count: result.count,
        });

      case "assign":
        if (!data?.assignedBdId) {
          return NextResponse.json(
            { error: "assignedBdId is required for assign action" },
            { status: 400 }
          );
        }

        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { assignedBdId: data.assignedBdId },
        });

        return NextResponse.json({
          message: `Assigned ${result.count} leads`,
          count: result.count,
        });

      case "unassign":
        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { assignedBdId: null },
        });

        return NextResponse.json({
          message: `Unassigned ${result.count} leads`,
          count: result.count,
        });

      case "delete":
        // Only ADMIN and MANAGER can delete
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        result = await prisma.lead.deleteMany({
          where: { id: { in: leadIds } },
        });

        return NextResponse.json({
          message: `Deleted ${result.count} leads`,
          count: result.count,
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}

