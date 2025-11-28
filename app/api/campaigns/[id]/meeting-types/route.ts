import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - List all meeting types for a campaign
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

    const meetingTypes = await prisma.campaignMeetingType.findMany({
      where: { campaignId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    return NextResponse.json(meetingTypes);
  } catch (error) {
    console.error("Error fetching meeting types:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting types" },
      { status: 500 }
    );
  }
}

// POST - Create a new meeting type for a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can create meeting types
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { name, icon, color, duration, isPhysical } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Meeting type name is required" },
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
    const maxOrder = await prisma.campaignMeetingType.aggregate({
      where: { campaignId },
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    const meetingType = await prisma.campaignMeetingType.create({
      data: {
        campaignId,
        name,
        icon: icon || null,
        color: color || "#3B82F6",
        duration: duration || 60,
        isPhysical: isPhysical || false,
        order: newOrder,
      },
    });

    return NextResponse.json(meetingType, { status: 201 });
  } catch (error: any) {
    console.error("Error creating meeting type:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A meeting type with this name already exists in this campaign" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create meeting type" },
      { status: 500 }
    );
  }
}

// PUT - Reorder meeting types (bulk update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can reorder meeting types
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { meetingTypes } = body; // Array of { id, order }

    if (!Array.isArray(meetingTypes)) {
      return NextResponse.json(
        { error: "meetingTypes must be an array of { id, order }" },
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

    // Update all meeting types in a transaction
    await prisma.$transaction(
      meetingTypes.map((mt: { id: string; order: number }) =>
        prisma.campaignMeetingType.update({
          where: { id: mt.id },
          data: { order: mt.order },
        })
      )
    );

    // Return updated meeting types
    const updatedMeetingTypes = await prisma.campaignMeetingType.findMany({
      where: { campaignId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(updatedMeetingTypes);
  } catch (error) {
    console.error("Error reordering meeting types:", error);
    return NextResponse.json(
      { error: "Failed to reorder meeting types" },
      { status: 500 }
    );
  }
}

