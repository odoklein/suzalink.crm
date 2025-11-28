import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get a single daily assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.dailyAssignment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // BD users can only see their own assignments
    if (session.user.role === "BD" && assignment.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching daily assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily assignment" },
      { status: 500 }
    );
  }
}

// PATCH - Update a daily assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can update assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { campaignId, timeSlot, notes } = body;

    const existingAssignment = await prisma.dailyAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }
      updateData.campaignId = campaignId;
    }

    if (timeSlot) {
      if (!["full_day", "morning", "afternoon"].includes(timeSlot)) {
        return NextResponse.json(
          { error: "timeSlot must be 'full_day', 'morning', or 'afternoon'" },
          { status: 400 }
        );
      }
      updateData.timeSlot = timeSlot;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const assignment = await prisma.dailyAssignment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating daily assignment:", error);
    return NextResponse.json(
      { error: "Failed to update daily assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a daily assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    const existingAssignment = await prisma.dailyAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.dailyAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete daily assignment" },
      { status: 500 }
    );
  }
}

