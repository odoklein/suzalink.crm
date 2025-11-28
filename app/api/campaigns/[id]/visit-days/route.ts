import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - List all visit days for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const whereClause: any = { campaignId };

    // Add date range filter if provided
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const visitDays = await prisma.campaignVisitDay.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(visitDays);
  } catch (error) {
    console.error("Error fetching visit days:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit days" },
      { status: 500 }
    );
  }
}

// POST - Create visit days for a campaign (supports multiple dates)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can manage visit days
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { dates, notes } = body; // dates can be a single date string or array of date strings

    if (!dates) {
      return NextResponse.json(
        { error: "At least one date is required" },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Normalize dates to array
    const dateArray = Array.isArray(dates) ? dates : [dates];

    // Create visit days (upsert to avoid duplicates)
    const results = await Promise.all(
      dateArray.map(async (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0); // Normalize to start of day

        return prisma.campaignVisitDay.upsert({
          where: {
            campaignId_date: {
              campaignId,
              date,
            },
          },
          create: {
            campaignId,
            date,
            notes: notes || null,
          },
          update: {
            notes: notes || null,
          },
        });
      })
    );

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    console.error("Error creating visit days:", error);
    return NextResponse.json(
      { error: "Failed to create visit days" },
      { status: 500 }
    );
  }
}

// DELETE - Remove multiple visit days
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can manage visit days
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { dates, ids } = body; // Can delete by dates or by ids

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    let deletedCount = 0;

    if (ids && Array.isArray(ids)) {
      // Delete by IDs
      const result = await prisma.campaignVisitDay.deleteMany({
        where: {
          id: { in: ids },
          campaignId, // Ensure we only delete from this campaign
        },
      });
      deletedCount = result.count;
    } else if (dates) {
      // Delete by dates
      const dateArray = Array.isArray(dates) ? dates : [dates];
      const parsedDates = dateArray.map((d: string) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const result = await prisma.campaignVisitDay.deleteMany({
        where: {
          campaignId,
          date: { in: parsedDates },
        },
      });
      deletedCount = result.count;
    } else {
      return NextResponse.json(
        { error: "Either dates or ids must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("Error deleting visit days:", error);
    return NextResponse.json(
      { error: "Failed to delete visit days" },
      { status: 500 }
    );
  }
}

