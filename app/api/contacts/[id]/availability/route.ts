import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contactId } = await params;

    const availability = await prisma.contactAvailability.findMany({
      where: { contactId },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching contact availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contactId } = await params;
    const body = await request.json();
    const { dayOfWeek, startTime, endTime, timezone, isRecurring, specificDate } = body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Day of week, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Verify contact exists and user has access
    const contact = await prisma.interlocuteur.findUnique({
      where: { id: contactId },
      include: {
        account: {
          include: {
            assignedBDs: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check access (admin/manager can manage all, BD only assigned accounts)
    if (session.user.role === "BD" && contact.account.assignedBDs.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const availability = await prisma.contactAvailability.create({
      data: {
        contactId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        timezone: timezone || "Europe/Paris",
        isRecurring: isRecurring !== false,
        specificDate: specificDate ? new Date(specificDate) : null,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error("Error creating contact availability:", error);
    return NextResponse.json(
      { error: "Failed to create availability" },
      { status: 500 }
    );
  }
}
