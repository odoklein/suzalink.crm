/**
 * Contact Portal Calendar API
 * 
 * GET /api/contact-portal/calendar
 * Returns calendar integrations for the authenticated contact
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

    const integrations = await prisma.contactCalendarIntegration.findMany({
      where: { contactId: session.contact.id },
      select: {
        id: true,
        provider: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(integrations);
  } catch (error: any) {
    console.error("Error fetching calendar integrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar integrations" },
      { status: 500 }
    );
  }
}

