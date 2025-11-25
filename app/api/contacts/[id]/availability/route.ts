/**
 * Contact Availability API (CRM Side)
 * 
 * GET /api/contacts/[id]/availability
 * Returns availability slots for a contact (read-only for CRM users)
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

    const slots = await prisma.contactAvailability.findMany({
      where: { contactId: id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (error: any) {
    console.error("Error fetching contact availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

