import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get weekly assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("week"); // Format: YYYY-MM-DD (Monday of the week)
    const userId = searchParams.get("userId");
    const campaignId = searchParams.get("campaignId");

    if (!weekStart) {
      return NextResponse.json(
        { error: "Week start date is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const weekDate = new Date(weekStart);
    weekDate.setHours(0, 0, 0, 0);

    // Ensure it's a Monday
    const dayOfWeek = weekDate.getDay();
    if (dayOfWeek !== 1) {
      // Adjust to the nearest Monday
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekDate.setDate(weekDate.getDate() + daysToMonday);
    }

    const where: any = {
      weekStart: weekDate,
    };

    // BD users can only see their own assignments
    if (session.user.role === "BD") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    const assignments = await prisma.weeklyAssignment.findMany({
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
        { user: { email: "asc" } },
        { campaign: { name: "asc" } },
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
      weekStart: weekDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching weekly assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly assignments" },
      { status: 500 }
    );
  }
}

// POST - Create or update weekly assignments
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
    const { userId, campaignId, weekStart, notes } = body;

    if (!userId || !campaignId || !weekStart) {
      return NextResponse.json(
        { error: "userId, campaignId, and weekStart are required" },
        { status: 400 }
      );
    }

    const weekDate = new Date(weekStart);
    weekDate.setHours(0, 0, 0, 0);

    // Ensure it's a Monday
    const dayOfWeek = weekDate.getDay();
    if (dayOfWeek !== 1) {
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekDate.setDate(weekDate.getDate() + daysToMonday);
    }

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

    // Upsert the assignment
    const assignment = await prisma.weeklyAssignment.upsert({
      where: {
        userId_campaignId_weekStart: {
          userId,
          campaignId,
          weekStart: weekDate,
        },
      },
      create: {
        userId,
        campaignId,
        weekStart: weekDate,
        notes: notes || null,
        createdBy: session.user.id,
      },
      update: {
        notes: notes || null,
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

    // Also create a campaign assignment if it doesn't exist
    await prisma.campaignAssignment.upsert({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
      create: {
        campaignId,
        userId,
        assignedBy: session.user.id,
      },
      update: {},
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating weekly assignment:", error);
    return NextResponse.json(
      { error: "Failed to create weekly assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove weekly assignments (bulk delete support)
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
    const { ids, userId, campaignId, weekStart } = body;

    if (ids && Array.isArray(ids)) {
      // Delete by IDs
      const result = await prisma.weeklyAssignment.deleteMany({
        where: {
          id: { in: ids },
        },
      });
      return NextResponse.json({ success: true, deletedCount: result.count });
    }

    if (userId && campaignId && weekStart) {
      // Delete specific assignment
      const weekDate = new Date(weekStart);
      weekDate.setHours(0, 0, 0, 0);

      await prisma.weeklyAssignment.delete({
        where: {
          userId_campaignId_weekStart: {
            userId,
            campaignId,
            weekStart: weekDate,
          },
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Either ids or (userId, campaignId, weekStart) must be provided" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error deleting weekly assignment:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to delete weekly assignment" },
      { status: 500 }
    );
  }
}

