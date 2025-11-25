import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: any = {
      userId: session.user.id,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      title,
      description,
      startTime,
      endTime,
      location,
      meetingType,
      attendees,
      reminders,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ["scheduled", "confirmed"],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Time slot conflict",
          conflicts: conflicts.map((b) => ({
            id: b.id,
            title: b.title,
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        leadId: leadId || null,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        meetingType: meetingType || "meeting",
        status: "scheduled",
        attendees: attendees || null,
        reminders: reminders || null,
      },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
      },
    });

    // Log activity if linked to a lead
    if (leadId) {
      await prisma.activityLog.create({
        data: {
          leadId,
          userId: session.user.id,
          type: "NOTE",
          metadata: {
            note: `Meeting scheduled: ${title}`,
            bookingId: booking.id,
            startTime: booking.startTime,
          },
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}





