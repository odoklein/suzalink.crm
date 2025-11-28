import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get a single meeting type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, typeId } = await params;

    const meetingType = await prisma.campaignMeetingType.findFirst({
      where: { id: typeId, campaignId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!meetingType) {
      return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
    }

    return NextResponse.json(meetingType);
  } catch (error) {
    console.error("Error fetching meeting type:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting type" },
      { status: 500 }
    );
  }
}

// PUT - Update a meeting type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can update meeting types
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, typeId } = await params;
    const body = await request.json();
    const { name, icon, color, duration, isPhysical } = body;

    // Verify meeting type exists and belongs to campaign
    const existingType = await prisma.campaignMeetingType.findFirst({
      where: { id: typeId, campaignId },
    });

    if (!existingType) {
      return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
    }

    const meetingType = await prisma.campaignMeetingType.update({
      where: { id: typeId },
      data: {
        name: name !== undefined ? name : undefined,
        icon: icon !== undefined ? icon : undefined,
        color: color !== undefined ? color : undefined,
        duration: duration !== undefined ? duration : undefined,
        isPhysical: isPhysical !== undefined ? isPhysical : undefined,
      },
    });

    return NextResponse.json(meetingType);
  } catch (error: any) {
    console.error("Error updating meeting type:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A meeting type with this name already exists in this campaign" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update meeting type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a meeting type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete meeting types
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, typeId } = await params;

    // Verify meeting type exists and belongs to campaign
    const existingType = await prisma.campaignMeetingType.findFirst({
      where: { id: typeId, campaignId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!existingType) {
      return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
    }

    // Check if there are bookings using this type - warn but allow delete
    // Bookings will have their meetingTypeId set to null
    if (existingType._count.bookings > 0) {
      console.warn(`Deleting meeting type ${typeId} with ${existingType._count.bookings} bookings`);
    }

    await prisma.campaignMeetingType.delete({
      where: { id: typeId },
    });

    return NextResponse.json({ 
      success: true,
      affectedBookings: existingType._count.bookings,
    });
  } catch (error) {
    console.error("Error deleting meeting type:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting type" },
      { status: 500 }
    );
  }
}

