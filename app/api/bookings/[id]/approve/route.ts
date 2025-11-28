import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST - Approve a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can approve bookings
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: bookingId } = await params;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: {
          select: {
            id: true,
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

    if (booking.approvalStatus === "approved") {
      return NextResponse.json(
        { error: "Booking is already approved" },
        { status: 400 }
      );
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        approvalStatus: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        status: "confirmed", // Also update status to confirmed
      },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        meetingType: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the booking owner
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: "booking_approved",
        title: "RDV Approuvé",
        message: `Votre RDV "${booking.title}" a été approuvé`,
        data: {
          bookingId: booking.id,
          approvedBy: session.user.email,
        },
        actionUrl: `/calendar?bookingId=${booking.id}`,
        actionLabel: "Voir le RDV",
      },
    });

    // Log activity if linked to a lead
    if (booking.lead) {
      await prisma.activityLog.create({
        data: {
          leadId: booking.lead.id,
          userId: session.user.id,
          type: "NOTE",
          metadata: {
            note: `Booking approved: ${booking.title}`,
            bookingId: booking.id,
            approvedBy: session.user.id,
          },
        },
      });
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error approving booking:", error);
    return NextResponse.json(
      { error: "Failed to approve booking" },
      { status: 500 }
    );
  }
}

