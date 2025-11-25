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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access (only owner or admin/manager can view)
    if (
      booking.userId !== session.user.id &&
      !["ADMIN", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check ownership
    if (existingBooking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingType,
      status,
      attendees,
      reminders,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (meetingType !== undefined) updateData.meetingType = meetingType;
    if (status !== undefined) updateData.status = status;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (reminders !== undefined) updateData.reminders = reminders;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
      },
    });

    // Log activity if status changed
    if (status && status !== existingBooking.status && existingBooking.leadId) {
      await prisma.activityLog.create({
        data: {
          leadId: existingBooking.leadId,
          userId: session.user.id,
          type: "NOTE",
          metadata: {
            note: `Meeting ${status}: ${existingBooking.title}`,
            bookingId: booking.id,
            oldStatus: existingBooking.status,
            newStatus: status,
          },
        },
      });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check ownership
    if (existingBooking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    // Log activity if linked to a lead
    if (existingBooking.leadId) {
      await prisma.activityLog.create({
        data: {
          leadId: existingBooking.leadId,
          userId: session.user.id,
          type: "NOTE",
          metadata: {
            note: `Meeting cancelled: ${existingBooking.title}`,
            bookingId: id,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}





