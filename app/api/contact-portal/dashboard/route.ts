/**
 * Contact Portal Dashboard API
 * 
 * GET /api/contact-portal/dashboard
 * Returns dashboard data for the authenticated contact
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validatePortalSession } from "@/lib/contact-portal-auth";

export const runtime = "nodejs";

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

    const contactId = session.contact.id;

    // Get calendar integrations count
    const calendarIntegrations = await prisma.contactCalendarIntegration.count({
      where: { contactId, isActive: true },
    });

    // Get availability slots count
    const availabilitySlots = await prisma.contactAvailability.count({
      where: { contactId },
    });

    // Get bookings counts
    const now = new Date();
    const [upcomingBookings, pastBookings] = await Promise.all([
      prisma.contactBooking.count({
        where: {
          contactId,
          startTime: { gte: now },
          status: { not: "cancelled" },
        },
      }),
      prisma.contactBooking.count({
        where: {
          contactId,
          endTime: { lt: now },
        },
      }),
    ]);

    // Get upcoming bookings details
    const upcomingBookingsDetails = await prisma.contactBooking.findMany({
      where: {
        contactId,
        startTime: { gte: now },
        status: { not: "cancelled" },
      },
      orderBy: { startTime: "asc" },
      take: 5,
      include: {
        user: {
          select: { email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      contact: session.contact,
      stats: {
        calendarConnected: calendarIntegrations > 0,
        availabilitySlotsCount: availabilitySlots,
        upcomingBookingsCount: upcomingBookings,
        pastBookingsCount: pastBookings,
      },
      upcomingBookings: upcomingBookingsDetails,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}









