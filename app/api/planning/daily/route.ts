import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Helper function to parse date string without timezone issues
// Input: "YYYY-MM-DD" string
// Output: Date object at midnight in local timezone
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// GET - Get daily assignments for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const campaignId = searchParams.get("campaignId");

    // Build where clause
    const where: any = {};

    // Date range filtering (use manual parsing to avoid timezone issues)
    if (startDate && endDate) {
      where.date = {
        gte: parseDateString(startDate),
        lte: parseDateString(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: parseDateString(startDate),
      };
    }

    // BD users can only see their own assignments unless they're admin/manager
    if (session.user.role === "BD") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    const assignments = await prisma.dailyAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            account: {
              select: {
                id: true,
                companyName: true,
              },
            },
            _count: {
              select: {
                leads: true,
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
      orderBy: [
        { date: "asc" },
        { timeSlot: "asc" },
        { user: { email: "asc" } },
      ],
    });

    // Get all BDs for the planning view (admins/managers only)
    let users: any[] = [];
    if (["ADMIN", "MANAGER"].includes(session.user.role)) {
      users = await prisma.user.findMany({
        where: {
          role: "BD",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          avatar: true,
        },
        orderBy: { email: "asc" },
      });
    }

    // Get all active campaigns for the planning view
    let campaigns: any[] = [];
    if (["ADMIN", "MANAGER"].includes(session.user.role)) {
      campaigns = await prisma.campaign.findMany({
        where: {
          status: "Active",
        },
        select: {
          id: true,
          name: true,
          account: {
            select: {
              id: true,
              companyName: true,
            },
          },
          _count: {
            select: {
              leads: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      assignments,
      users,
      campaigns,
    });
  } catch (error) {
    console.error("Error fetching daily assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily assignments" },
      { status: 500 }
    );
  }
}

// POST - Create or update daily assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can create assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, campaignId, date, timeSlot, notes } = body;

    if (!userId || !campaignId || !date || !timeSlot) {
      return NextResponse.json(
        { error: "userId, campaignId, date, and timeSlot are required" },
        { status: 400 }
      );
    }

    // Validate timeSlot
    if (!["full_day", "morning", "afternoon"].includes(timeSlot)) {
      return NextResponse.json(
        { error: "timeSlot must be 'full_day', 'morning', or 'afternoon'" },
        { status: 400 }
      );
    }

    // Parse date string manually to avoid timezone issues
    const assignmentDate = parseDateString(date);

    // Verify user exists and is a BD
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Handle full_day: remove any existing morning/afternoon slots
    if (timeSlot === "full_day") {
      await prisma.dailyAssignment.deleteMany({
        where: {
          userId,
          date: assignmentDate,
          timeSlot: { in: ["morning", "afternoon"] },
          campaignId, // Only delete same campaign assignments
        },
      });
    }

    // Handle morning/afternoon: remove existing full_day slot for same campaign
    if (timeSlot === "morning" || timeSlot === "afternoon") {
      await prisma.dailyAssignment.deleteMany({
        where: {
          userId,
          date: assignmentDate,
          timeSlot: "full_day",
          campaignId, // Only delete same campaign assignments
        },
      });
    }

    // Upsert the assignment
    const assignment = await prisma.dailyAssignment.upsert({
      where: {
        userId_date_timeSlot: {
          userId,
          date: assignmentDate,
          timeSlot,
        },
      },
      update: {
        campaignId,
        notes: notes || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        campaignId,
        date: assignmentDate,
        timeSlot,
        notes: notes || null,
        createdBy: session.user.id,
      },
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

    // Create notification for the assigned BD
    const timeSlotLabel = timeSlot === "full_day" 
      ? "toute la journée" 
      : timeSlot === "morning" 
        ? "le matin" 
        : "l'après-midi";
    
    const formattedDate = assignmentDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "bd_assigned",
        title: "Nouvelle assignation",
        message: `Vous avez été assigné(e) à la campagne "${assignment.campaign.name}" pour ${formattedDate} (${timeSlotLabel}).`,
        priority: "medium",
        actionUrl: `/planning`,
        actionLabel: "Voir le planning",
        data: {
          assignmentId: assignment.id,
          campaignId: assignment.campaignId,
          campaignName: assignment.campaign.name,
          date: assignmentDate.toISOString(),
          timeSlot,
          assignedBy: session.user.email,
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating daily assignment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create daily assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete assignments
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, campaignId, date, timeSlot } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    // Parse date string manually to avoid timezone issues
    const assignmentDate = parseDateString(date);

    const where: any = {
      userId,
      date: assignmentDate,
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (timeSlot) {
      where.timeSlot = timeSlot;
    }

    await prisma.dailyAssignment.deleteMany({ where });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting daily assignments:", error);
    return NextResponse.json(
      { error: "Failed to delete daily assignments" },
      { status: 500 }
    );
  }
}

