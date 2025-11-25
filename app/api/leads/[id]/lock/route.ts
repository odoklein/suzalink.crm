import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        lockedAt: new Date(),
        lockedByUserId: session.user.id,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error locking lead:", error);
    return NextResponse.json(
      { error: "Failed to lock lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        lockedAt: null,
        lockedByUserId: null,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error unlocking lead:", error);
    return NextResponse.json(
      { error: "Failed to unlock lead" },
      { status: 500 }
    );
  }
}

