/**
 * Outlook Calendar Connect API
 * 
 * POST /api/contact-portal/calendar/outlook/connect
 * Initiates Outlook OAuth flow
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validatePortalSession } from "@/lib/contact-portal-auth";
import { outlookCalendar } from "@/lib/calendar-providers";

const SESSION_COOKIE_NAME = "contact_portal_session";

export async function POST(request: NextRequest) {
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

    const authUrl = outlookCalendar.getAuthUrl(session.contact.id);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error initiating Outlook OAuth:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate Outlook OAuth" },
      { status: 500 }
    );
  }
}









