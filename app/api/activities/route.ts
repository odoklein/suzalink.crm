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
    const { leadId, type, metadata } = body;

    if (!leadId || !type) {
      return NextResponse.json(
        { error: "Lead ID and type are required" },
        { status: 400 }
      );
    }

    // For BD users, verify they have access to this lead's campaign
    if (session.user.role === "BD") {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { campaignId: true },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

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

    const activity = await prisma.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        type,
        metadata: metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

