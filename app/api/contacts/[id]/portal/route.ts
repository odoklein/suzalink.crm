/**
 * Contact Portal Access API
 * 
 * GET /api/contacts/[id]/portal - Get portal status
 * PUT /api/contacts/[id]/portal - Enable/disable portal access
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const contact = await prisma.interlocuteur.findUnique({
      where: { id },
      select: {
        id: true,
        portalEnabled: true,
        lastPortalAccess: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Error fetching portal status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch portal status" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { enabled } = body;

    // Get the contact
    const contact = await prisma.interlocuteur.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (enabled && !contact.email) {
      return NextResponse.json(
        { error: "Contact must have an email to enable portal access" },
        { status: 400 }
      );
    }

    // Update portal access
    const updated = await prisma.interlocuteur.update({
      where: { id },
      data: {
        portalEnabled: enabled,
        // Clear token when disabling
        ...(enabled === false && {
          portalToken: null,
          portalTokenExpiry: null,
        }),
      },
      select: {
        id: true,
        portalEnabled: true,
        lastPortalAccess: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating portal access:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update portal access" },
      { status: 500 }
    );
  }
}









