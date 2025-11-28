/**
 * Calendar Integration Actions API
 * 
 * DELETE /api/contact-portal/calendar/[id]
 * Disconnects a calendar integration
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validatePortalSession } from "@/lib/contact-portal-auth";

const SESSION_COOKIE_NAME = "contact_portal_session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify the integration belongs to this contact
    const integration = await prisma.contactCalendarIntegration.findFirst({
      where: {
        id,
        contactId: session.contact.id,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Delete the integration
    await prisma.contactCalendarIntegration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error disconnecting calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}









