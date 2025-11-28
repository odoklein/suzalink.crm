import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - List all statuses for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const statuses = await prisma.leadStatusConfig.findMany({
      where: { campaignId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching campaign statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch statuses" },
      { status: 500 }
    );
  }
}

// POST - Create a new status for a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can create statuses
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { name, color, isDefault, isFinal } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Status name is required" },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get the highest order value
    const maxOrder = await prisma.leadStatusConfig.aggregate({
      where: { campaignId },
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    // If this status is set as default, unset other defaults
    if (isDefault) {
      await prisma.leadStatusConfig.updateMany({
        where: { campaignId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const status = await prisma.leadStatusConfig.create({
      data: {
        campaignId,
        name,
        color: color || "#6B7280",
        order: newOrder,
        isDefault: isDefault || false,
        isFinal: isFinal || false,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error("Error creating campaign status:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A status with this name already exists in this campaign" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create status" },
      { status: 500 }
    );
  }
}

// PUT - Reorder statuses (bulk update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can reorder statuses
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { statuses } = body; // Array of { id, order }

    if (!Array.isArray(statuses)) {
      return NextResponse.json(
        { error: "statuses must be an array of { id, order }" },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Update all statuses in a transaction
    await prisma.$transaction(
      statuses.map((s: { id: string; order: number }) =>
        prisma.leadStatusConfig.update({
          where: { id: s.id },
          data: { order: s.order },
        })
      )
    );

    // Return updated statuses
    const updatedStatuses = await prisma.leadStatusConfig.findMany({
      where: { campaignId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(updatedStatuses);
  } catch (error) {
    console.error("Error reordering campaign statuses:", error);
    return NextResponse.json(
      { error: "Failed to reorder statuses" },
      { status: 500 }
    );
  }
}

