import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get a single visit day
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, dayId } = await params;

    const visitDay = await prisma.campaignVisitDay.findFirst({
      where: { id: dayId, campaignId },
    });

    if (!visitDay) {
      return NextResponse.json({ error: "Visit day not found" }, { status: 404 });
    }

    return NextResponse.json(visitDay);
  } catch (error) {
    console.error("Error fetching visit day:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit day" },
      { status: 500 }
    );
  }
}

// PUT - Update a visit day's notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can update visit days
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, dayId } = await params;
    const body = await request.json();
    const { notes } = body;

    // Verify visit day exists and belongs to campaign
    const existingDay = await prisma.campaignVisitDay.findFirst({
      where: { id: dayId, campaignId },
    });

    if (!existingDay) {
      return NextResponse.json({ error: "Visit day not found" }, { status: 404 });
    }

    const visitDay = await prisma.campaignVisitDay.update({
      where: { id: dayId },
      data: { notes },
    });

    return NextResponse.json(visitDay);
  } catch (error) {
    console.error("Error updating visit day:", error);
    return NextResponse.json(
      { error: "Failed to update visit day" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a single visit day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete visit days
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, dayId } = await params;

    // Verify visit day exists and belongs to campaign
    const existingDay = await prisma.campaignVisitDay.findFirst({
      where: { id: dayId, campaignId },
    });

    if (!existingDay) {
      return NextResponse.json({ error: "Visit day not found" }, { status: 404 });
    }

    await prisma.campaignVisitDay.delete({
      where: { id: dayId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit day:", error);
    return NextResponse.json(
      { error: "Failed to delete visit day" },
      { status: 500 }
    );
  }
}

