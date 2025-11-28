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
        calendarIntegrations: true,
        availabilitySlots: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check access
    if (session.user.role === "BD" && contact.account.assignedBDs.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      calendars: contact.calendarIntegrations,
      availability: contact.availabilitySlots,
    });
  } catch (error) {
    console.error("Error fetching contact calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact calendar" },
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
    const { provider, accessToken, refreshToken, email, tokenExpiry } = body;

    if (!provider || !accessToken || !email) {
      return NextResponse.json(
        { error: "Provider, access token, and email are required" },
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

    // Check access (only admin/manager can link calendars)
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create or update calendar integration
    const integration = await prisma.contactCalendarIntegration.upsert({
      where: {
        contactId_provider: {
          contactId,
          provider,
        },
      },
      create: {
        contactId,
        provider,
        accessToken,
        refreshToken: refreshToken || null,
        email,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        isActive: true,
      },
      update: {
        accessToken,
        refreshToken: refreshToken || undefined,
        email,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        isActive: true,
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating contact calendar:", error);
    return NextResponse.json(
      { error: "Failed to create/update contact calendar" },
      { status: 500 }
    );
  }
}

