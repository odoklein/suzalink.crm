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

    const assignments = await prisma.accountAssignment.findMany({
      where: { accountId: id },
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
    console.error("Error fetching account assignments:", error);
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

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Delete existing assignments
    await prisma.accountAssignment.deleteMany({
      where: { accountId: id },
    });

    // Create new assignments
    if (userIds.length > 0) {
      await prisma.accountAssignment.createMany({
        data: userIds.map((userId: string) => ({
          accountId: id,
          userId,
          assignedBy: session.user.id,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch updated assignments
    const assignments = await prisma.accountAssignment.findMany({
      where: { accountId: id },
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
    console.error("Error assigning BDs to account:", error);
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

    await prisma.accountAssignment.deleteMany({
      where: {
        accountId: id,
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

