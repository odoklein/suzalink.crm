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

    const assignments = await prisma.campaignAssignment.findMany({
      where: { campaignId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching campaign assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can assign
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { userIds } = body; // Array of user IDs

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "userIds must be an array" },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Delete existing assignments
    await prisma.campaignAssignment.deleteMany({
      where: { campaignId: id },
    });

    // Create new assignments
    if (userIds.length > 0) {
      await prisma.campaignAssignment.createMany({
        data: userIds.map((userId: string) => ({
          campaignId: id,
          userId,
          assignedBy: session.user.id,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch updated assignments
    const assignments = await prisma.campaignAssignment.findMany({
      where: { campaignId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error assigning BDs to campaign:", error);
    return NextResponse.json(
      { error: "Failed to assign BDs" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can unassign
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await prisma.campaignAssignment.deleteMany({
      where: {
        campaignId: id,
        userId,
      },
    });

    return NextResponse.json({ message: "Assignment removed" });
  } catch (error) {
    console.error("Error removing assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}

