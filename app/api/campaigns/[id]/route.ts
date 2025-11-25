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
    
    // For BD users, check if they're assigned to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: id,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Campaign not found or access denied" },
          { status: 404 }
        );
      }
    }
    // ADMIN and MANAGER can access any campaign

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        account: true,
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
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

    // Only ADMIN and MANAGER can update campaigns
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, status, startDate, schemaConfig } = body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(schemaConfig !== undefined && { schemaConfig }),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
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

    // Only ADMIN can delete campaigns
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

