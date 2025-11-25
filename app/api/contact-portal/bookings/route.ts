/**
 * Contact Portal Bookings API
 * 
 * GET /api/contact-portal/bookings
 * Returns bookings for the authenticated contact
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

    const now = new Date();
    const contactId = session.contact.id;

    // Get upcoming bookings
    const upcoming = await prisma.contactBooking.findMany({
      where: {
        contactId,
        startTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
      include: {
        user: {
          select: { email: true, avatar: true },
        },
      },
    });

    // Get past bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const past = await prisma.contactBooking.findMany({
      where: {
        contactId,
        endTime: { lt: now, gte: thirtyDaysAgo },
      },
      orderBy: { startTime: "desc" },
      take: 20,
      include: {
        user: {
          select: { email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ upcoming, past });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}


