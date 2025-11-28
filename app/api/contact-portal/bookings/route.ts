/**
 * Contact Portal Bookings API (Read-Only)
 * 
 * GET /api/contact-portal/bookings
 * Returns bookings for campaigns under the contact's account
 * Contacts can only view bookings, not create/modify them
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

    // Get the contact's account
    const contact = await prisma.interlocuteur.findUnique({
      where: { id: contactId },
      select: {
        accountId: true,
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const now = new Date();

    // Get upcoming bookings for leads in campaigns under this account
    const upcoming = await prisma.booking.findMany({
      where: {
        lead: {
          campaign: {
            accountId: contact.accountId,
          },
        },
        startTime: { gte: now },
        approvalStatus: "approved", // Only show approved bookings to contacts
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        location: true,
        address: true,
        city: true,
        meetingType: {
          select: {
            name: true,
            icon: true,
            color: true,
            isPhysical: true,
          },
        },
        user: {
          select: { 
            email: true, 
            avatar: true,
          },
        },
        lead: {
          select: {
            standardData: true,
            campaign: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get past bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const past = await prisma.booking.findMany({
      where: {
        lead: {
          campaign: {
            accountId: contact.accountId,
          },
        },
        endTime: { lt: now, gte: thirtyDaysAgo },
        approvalStatus: "approved",
      },
      orderBy: { startTime: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        location: true,
        address: true,
        city: true,
        meetingType: {
          select: {
            name: true,
            icon: true,
            color: true,
            isPhysical: true,
          },
        },
        user: {
          select: { 
            email: true, 
            avatar: true,
          },
        },
        lead: {
          select: {
            standardData: true,
            campaign: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get campaign visit days (physical visit calendar)
    const visitDays = await prisma.campaignVisitDay.findMany({
      where: {
        campaign: {
          accountId: contact.accountId,
        },
        date: { gte: now },
      },
      orderBy: { date: "asc" },
      take: 30,
      select: {
        id: true,
        date: true,
        notes: true,
        campaign: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      upcoming, 
      past, 
      visitDays,
      account: contact.account,
    });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
