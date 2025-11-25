/**
 * Contact Portal Availability API
 * 
 * GET /api/contact-portal/availability - Get availability slots
 * PUT /api/contact-portal/availability - Update availability slots
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validatePortalSession } from "@/lib/contact-portal-auth";

const SESSION_COOKIE_NAME = "contact_portal_session";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session.valid || !session.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slots = await prisma.contactAvailability.findMany({
      where: { contactId: session.contact.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session.valid || !session.contact) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slots, timezone } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Invalid slots data" },
        { status: 400 }
      );
    }

    const contactId = session.contact.id;

    // Delete all existing slots
    await prisma.contactAvailability.deleteMany({
      where: { contactId },
    });

    // Create new slots
    if (slots.length > 0) {
      await prisma.contactAvailability.createMany({
        data: slots.map((slot: any) => ({
          contactId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: timezone || slot.timezone || "Europe/Paris",
          isRecurring: slot.isRecurring !== false,
          specificDate: slot.specificDate || null,
        })),
      });
    }

    // Fetch updated slots
    const updatedSlots = await prisma.contactAvailability.findMany({
      where: { contactId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(updatedSlots);
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update availability" },
      { status: 500 }
    );
  }
}


